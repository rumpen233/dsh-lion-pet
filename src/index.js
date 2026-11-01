/**
 * dsh-lion-pet — host half.
 *
 * Owns the small config file shared by the in-page pet and the optional
 * always-on-top Electron overlay. The overlay is a separate transparent
 * window so the lion can live outside the DSH page without covering the app
 * with a giant click-blocking surface.
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const name = 'lion-pet'

const ROUTE_PREFIX = '/dsh-lion-pet'
const MODES = new Set(['desktop', 'web', 'both', 'off'])
const PACKAGE_ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const DSH_HOME = process.env.DSH_HOME || join(homedir(), '.dsh')
const CONFIG_DIR = join(DSH_HOME, 'dsh-lion-pet')
const CONFIG_PATH = join(CONFIG_DIR, 'config.json')
const HELPER_DIR = join(PACKAGE_ROOT, 'runtime', 'desktop-helper')

function normalizeConfig(value) {
	const source = value && typeof value === 'object' ? value : {}
	const display = MODES.has(source.display) ? source.display : 'both'
	return { display }
}

function readConfig() {
	try {
		return normalizeConfig(JSON.parse(readFileSync(CONFIG_PATH, 'utf8')))
	} catch {
		return { display: 'both' }
	}
}

function writeConfig(config) {
	mkdirSync(CONFIG_DIR, { recursive: true })
	const next = normalizeConfig(config)
	const tmp = CONFIG_PATH + '.tmp'
	writeFileSync(tmp, JSON.stringify(next, null, 2) + '\n', 'utf8')
	renameSync(tmp, CONFIG_PATH)
	return next
}

function sendJson(res, status, obj) {
	const body = JSON.stringify(obj)
	res.writeHead(status, {
		'content-type': 'application/json; charset=utf-8',
		'content-length': Buffer.byteLength(body),
		'cache-control': 'no-store',
		'access-control-allow-origin': '*',
	})
	res.end(body)
}

async function readBody(req) {
	let size = 0
	const chunks = []
	for await (const chunk of req) {
		size += chunk.length
		if (size > 16 * 1024) throw new Error('body too large')
		chunks.push(chunk)
	}
	return Buffer.concat(chunks).toString('utf8')
}

function resolveElectron() {
	const candidates = [
		process.env.DSH_LION_ELECTRON_PATH,
		process.env.DSH_PET_ELECTRON_PATH,
		join(DSH_HOME, 'electron', 'electron.exe'),
		join(DSH_HOME, 'electron', 'electron'),
	]
	for (const candidate of candidates) {
		if (candidate && existsSync(candidate)) return candidate
	}
	return null
}

function desktopVisible(display) {
	return display === 'desktop' || display === 'both'
}

export function apply(ctx) {
	let helper = null
	let helperTimer = null
	let helperRetry = null
	let retryDelay = 800
	let port = 0
	let disposed = false

	const log = (level, message) => {
		try {
			ctx.logger?.[level]?.(`[dsh-lion-pet] ${message}`)
		} catch {
			/* logger is best-effort */
		}
	}

	const clearRetry = () => {
		if (helperRetry) {
			clearTimeout(helperRetry)
			helperRetry = null
		}
	}

	const stopHelper = (reason = 'stop') => {
		clearRetry()
		const child = helper
		helper = null
		if (!child) return
		log('info', `desktop helper stopped (${reason})`)
		try {
			child.kill()
		} catch {
			/* already gone */
		}
	}

	const scheduleStart = (delay) => {
		if (disposed || helperRetry) return
		helperRetry = setTimeout(() => {
			helperRetry = null
			startHelper()
		}, delay)
		helperRetry.unref?.()
	}

	const startHelper = () => {
		if (disposed || helper) return
		const config = readConfig()
		if (!desktopVisible(config.display)) return
		if (!port) {
			scheduleStart(500)
			return
		}
		if (!existsSync(HELPER_DIR)) {
			log('warn', `desktop helper missing: ${HELPER_DIR}`)
			return
		}
		const electron = resolveElectron()
		if (!electron) {
			log('warn', 'Electron not found; desktop mode is unavailable. Set DSH_LION_ELECTRON_PATH to electron.exe.')
			return
		}
		const env = {
			...process.env,
			DSH_LION_CONFIG_URL: `http://127.0.0.1:${port}${ROUTE_PREFIX}/config`,
			DSH_LION_DISPLAY: config.display,
			DSH_LION_HOME: CONFIG_DIR,
		}
		// Electron refuses to boot as a GUI app when this is inherited from the
		// DSH host process (which runs as Node).
		delete env.ELECTRON_RUN_AS_NODE

		let child
		try {
			child = spawn(electron, [HELPER_DIR], {
				cwd: DSH_HOME,
				env,
				stdio: ['ignore', 'pipe', 'pipe'],
				windowsHide: false,
			})
		} catch (error) {
			log('warn', `desktop helper spawn failed: ${error instanceof Error ? error.message : String(error)}`)
			scheduleStart(Math.min(10000, (retryDelay *= 1.7)))
			return
		}
		helper = child
		retryDelay = 800
		log('info', `desktop helper started (${electron})`)

		const forward = (stream, level) => {
			stream?.setEncoding?.('utf8')
			stream?.on?.('data', (chunk) => {
				const text = String(chunk).trim()
				if (text) log(level, text.slice(0, 800))
			})
		}
		forward(child.stdout, 'info')
		forward(child.stderr, 'warn')

		child.on('error', (error) => {
			log('warn', `desktop helper error: ${error instanceof Error ? error.message : String(error)}`)
		})
		child.on('exit', (code, signal) => {
			if (helper === child) helper = null
			if (disposed) return
			const current = readConfig()
			if (!desktopVisible(current.display)) return
			log('warn', `desktop helper exited (code=${code ?? 'null'}, signal=${signal ?? 'null'}); retrying`)
			scheduleStart(Math.min(10000, (retryDelay *= 1.7)))
		})
	}

	const syncHelper = () => {
		const config = readConfig()
		if (!desktopVisible(config.display)) {
			stopHelper('display-mode')
			return
		}
		if (!helper) startHelper()
	}

	ctx.effect(() => {
		let routeDispose
		if (ctx.webServer && typeof ctx.webServer.register === 'function') {
			routeDispose = ctx.webServer.register({
				kind: 'prefix',
				path: ROUTE_PREFIX,
				handler: async (req, res) => {
					try {
						const url = new URL(req.url || '/', 'http://127.0.0.1')
						if (url.pathname === ROUTE_PREFIX + '/config') {
							if (req.method === 'OPTIONS') {
								res.writeHead(204, {
									'access-control-allow-origin': '*',
									'access-control-allow-methods': 'GET, PUT, OPTIONS',
									'access-control-allow-headers': 'content-type',
								})
								res.end()
								return
							}
							if (req.method === 'GET') {
								sendJson(res, 200, { ...readConfig(), version: '1.2.0' })
								return
							}
							if (req.method === 'PUT') {
								let body
								try {
									body = JSON.parse(await readBody(req))
								} catch {
									sendJson(res, 400, { error: 'invalid JSON' })
									return
								}
								if (!body || !MODES.has(body.display)) {
									sendJson(res, 400, { error: 'display must be web, desktop, both or off' })
									return
								}
								const saved = writeConfig({ display: body.display })
								syncHelper()
								sendJson(res, 200, { ...saved, version: '1.2.0' })
								return
							}
							sendJson(res, 405, { error: 'method not allowed' })
							return
						}
						if (url.pathname === ROUTE_PREFIX + '/health') {
							sendJson(res, 200, { ok: true, display: readConfig().display, helper: Boolean(helper) })
							return
						}
						sendJson(res, 404, { error: 'not found' })
					} catch (error) {
						log('warn', `route error: ${error instanceof Error ? error.message : String(error)}`)
						try {
							sendJson(res, 500, { error: 'internal error' })
						} catch {
							/* response already closed */
						}
					}
				},
			})
		}

		helperTimer = setInterval(() => {
			const next = typeof ctx.webServer?.port === 'number' ? ctx.webServer.port : 0
			if (next > 0 && next !== port) {
				port = next
				syncHelper()
			}
		}, 500)
		helperTimer.unref?.()

		const initialPort = typeof ctx.webServer?.port === 'number' ? ctx.webServer.port : 0
		if (initialPort > 0) {
			port = initialPort
			syncHelper()
		}

		return () => {
			disposed = true
			if (helperTimer) clearInterval(helperTimer)
			helperTimer = null
			stopHelper('dispose')
			try {
				routeDispose?.()
			} catch {
				/* route already gone */
			}
		}
	}, 'dsh-lion-pet: desktop overlay + config route')
}
