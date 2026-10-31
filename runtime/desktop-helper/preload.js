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
	quit() {
		ipcRenderer.send('lion:quit')
	},
	getConfig() {
		return ipcRenderer.invoke('lion:config')
	},
})
