const enabled = document.getElementById('enabled')
const reset = document.getElementById('reset')

chrome.storage.local.get({ enabled: true }, (stored) => {
	enabled.checked = Boolean(stored.enabled)
})

enabled.addEventListener('change', () => {
	chrome.storage.local.set({ enabled: enabled.checked })
})

reset.addEventListener('click', () => {
	chrome.storage.local.set({ x: null, y: null, pose: 'front' }, () => {
		reset.textContent = '已恢复，刷新页面后生效'
		setTimeout(() => { reset.textContent = '恢复默认位置' }, 1800)
	})
})
