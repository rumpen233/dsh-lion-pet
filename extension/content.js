(() => {
	'use strict'

	const HOST_ID = '__xingxiaoshi_pet_host__'
	const DEFAULTS = { enabled: true, x: null, y: null, size: 160, pose: 'front' }
	const FRONT = chrome.runtime.getURL('assets/lion-front.webp')
	const SIDE = chrome.runtime.getURL('assets/lion-side.webp')
	const ICON = chrome.runtime.getURL('assets/icon.png')
	const LINES = [
		'今天也要好好写代码呀～',
		'写累了就摸摸我。',
		'我可是有校徽认证的刑小狮！',
		'这个 bug 看起来有点可疑……',
		'先喝口水，再继续吧。',
		'摸头可以，别忘了休息。',
		'狮子不发威，你当我是小猫？',
		'网页也是我的地盘啦。',
	]
	const GLYPHS = ['♥', '✦', '★', '✧', '●']
	const COLORS = ['#f2645a', '#f2b63d', '#4f8fe8', '#33b58c', '#ef7fa8']

	let host = null
	let shadow = null
	let pet = null
	let image = null
	let bubble = null
	let menu = null
	let wake = null
	const state = { ...DEFAULTS, hidden: false }
	let dragging = null
	let justDragged = false
	let bubbleTimer = 0

	function clamp(value, min, max) {
		return Math.max(min, Math.min(max, value))
	}

	function petSize() {
		return clamp(Number(state.size) || 160, 110, 260)
	}

	function applyPose() {
		if (!image) return
		image.src = state.pose === 'side' ? SIDE : FRONT
	}

	function applyPosition() {
		if (!pet) return
		const size = petSize()
		const width = size
		const height = Math.round(size * 726 / 522)
		pet.style.width = width + 'px'
		pet.style.height = height + 'px'
		if (Number.isFinite(state.x) && Number.isFinite(state.y)) {
			const x = clamp(state.x, 4, Math.max(4, innerWidth - width - 4))
			const y = clamp(state.y, 4, Math.max(4, innerHeight - height - 4))
			pet.style.left = x + 'px'
			pet.style.top = y + 'px'
			pet.style.right = 'auto'
			pet.style.bottom = 'auto'
		} else {
			pet.style.left = 'auto'
			pet.style.top = 'auto'
			pet.style.right = '22px'
			pet.style.bottom = '22px'
		}
	}

	function say(text, duration = 2800) {
		if (!bubble) return
		// Keep the bubble inside the viewport: near the right edge it grows to the
		// left, near the left edge it grows to the right.
		const rect = pet.getBoundingClientRect()
		bubble.classList.toggle('is-left', rect.left + rect.width / 2 < innerWidth / 2)
		bubble.textContent = text
		bubble.classList.add('is-on')
		clearTimeout(bubbleTimer)
		bubbleTimer = setTimeout(() => bubble.classList.remove('is-on'), duration)
	}

	function burst() {
		for (let i = 0; i < 6; i += 1) {
			const node = document.createElement('span')
			node.className = 'lx-particle'
			node.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
			node.style.color = COLORS[Math.floor(Math.random() * COLORS.length)]
			node.style.setProperty('--dx', Math.round((Math.random() - 0.5) * 92) + 'px')
			node.style.setProperty('--rot', Math.round((Math.random() - 0.5) * 120) + 'deg')
			node.style.fontSize = 12 + Math.round(Math.random() * 8) + 'px'
			node.style.left = 42 + Math.round(Math.random() * 26) + '%'
			pet.appendChild(node)
			setTimeout(() => node.remove(), 1200)
		}
	}

	function react(text) {
		pet.classList.remove('is-pop')
		void pet.offsetWidth
		pet.classList.add('is-pop')
		burst()
		say(text || LINES[Math.floor(Math.random() * LINES.length)])
	}

	function closeMenu() {
		if (menu) menu.hidden = true
	}

	function openMenu(clientX, clientY) {
		if (!menu) return
		menu.hidden = false
		menu.style.left = '0px'
		menu.style.top = '0px'
		const rect = menu.getBoundingClientRect()
		const left = clamp(clientX - rect.width / 2, 8, innerWidth - rect.width - 8)
		const top = clamp(clientY - rect.height / 2, 8, innerHeight - rect.height - 8)
		menu.style.left = Math.round(left) + 'px'
		menu.style.top = Math.round(top) + 'px'
	}

	function hidePet() {
		state.hidden = true
		pet.classList.add('is-hidden')
		wake.hidden = false
		closeMenu()
	}

	function showPet() {
		state.hidden = false
		pet.classList.remove('is-hidden')
		wake.hidden = true
		say('我回来啦！')
	}

	function resetPosition() {
		state.x = null
		state.y = null
		state.pose = 'front'
		applyPose()
		applyPosition()
		chrome.storage.local.set({ x: null, y: null, pose: 'front' })
		closeMenu()
	}

	function savePosition() {
		chrome.storage.local.set({ x: state.x, y: state.y })
	}

	function bindPet() {
		pet.addEventListener('pointerdown', (event) => {
			if (event.button !== 0) return
			const rect = pet.getBoundingClientRect()
			dragging = {
				id: event.pointerId,
				offsetX: event.clientX - rect.left,
				offsetY: event.clientY - rect.top,
				startX: event.clientX,
				startY: event.clientY,
				moved: false,
			}
			justDragged = false
			try { pet.setPointerCapture(event.pointerId) } catch {}
		})

		window.addEventListener('pointermove', (event) => {
			if (!dragging || event.pointerId !== dragging.id) return
			if (!dragging.moved && Math.hypot(event.clientX - dragging.startX, event.clientY - dragging.startY) < 4) return
			dragging.moved = true
			const size = petSize()
			const x = clamp(event.clientX - dragging.offsetX, 0, innerWidth - size)
			const y = clamp(event.clientY - dragging.offsetY, 0, innerHeight - Math.round(size * 726 / 522))
			pet.style.left = Math.round(x) + 'px'
			pet.style.top = Math.round(y) + 'px'
			pet.style.right = 'auto'
			pet.style.bottom = 'auto'
			state.x = Math.round(x)
			state.y = Math.round(y)
		})

		window.addEventListener('pointerup', (event) => {
			if (!dragging || event.pointerId !== dragging.id) return
			const moved = dragging.moved
			try { pet.releasePointerCapture(dragging.id) } catch {}
			dragging = null
			if (moved) {
				justDragged = true
				savePosition()
				setTimeout(() => { justDragged = false }, 260)
				return
			}
			react()
		})

		pet.addEventListener('contextmenu', (event) => {
			event.preventDefault()
			openMenu(event.clientX, event.clientY)
		})

		pet.addEventListener('keydown', (event) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault()
				react()
			}
		})

		window.addEventListener('pointerdown', (event) => {
			if (!menu || menu.hidden) return
			if (menu.contains(event.target) || pet.contains(event.target)) return
			closeMenu()
		}, true)

		window.addEventListener('resize', () => {
			if (!state.hidden) applyPosition()
		})

		menu.addEventListener('click', (event) => {
			const button = event.target.closest('button[data-action]')
			if (!button) return
			const action = button.dataset.action
			if (action === 'pet') react()
			else if (action === 'side') {
				state.pose = state.pose === 'side' ? 'front' : 'side'
				applyPose()
				chrome.storage.local.set({ pose: state.pose })
				say(state.pose === 'side' ? '换个姿势～' : '正面也很可爱吧。')
				closeMenu()
			} else if (action === 'smaller' || action === 'bigger') {
				state.size = clamp(petSize() + (action === 'bigger' ? 16 : -16), 110, 260)
				chrome.storage.local.set({ size: state.size })
				applyPosition()
				say(action === 'bigger' ? '变大一点点！' : '小巧一点也很可爱。')
				closeMenu()
			} else if (action === 'hide') hidePet()
			else if (action === 'reset') resetPosition()
		})

		wake.addEventListener('click', showPet)
	}

	function mount() {
		if (document.getElementById(HOST_ID)) return
		host = document.createElement('div')
		host.id = HOST_ID
		host.setAttribute('aria-hidden', 'false')
		shadow = host.attachShadow({ mode: 'open' })
		shadow.innerHTML = `
			<style>
				:host { all: initial; }
				* { box-sizing: border-box; }
				.lx-pet {
					position: fixed; right: 22px; bottom: 22px;
					width: 160px; height: 223px;
					z-index: 2147483000;
					pointer-events: auto;
					cursor: grab;
					user-select: none;
					-webkit-user-select: none;
					touch-action: none;
					transform-origin: 50% 100%;
					animation: lx-breathe 3.2s ease-in-out infinite;
					filter: drop-shadow(0 10px 14px rgba(24, 56, 110, 0.22));
				}
				.lx-pet.is-hidden { display: none; }
				.lx-pet:active { cursor: grabbing; }
				.lx-img {
					display: block; width: 100%; height: 100%;
					object-fit: contain; pointer-events: none;
					-webkit-user-drag: none;
				}
				.lx-bubble {
					position: absolute; right: 0; bottom: calc(100% - 2px);
					transform: translateY(6px) scale(.92);
					transform-origin: 50% 100%;
					width: max-content; max-width: min(250px, calc(100vw - 36px));
					padding: 10px 14px;
					border-radius: 16px;
					background: rgba(255, 255, 255, .97);
					border: 2px solid #2f6cc8;
					color: #17325f;
					font: 600 14px/1.55 "Microsoft YaHei", "PingFang SC", system-ui, sans-serif;
					box-shadow: 0 8px 24px rgba(26, 62, 120, .22);
					opacity: 0; pointer-events: none;
					transition: opacity .16s ease, transform .16s ease;
					white-space: normal;
				}
				.lx-bubble.is-left { right: auto; left: 0; }
				.lx-bubble::after {
					content: ""; position: absolute; right: 74px; bottom: -8px;
					width: 12px; height: 12px; background: #fff;
					border-right: 2px solid #2f6cc8; border-bottom: 2px solid #2f6cc8;
					transform: rotate(45deg);
				}
				.lx-bubble.is-left::after { right: auto; left: 74px; }
				.lx-bubble.is-on { opacity: 1; transform: translateY(0) scale(1); }
				.lx-menu {
					position: fixed; z-index: 2147483001;
					min-width: 164px; padding: 6px;
					border-radius: 14px;
					background: rgba(255, 255, 255, .98);
					border: 1px solid rgba(58, 102, 170, .28);
					box-shadow: 0 14px 34px rgba(20, 48, 96, .24);
					font: 13px/1.2 "Microsoft YaHei", "PingFang SC", system-ui, sans-serif;
					pointer-events: auto;
				}
				.lx-menu[hidden] { display: none; }
				.lx-menu button {
					display: flex; align-items: center; gap: 8px;
					width: 100%; padding: 9px 10px;
					border: 0; border-radius: 9px; background: transparent;
					color: #26405f; font: inherit; text-align: left; cursor: pointer;
				}
				.lx-menu button:hover { background: #eef5ff; color: #1d5bb8; }
				.lx-dot { width: 8px; height: 8px; border-radius: 50%; background: #79a9e8; flex: none; }
				.lx-dot.red { background: #ef6b63; }
				.lx-wake {
					position: fixed; right: 22px; bottom: 22px;
					width: 46px; height: 46px; padding: 0;
					border: 2px solid #fff; border-radius: 50%;
					background: #2f6cc8; cursor: pointer;
					box-shadow: 0 8px 20px rgba(20, 52, 110, .28);
					overflow: hidden; pointer-events: auto;
					z-index: 2147483000;
				}
				.lx-wake[hidden] { display: none; }
				.lx-wake img { width: 100%; height: 100%; object-fit: cover; transform: scale(1.55); }
				.lx-particle {
					position: absolute; bottom: 30%; z-index: 3;
					pointer-events: none; font-weight: 700;
					animation: lx-float 1.1s ease-out forwards;
				}
				.lx-pet.is-pop { animation: lx-pop .55s cubic-bezier(.2, .8, .3, 1.2); }
				@keyframes lx-breathe {
					0%, 100% { transform: translateY(0) rotate(-.4deg); }
					50% { transform: translateY(-4px) rotate(.5deg); }
				}
				@keyframes lx-pop {
					0% { transform: scale(1); }
					35% { transform: scale(1.07) translateY(-4px); }
					70% { transform: scale(.98); }
					100% { transform: scale(1); }
				}
				@keyframes lx-float {
					0% { opacity: 1; transform: translate(0, 0) rotate(0); }
					100% { opacity: 0; transform: translate(var(--dx), -58px) rotate(var(--rot)); }
				}
				@media (prefers-reduced-motion: reduce) {
					.lx-pet, .lx-pet.is-pop, .lx-particle { animation: none !important; }
				}
			</style>
			<div class="lx-pet" tabindex="0" role="button" aria-label="刑小狮桌宠：拖动可以搬家，单击摸摸头，右键打开菜单">
				<div class="lx-bubble" aria-live="polite"></div>
				<img class="lx-img" alt="刑小狮" draggable="false" src="${FRONT}">
			</div>
			<div class="lx-menu" role="menu" hidden>
				<button type="button" data-action="pet"><span class="lx-dot"></span>摸摸头</button>
				<button type="button" data-action="side"><span class="lx-dot"></span>换个姿势</button>
				<button type="button" data-action="smaller"><span class="lx-dot"></span>缩小一点</button>
				<button type="button" data-action="bigger"><span class="lx-dot"></span>放大一点</button>
				<button type="button" data-action="reset"><span class="lx-dot"></span>回到右下角</button>
				<button type="button" data-action="hide"><span class="lx-dot red"></span>隐藏刑小狮</button>
			</div>
			<button class="lx-wake" type="button" aria-label="唤醒刑小狮" hidden><img alt="" src="${ICON}"></button>
		`
		document.documentElement.appendChild(host)
		pet = shadow.querySelector('.lx-pet')
		image = shadow.querySelector('.lx-img')
		bubble = shadow.querySelector('.lx-bubble')
		menu = shadow.querySelector('.lx-menu')
		wake = shadow.querySelector('.lx-wake')
		bindPet()
		applyPose()
		applyPosition()
		say('嗨，我是刑小狮！网页也要一起加油～', 3400)
	}

	function unmount() {
		if (host) host.remove()
		host = null
	}

	function setEnabled(enabled) {
		state.enabled = Boolean(enabled)
		if (!state.enabled) {
			unmount()
			return
		}
		mount()
	}

	chrome.storage.local.get(DEFAULTS, (stored) => {
		Object.assign(state, DEFAULTS, stored)
		setEnabled(state.enabled)
	})

	chrome.storage.onChanged.addListener((changes, area) => {
		if (area !== 'local') return
		if (changes.enabled) setEnabled(changes.enabled.newValue)
		if (changes.size && pet) {
			state.size = changes.size.newValue
			applyPosition()
		}
	})
})()
