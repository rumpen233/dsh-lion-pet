'use strict'

const pet = document.getElementById('pet')
const bubble = document.getElementById('bubble')
const menu = document.getElementById('menu')
const particles = document.getElementById('particles')
const front = document.getElementById('front')
const side = document.getElementById('side')

const LINES = [
	'今天也要好好写代码呀～',
	'写累了就摸摸我。',
	'我可是有校徽认证的狮子！',
	'这个 bug 看起来有点可疑……',
	'先喝口水，再继续吧。',
	'摸头可以，别忘了休息。',
	'狮子不发威，你当我是小猫？',
	'桌面也是我的地盘啦。',
]
const COLORS = ['#f2645a', '#f2b63d', '#4f8fe8', '#33b58c', '#ef7fa8']
const GLYPHS = ['♥', '✦', '★', '✧', '●']

let configUrl = 'http://127.0.0.1:61702/dsh-lion-pet/config'
let menuOpen = false
let bubbleTimer = 0
let idleTimer = 0
let happyTimer = 0
let spinTimer = 0
let poseTimer = 0
let interactive = false
let pointerDown = null
let dragStarted = false
let walking = false
let wanderTimer = 0
let walkEndTimer = 0

const canvas = document.createElement('canvas')
const hit = canvas.getContext('2d', { willReadFrequently: true })
let hitReady = false
const probe = new Image()
probe.onload = () => {
	canvas.width = probe.naturalWidth
	canvas.height = probe.naturalHeight
	hit.drawImage(probe, 0, 0)
	hitReady = true
}
probe.src = 'assets/lion-front.webp'

function setInteractive(next) {
	// The main process watches the real cursor and flips click-through for the
	// whole (tight) pet window; this local state is only for UI behaviour.
	interactive = next
}

function overLion(clientX, clientY) {
	const rect = pet.getBoundingClientRect()
	if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return false
	if (!hitReady) return true
	const x = Math.floor(((clientX - rect.left) / rect.width) * canvas.width)
	const y = Math.floor(((clientY - rect.top) / rect.height) * canvas.height)
	if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return false
	return hit.getImageData(x, y, 1, 1).data[3] > 24
}

function say(text, duration = 2800) {
	bubble.textContent = text
	bubble.classList.add('is-on')
	clearTimeout(bubbleTimer)
	bubbleTimer = setTimeout(() => bubble.classList.remove('is-on'), duration)
}

function burst(count = 5) {
	for (let i = 0; i < count; i++) {
		const node = document.createElement('span')
		node.className = 'particle'
		node.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
		node.style.color = COLORS[Math.floor(Math.random() * COLORS.length)]
		node.style.setProperty('--dx', Math.round((Math.random() - 0.5) * 96) + 'px')
		node.style.setProperty('--rot', Math.round((Math.random() - 0.5) * 90) + 'deg')
		node.style.fontSize = 12 + Math.round(Math.random() * 8) + 'px'
		node.style.left = 50 + (Math.random() - 0.5) * 18 + '%'
		particles.appendChild(node)
		setTimeout(() => node.remove(), 1200)
	}
}

function react(text) {
	pet.classList.remove('is-pop')
	void pet.offsetWidth
	pet.classList.add('is-pop')
	clearTimeout(happyTimer)
	happyTimer = setTimeout(() => pet.classList.remove('is-pop'), 620)
	burst(6)
	say(text || LINES[Math.floor(Math.random() * LINES.length)])
}

function spin() {
	pet.classList.remove('is-spin')
	void pet.offsetWidth
	pet.classList.add('is-spin')
	clearTimeout(spinTimer)
	spinTimer = setTimeout(() => pet.classList.remove('is-spin'), 800)
	say('转圈圈～看我的狮子回旋！')
	burst(5)
}

function setSide(hold = 2300) {
	pet.classList.add('is-side')
	clearTimeout(poseTimer)
	poseTimer = setTimeout(() => pet.classList.remove('is-side'), hold)
}

function scheduleWander(delay = 6500 + Math.random() * 6500) {
	clearTimeout(wanderTimer)
	wanderTimer = setTimeout(() => { void wander() }, delay)
}

function finishWalk() {
	if (!walking) return
	walking = false
	clearTimeout(walkEndTimer)
	pet.classList.remove('is-walking')
	pet.classList.remove('is-left')
	setSide(1400)
	scheduleWander(8000 + Math.random() * 7000)
}

function stopWalking() {
	clearTimeout(walkEndTimer)
	const wasWalking = walking
	walking = false
	pet.classList.remove('is-walking')
	pet.classList.remove('is-left')
	try { window.lion.stopWalk?.() } catch {}
	if (wasWalking) setSide(900)
}

async function wander() {
	if (menuOpen || pointerDown || dragStarted || walking) {
		scheduleWander(5000)
		return
	}
	let geo
	try {
		geo = await window.lion.getGeometry()
	} catch {
		scheduleWander(12000)
		return
	}
	const area = geo?.workArea
	const bounds = geo?.bounds
	if (!area || !bounds) {
		scheduleWander(12000)
		return
	}
	const width = bounds.width || 280
	const height = bounds.height || 390
	const pad = 10
	const minX = area.x + pad
	const maxX = area.x + area.width - width - pad
	const minY = area.y + pad
	const maxY = area.y + area.height - height - pad
	if (maxX <= minX || maxY <= minY) {
		scheduleWander(12000)
		return
	}

	let targetX = bounds.x
	let targetY = bounds.y
	for (let i = 0; i < 12; i++) {
		const horizontal = Math.random() < 0.72
		const x = minX + Math.random() * (maxX - minX)
		const y = horizontal
			? Math.max(minY, Math.min(maxY, bounds.y + (Math.random() - 0.5) * 80))
			: minY + Math.random() * (maxY - minY)
		targetX = x
		targetY = y
		if (Math.hypot(x - bounds.x, y - bounds.y) >= 150) break
	}
	if (Math.hypot(targetX - bounds.x, targetY - bounds.y) < 80) {
		targetX = bounds.x < (minX + maxX) / 2 ? maxX : minX
	}

	const distance = Math.hypot(targetX - bounds.x, targetY - bounds.y)
	const duration = Math.round(Math.max(1600, Math.min(6200, distance / 0.17)))
	walking = true
	pet.classList.add('is-walking')
	pet.classList.toggle('is-left', targetX < bounds.x)
	setSide(duration + 700)
	try {
		window.lion.walkTo(targetX, targetY, duration)
	} catch {
		finishWalk()
		return
	}
	clearTimeout(walkEndTimer)
	walkEndTimer = setTimeout(finishWalk, duration + 220)
}

function closeMenu() {
	menuOpen = false
	menu.classList.remove('is-on')
	menu.setAttribute('aria-hidden', 'true')
	if (!walking && !pointerDown) scheduleWander(8000 + Math.random() * 6000)
}

function openMenu(clientX, clientY) {
	menuOpen = true
	menu.classList.add('is-on')
	menu.setAttribute('aria-hidden', 'false')
	menu.style.left = '0px'
	menu.style.top = '0px'
	const mw = menu.offsetWidth || 174
	const mh = menu.offsetHeight || 250
	const left = Math.max(8, Math.min(innerWidth - mw - 8, clientX - mw / 2))
	const top = Math.max(8, Math.min(innerHeight - mh - 8, clientY - mh / 2))
	menu.style.left = Math.round(left) + 'px'
	menu.style.top = Math.round(top) + 'px'
}

async function setDisplay(display) {
	closeMenu()
	stopWalking()
	try {
		await fetch(configUrl, {
			method: 'PUT',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ display }),
		})
	} catch {
		/* the host may already be shutting down */
	} finally {
		window.lion.quit()
	}
}

function handleAction(action) {
	if (action === 'pet') { react(); return }
	if (action === 'spin') { spin(); return }
	if (action === 'smaller' || action === 'bigger') {
		const rect = pet.getBoundingClientRect()
		const next = Math.max(210, Math.min(282, rect.width + (action === 'bigger' ? 16 : -16)))
		pet.style.width = Math.round(next) + 'px'
		pet.style.height = Math.round(next * 726 / 522) + 'px'
		closeMenu()
		say(action === 'bigger' ? '变大一点点！' : '小巧一点也很可爱。')
		return
	}
	if (action === 'webonly') { setDisplay('web'); return }
	if (action === 'off') { setDisplay('off') }
}

pet.addEventListener('pointerdown', (event) => {
	if (event.button !== 0) return
	if (!overLion(event.clientX, event.clientY)) return
	if (walking) stopWalking()
	pointerDown = { x: event.screenX, y: event.screenY, id: event.pointerId }
	dragStarted = false
	try { pet.setPointerCapture(event.pointerId) } catch {}
})

window.addEventListener('pointermove', (event) => {
	if (pointerDown) {
		if (!dragStarted && Math.hypot(event.screenX - pointerDown.x, event.screenY - pointerDown.y) > 5) {
			dragStarted = true
			window.lion.dragStart(pointerDown.x, pointerDown.y)
		}
		if (dragStarted) {
			window.lion.dragMove(event.screenX, event.screenY)
			setInteractive(true)
		}
		return
	}
	if (menuOpen) { setInteractive(true); return }
	setInteractive(overLion(event.clientX, event.clientY))
})

// While the window is click-through, Electron forwards low-level mouse moves
// as `mousemove` (not necessarily as pointermove), so hit-testing must listen
// to both.
window.addEventListener('mousemove', (event) => {
	if (pointerDown || menuOpen) return
	setInteractive(overLion(event.clientX, event.clientY))
})

window.addEventListener('pointerup', (event) => {
	if (pointerDown) {
		try { pet.releasePointerCapture(pointerDown.id) } catch {}
		if (dragStarted) {
			window.lion.dragEnd()
			dragStarted = false
			pointerDown = null
			scheduleWander(9000 + Math.random() * 6000)
			return
		}
		pointerDown = null
		react()
		if (Math.random() < 0.28) setSide()
		scheduleWander(9000 + Math.random() * 6000)
		return
	}
	if (menuOpen && !menu.contains(event.target)) closeMenu()
})

window.addEventListener('pointerleave', () => {
	if (!menuOpen && !pointerDown) setInteractive(false)
})

pet.addEventListener('contextmenu', (event) => {
	event.preventDefault()
	if (!overLion(event.clientX, event.clientY)) return
	if (walking) stopWalking()
	openMenu(event.clientX, event.clientY)
	setInteractive(true)
})

window.addEventListener('keydown', (event) => {
	if (event.key === 'Escape') { closeMenu(); return }
	if (event.key === 'Enter' || event.key === ' ') {
		event.preventDefault()
		react()
	}
})

menu.addEventListener('click', (event) => {
	const button = event.target.closest('button[data-action]')
	if (button) handleAction(button.dataset.action)
})

document.addEventListener('pointerdown', (event) => {
	if (!menuOpen) return
	if (!menu.contains(event.target) && !pet.contains(event.target)) closeMenu()
}, true)

window.addEventListener('blur', () => {
	if (menuOpen) closeMenu()
})

function scheduleIdle() {
	clearTimeout(idleTimer)
	idleTimer = setTimeout(() => {
		if (!menuOpen && !pointerDown) {
			const roll = Math.random()
			if (roll < 0.55) say(LINES[Math.floor(Math.random() * LINES.length)])
			else if (roll < 0.8) setSide()
			else spin()
		}
		scheduleIdle()
	}, 10000 + Math.random() * 12000)
}

window.lion.getConfig().then((config) => {
	if (config?.url) configUrl = config.url
	if (config?.display && config.display !== 'desktop' && config.display !== 'both') {
		window.lion.quit()
		return
	}
	window.lion.onWalkDone?.(() => finishWalk())
	setTimeout(() => say('嗨，我是刑小狮！桌面也要一起加油～'), 700)
	scheduleIdle()
	scheduleWander()
}).catch(() => {
	window.lion.onWalkDone?.(() => finishWalk())
	setTimeout(() => say('嗨，我是刑小狮！桌面也要一起加油～'), 700)
	scheduleIdle()
	scheduleWander()
})

setTimeout(() => {
	if (!bubble.classList.contains('is-on')) say('嗨，我是刑小狮！桌面也要一起加油～')
}, 1400)
