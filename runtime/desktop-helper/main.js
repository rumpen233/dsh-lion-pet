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
		clearTimeout(saveTimer)
		saveTimer = setTimeout(saveWindowState, 260)
	})
	win.on('closed', () => {
		win = null
	})
	return win
}

function applyConfig(config) {
	if (!config || typeof config !== 'object') return
	const display = typeof config.display === 'string' ? config.display : 'both'
	if (display === 'desktop' || display === 'both') {
		createWindow()
		if (win && !win.isDestroyed() && !win.isVisible()) win.showInactive()
		return
	}
	quitting = true
	if (win && !win.isDestroyed()) win.hide()
	app.quit()
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

ipcMain.on('lion:drag-start', (_event, point) => {
	if (!win || win.isDestroyed()) return
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
		if (!win || win.isDestroyed() || dragging) return
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
	if (configTimer) clearInterval(configTimer)
	if (cursorTimer) clearInterval(cursorTimer)
	saveWindowState()
})

process.on('SIGTERM', () => {
	quitting = true
	app.quit()
})
