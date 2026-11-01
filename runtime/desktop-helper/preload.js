'use strict'

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('lion', {
	setInteractive(interactive) {
		ipcRenderer.send('lion:set-interactive', Boolean(interactive))
	},
	dragStart(x, y) {
		ipcRenderer.send('lion:drag-start', { x, y })
	},
	dragMove(x, y) {
		ipcRenderer.send('lion:drag-move', { x, y })
	},
	dragEnd() {
		ipcRenderer.send('lion:drag-end')
	},
	walkTo(x, y, duration) {
		ipcRenderer.send('lion:walk-to', { x, y, duration })
	},
	stopWalk() {
		ipcRenderer.send('lion:walk-stop')
	},
	getGeometry() {
		return ipcRenderer.invoke('lion:geometry')
	},
	onWalkDone(callback) {
		const handler = () => callback()
		ipcRenderer.on('lion:walk-done', handler)
		return () => ipcRenderer.removeListener('lion:walk-done', handler)
	},
	quit() {
		ipcRenderer.send('lion:quit')
	},
	getConfig() {
		return ipcRenderer.invoke('lion:config')
	},
})
