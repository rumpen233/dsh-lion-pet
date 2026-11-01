'use strict'

const { app, BrowserWindow, ipcMain, screen } = require('electron')
const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('node:fs')
const { join } = require('node:path')

app.disableHardwareAcceleration()
app.commandLine.appendSwitch('force-device-scale-factor', '1')
app.setAppUserModelId('dsh-lion-pet.desktop')

const CONFIG_URL = process.env.DSH_LION_CONFIG_URL || 'http://127.0.0.1:61702/dsh-lion-pet/config'
const WIDTH = 280
const HEIGHT = 390
const statePath = () => join(app.getPath('userData'), 'window.json')

let win = null
let dragging = null
let walk = null
let walkTimer = null
let saveTimer = null
let configTimer = null
let quitting = false

function loadWindowState() {
	try {
		const value = JSON.parse(readFileSync(statePath(), 'utf8'))
		if (Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.width) && Number.isFinite(value.height)) {
			return value
		}
	} catch {
		/* first run */
	}
	return null
}

function saveWindowState() {
	if (!win || win.isDestroyed()) return
	try {
		const bounds = win.getBounds()
		const dir = app.getPath('userData')
		if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
		writeFileSync(statePath(), JSON.stringify(bounds), 'utf8')
	} catch {
		/* position persistence is best-effort */
	}
}

function initialBounds() {
	const area = screen.getPrimaryDisplay().workArea
	const saved = loadWindowState()
	const x = saved ? saved.x : area.x + area.width - WIDTH - 26
	const y = saved ? saved.y : area.y + area.height - HEIGHT - 26
	const visible = screen.getAllDisplays().some((display) => {
		const a = display.workArea
		return x + 80 > a.x && x < a.x + a.width - 40 && y + 80 > a.y && y < a.y + a.height - 40
	})
	return visible ? { x, y, width: WIDTH, height: HEIGHT } : {
		x: area.x + area.width - WIDTH - 26,
		y: area.y + area.height - HEIGHT - 26,
		width: WIDTH,
		height: HEIGHT,
	}
}

function clampToWorkArea(x, y) {
	const display = screen.getDisplayNearestPoint({
		x: Math.round(x + WIDTH / 2),
		y: Math.round(y + HEIGHT / 2),
	})
	const area = display.workArea
	const limitX = area.x + area.width - WIDTH
	const limitY = area.y + area.height - HEIGHT
	return {
		x: Math.round(Math.max(area.x, Math.min(limitX, x))),
		y: Math.round(Math.max(area.y, Math.min(limitY, y))),
	}
}

function stopWalk(notify = false) {
	if (walkTimer) {
		clearInterval(walkTimer)
		walkTimer = null
	}
	const wasWalking = Boolean(walk)
	walk = null
	if (notify && wasWalking && win && !win.isDestroyed()) {
		win.webContents.send('lion:walk-done')
	}
}

function currentGeometry() {
	const bounds = win && !win.isDestroyed() ? win.getBounds() : initialBounds()
	const display = screen.getDisplayMatching(bounds)
	return {
		bounds,
		workArea: display.workArea,
		scaleFactor: display.scaleFactor,
		displays: screen.getAllDisplays().map((item) => ({
			id: item.id,
			bounds: item.bounds,
			workArea: item.workArea,
			scaleFactor: item.scaleFactor,
		})),
	}
}

function tickWalk() {
	if (!walk || !win || win.isDestroyed()) {
		stopWalk()
		return
	}
	const progress = Math.min(1, (Date.now() - walk.startedAt) / walk.duration)
	const eased = progress < 0.5
		? 4 * progress * progress * progress
		: 1 - Math.pow(-2 * progress + 2, 3) / 2
	const x = Math.round(walk.from.x + (walk.to.x - walk.from.x) * eased)
	const y = Math.round(walk.from.y + (walk.to.y - walk.from.y) * eased)
	win.setPosition(x, y, false)
	if (progress < 1) return
	stopWalk(true)
	saveWindowState()
}

function createWindow() {
	if (win && !win.isDestroyed()) return win
	const bounds = initialBounds()
	win = new BrowserWindow({
		...bounds,
		frame: false,
		transparent: true,
		resizable: false,
		movable: true,
		alwaysOnTop: true,
		skipTaskbar: true,
		hasShadow: false,
		focusable: true,
		show: false,
		backgroundColor: '#00000000',
		webPreferences: {
			preload: join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
			spellcheck: false,
			backgroundThrottling: false,
		},
	})
	win.setAlwaysOnTop(true, 'screen-saver')
	win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
	win.loadFile(join(__dirname, 'index.html'))
	win.once('ready-to-show', () => {
		win.showInactive()
		win.setIgnoreMouseEvents(true, { forward: true })
	})
	win.on('move', () => {
		if (walk) return
		clearTimeout(saveTimer)
		saveTimer = setTimeout(saveWindowState, 260)
	})
	win.on('closed', () => {
		stopWalk()
		win = null
	})
	return win
}

function applyConfig(config) {
	if (!config || typeof config !== 'object') return
	const display = typeof config.display === 'string' ? config.display : 'both'
	if (display !== 'desktop' && display !== 'both') {
		stopWalk()
		quitting = true
		if (win && !win.isDestroyed()) win.hide()
		app.quit()
		return
	}
	createWindow()
	if (win && !win.isDestroyed() && !win.isVisible()) win.showInactive()
}

async function pollConfig() {
	try {
		const response = await fetch(CONFIG_URL, { cache: 'no-store' })
		if (!response.ok) return
		applyConfig(await response.json())
	} catch {
		/* DSH host may be starting; retry next tick */
	}
}

ipcMain.on('lion:set-interactive', (_event, interactive) => {
	if (!win || win.isDestroyed()) return
	win.setIgnoreMouseEvents(!interactive, { forward: true })
})

ipcMain.on('lion:walk-to', (_event, target) => {
	if (!win || win.isDestroyed() || dragging) return
	const x = Number(target?.x)
	const y = Number(target?.y)
	const duration = Number(target?.duration)
	if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(duration)) return
	const to = clampToWorkArea(x, y)
	const bounds = win.getBounds()
	stopWalk()
	walk = {
		from: { x: bounds.x, y: bounds.y },
		to,
		startedAt: Date.now(),
		duration: Math.max(900, Math.min(8000, Math.round(duration))),
	}
	win.setIgnoreMouseEvents(true, { forward: true })
	walkTimer = setInterval(tickWalk, 16)
})

ipcMain.on('lion:walk-stop', () => {
	stopWalk()
})

ipcMain.handle('lion:geometry', () => currentGeometry())

ipcMain.on('lion:drag-start', (_event, point) => {
	if (!win || win.isDestroyed()) return
	stopWalk()
	const bounds = win.getBounds()
	dragging = {
		startX: Number(point?.x) || 0,
		startY: Number(point?.y) || 0,
		bx: bounds.x,
		by: bounds.y,
	}
})

ipcMain.on('lion:drag-move', (_event, point) => {
	if (!dragging || !win || win.isDestroyed()) return
	const dx = (Number(point?.x) || 0) - dragging.startX
	const dy = (Number(point?.y) || 0) - dragging.startY
	win.setPosition(Math.round(dragging.bx + dx), Math.round(dragging.by + dy), false)
})

ipcMain.on('lion:drag-end', () => {
	dragging = null
	saveWindowState()
})

ipcMain.on('lion:quit', () => {
	quitting = true
	app.quit()
})

ipcMain.handle('lion:config', () => ({
	url: CONFIG_URL,
	display: process.env.DSH_LION_DISPLAY || 'both',
}))

let cursorTimer = 0
let cursorInside = null

// Electron's click-through `forward:true` can stop delivering mousemove after
// the first ignore/interactive flip on Windows. This tiny poll is the fallback:
// keep the whole (tight) pet window interactive while the cursor is over it,
// and click-through as soon as the cursor leaves.
function startCursorWatch() {
	clearInterval(cursorTimer)
	cursorTimer = setInterval(() => {
		if (!win || win.isDestroyed() || dragging || walk) return
		const bounds = win.getBounds()
		const point = screen.getCursorScreenPoint()
		const inside = point.x >= bounds.x && point.x < bounds.x + bounds.width
			&& point.y >= bounds.y && point.y < bounds.y + bounds.height
		if (inside === cursorInside) return
		cursorInside = inside
		win.setIgnoreMouseEvents(!inside, { forward: true })
	}, 70)
	cursorTimer.unref?.()
}

app.whenReady().then(() => {
	createWindow()
	startCursorWatch()
	configTimer = setInterval(pollConfig, 2500)
	configTimer.unref?.()
	pollConfig()
})

app.on('window-all-closed', () => {
	app.quit()
})

app.on('before-quit', () => {
	quitting = true
	stopWalk()
	if (configTimer) clearInterval(configTimer)
	if (cursorTimer) clearInterval(cursorTimer)
	saveWindowState()
})

process.on('SIGTERM', () => {
	quitting = true
	app.quit()
})
