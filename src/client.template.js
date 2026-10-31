;(() => {
	window.__ModuleLoader__.load({
		id: "dsh-lion-pet",
		factory: (require) => {
			const FRONT = "data:image/webp;base64,__LION_FRONT__";
			const SIDE = "data:image/webp;base64,__LION_SIDE__";
			const STORAGE_KEY = "dsh-lion-pet:v4";
			const DISPLAY_URL = "/dsh-lion-pet/config";
			const DISPLAY_MODES = ["desktop", "web", "both", "off"];
			const FRONT_RATIO = 726 / 522;
			const MIN_SIZE = 140;
			const MAX_SIZE = 380;
			const CSS = `
				:host {
					all: initial;
				}
				*, *::before, *::after {
					box-sizing: border-box;
				}
				[hidden] {
					display: none !important;
				}
				.lp-layer {
					position: absolute;
					inset: 0;
					overflow: hidden;
					pointer-events: none;
					font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans SC", "Segoe UI", system-ui, sans-serif;
					color: #16356d;
					-webkit-font-smoothing: antialiased;
					text-rendering: optimizeLegibility;
				}
				.lp-pet {
					position: absolute;
					left: 0;
					top: 0;
					width: 200px;
					height: 278px;
					pointer-events: auto;
					cursor: grab;
					touch-action: none;
					user-select: none;
					-webkit-user-select: none;
					-webkit-touch-callout: none;
					will-change: transform;
					outline: none;
				}
				.lp-pet.is-dragging {
					cursor: grabbing;
				}
				.lp-pet.is-locked {
					cursor: default;
				}
				.lp-pet:focus-visible {
					outline: 3px solid #ffd14a;
					outline-offset: 3px;
					border-radius: 22px;
				}
				.lp-halo {
					position: absolute;
					left: 50%;
					bottom: 4%;
					width: 78%;
					height: 30%;
					transform: translateX(-50%);
					border-radius: 50%;
					background: radial-gradient(closest-side, rgba(88, 164, 238, 0.34), rgba(88, 164, 238, 0) 72%);
					filter: blur(14px);
					pointer-events: none;
				}
				.lp-shadow {
					position: absolute;
					left: 50%;
					bottom: 1px;
					width: 48%;
					height: 10px;
					transform: translateX(-50%);
					border-radius: 50%;
					background: rgba(19, 46, 99, 0.24);
					filter: blur(5px);
					pointer-events: none;
					transition: opacity 0.18s ease, transform 0.18s ease;
				}
				.lp-pet.is-dragging .lp-shadow {
					opacity: 0.4;
					transform: translateX(-50%) scale(1.18);
				}
				.lp-body {
					position: absolute;
					inset: 0;
					transform-origin: 50% 88%;
					animation: lp-float 3.4s ease-in-out infinite;
					pointer-events: none;
				}
				.lp-pet.is-dragging .lp-body {
					animation: none;
					transform: rotate(var(--lp-tilt, 0deg)) scale(1.02);
					transition: transform 0.08s linear;
				}
				.lp-pet.is-walking .lp-body {
					animation: lp-walk 0.44s ease-in-out infinite;
				}
				.lp-pet.is-happy .lp-body {
					animation: lp-pop 0.58s cubic-bezier(0.2, 0.9, 0.2, 1.25);
				}
				.lp-pet.is-spinning .lp-body {
					animation: lp-spin 0.78s cubic-bezier(0.4, 0, 0.2, 1);
				}
				.lp-img {
					position: absolute;
					left: 50%;
					bottom: 0;
					height: 100%;
					width: auto;
					transform: translateX(-50%);
					transform-origin: 50% 90%;
					opacity: 0;
					transition: opacity 0.16s ease;
					pointer-events: none;
					user-select: none;
					-webkit-user-drag: none;
					filter: drop-shadow(0 10px 9px rgba(18, 44, 92, 0.22));
				}
				.lp-img.is-on {
					opacity: 1;
				}
				.lp-front {
					z-index: 2;
				}
				.lp-side {
					z-index: 1;
					transform: translateX(-50%) scaleX(var(--lp-flip, 1));
				}
				.lp-pet.pose-side .lp-front {
					opacity: 0;
				}
				.lp-pet.pose-side .lp-side {
					opacity: 1;
				}
				.lp-particles {
					position: absolute;
					inset: 0;
					overflow: visible;
					pointer-events: none;
					z-index: 5;
				}
				.lp-particle {
					position: absolute;
					left: 50%;
					bottom: 48%;
					font-size: 17px;
					font-weight: 900;
					line-height: 1;
					opacity: 0;
					color: #f2645a;
					text-shadow: 0 1px 0 #fff, 0 2px 5px rgba(20, 48, 100, 0.18);
					animation: lp-particle 1.15s ease-out forwards;
					will-change: transform, opacity;
				}
				.lp-bubble {
					position: absolute;
					left: 50%;
					bottom: calc(100% - 8px);
					z-index: 8;
					width: max-content;
					max-width: min(258px, calc(100vw - 34px));
					padding: 9px 14px;
					border: 2px solid #2f5db6;
					border-radius: 16px;
					background: #fff;
					box-shadow: 0 12px 26px rgba(20, 46, 96, 0.18), inset 0 -2px 0 rgba(47, 93, 182, 0.06);
					color: #15346a;
					font-size: 14px;
					font-weight: 600;
					line-height: 1.55;
					letter-spacing: 0.2px;
					text-align: left;
					white-space: normal;
					opacity: 0;
					visibility: hidden;
					pointer-events: none;
					transform: translate(-50%, 8px) scale(0.94);
					transform-origin: 50% 100%;
					transition: opacity 0.16s ease, transform 0.18s cubic-bezier(0.2, 0.9, 0.2, 1.3), visibility 0.16s;
				}
				.lp-bubble::after {
					content: "";
					position: absolute;
					left: 50%;
					bottom: -8px;
					width: 13px;
					height: 13px;
					background: #fff;
					border-right: 2px solid #2f5db6;
					border-bottom: 2px solid #2f5db6;
					border-bottom-right-radius: 3px;
					transform: translateX(-50%) rotate(45deg);
				}
				.lp-bubble.is-on {
					opacity: 1;
					visibility: visible;
					transform: translate(-50%, 0) scale(1);
				}
				.lp-bubble.below {
					bottom: auto;
					top: calc(100% - 8px);
					transform: translate(-50%, -8px) scale(0.94);
					transform-origin: 50% 0;
				}
				.lp-bubble.below.is-on {
					transform: translate(-50%, 0) scale(1);
				}
				.lp-bubble.below::after {
					bottom: auto;
					top: -8px;
					transform: translateX(-50%) rotate(225deg);
					border-bottom-right-radius: 0;
				}
				.lp-bubble.align-left {
					left: 4px;
					transform: translate(0, 8px) scale(0.94);
					transform-origin: 0 100%;
				}
				.lp-bubble.align-left.is-on {
					transform: translate(0, 0) scale(1);
				}
				.lp-bubble.align-right {
					left: auto;
					right: 4px;
					transform: translate(0, 8px) scale(0.94);
					transform-origin: 100% 100%;
				}
				.lp-bubble.align-right.is-on {
					transform: translate(0, 0) scale(1);
				}
				.lp-bubble.align-left::after {
					left: 32px;
				}
				.lp-bubble.align-right::after {
					left: auto;
					right: 32px;
				}
				.lp-bubble.align-left.below {
					transform: translate(0, -8px) scale(0.94);
					transform-origin: 0 0;
				}
				.lp-bubble.align-left.below.is-on {
					transform: translate(0, 0) scale(1);
				}
				.lp-bubble.align-right.below {
					transform: translate(0, -8px) scale(0.94);
					transform-origin: 100% 0;
				}
				.lp-bubble.align-right.below.is-on {
					transform: translate(0, 0) scale(1);
				}
				.lp-menu {
					position: absolute;
					left: 0;
					top: 0;
					z-index: 12;
					width: 192px;
					padding: 6px;
					border: 1.5px solid rgba(47, 93, 182, 0.22);
					border-radius: 15px;
					background: rgba(255, 255, 255, 0.97);
					box-shadow: 0 18px 42px rgba(18, 42, 88, 0.22), 0 3px 9px rgba(18, 42, 88, 0.09);
					backdrop-filter: blur(14px);
					-webkit-backdrop-filter: blur(14px);
					opacity: 0;
					visibility: hidden;
					pointer-events: none;
					transform: translateY(6px) scale(0.97);
					transform-origin: 0 0;
					transition: opacity 0.14s ease, transform 0.15s ease, visibility 0.14s;
				}
				.lp-menu.is-on {
					opacity: 1;
					visibility: visible;
					pointer-events: auto;
					transform: translateY(0) scale(1);
				}
				.lp-menu button {
					display: flex;
					align-items: center;
					gap: 9px;
					width: 100%;
					padding: 8px 10px;
					border: 0;
					border-radius: 10px;
					background: transparent;
					color: #1b3767;
					font: 600 13px/1.35 "Microsoft YaHei", "PingFang SC", "Noto Sans SC", "Segoe UI", system-ui, sans-serif;
					text-align: left;
					cursor: pointer;
					outline: none;
					white-space: nowrap;
				}
				.lp-menu button:hover,
				.lp-menu button:focus-visible {
					background: #eef5ff;
				}
				.lp-menu button:active {
					background: #e2eeff;
				}
				.lp-menu .lp-dot {
					width: 8px;
					height: 8px;
					border-radius: 50%;
					flex: none;
					background: #4f8fe8;
					box-shadow: 0 0 0 3px rgba(79, 143, 232, 0.12);
				}
				.lp-menu .lp-dot.red {
					background: #f2645a;
					box-shadow: 0 0 0 3px rgba(242, 100, 90, 0.12);
				}
				.lp-menu .lp-dot.yellow {
					background: #f2b63d;
					box-shadow: 0 0 0 3px rgba(242, 182, 61, 0.14);
				}
				.lp-menu .lp-dot.green {
					background: #33b58c;
					box-shadow: 0 0 0 3px rgba(51, 181, 140, 0.12);
				}
				.lp-menu .lp-sep {
					height: 1px;
					margin: 4px 8px;
					background: #e7eefb;
				}
				.lp-wake {
					position: absolute;
					right: 18px;
					bottom: 190px;
					z-index: 10;
					display: flex;
					align-items: center;
					gap: 8px;
					padding: 6px 13px 6px 6px;
					border: 2px solid #2f5db6;
					border-radius: 999px;
					background: rgba(255, 255, 255, 0.97);
					box-shadow: 0 9px 22px rgba(18, 44, 92, 0.2);
					color: #1b3b76;
					font: 700 13px/1.2 "Microsoft YaHei", "PingFang SC", "Noto Sans SC", "Segoe UI", system-ui, sans-serif;
					cursor: pointer;
					pointer-events: auto;
					opacity: 0.94;
					transition: transform 0.16s ease, box-shadow 0.16s ease, opacity 0.16s ease;
				}
				.lp-wake:hover {
					transform: translateY(-2px);
					box-shadow: 0 13px 28px rgba(18, 44, 92, 0.26);
					opacity: 1;
				}
				.lp-wake:active {
					transform: translateY(0) scale(0.98);
				}
				.lp-wake:focus-visible {
					outline: 3px solid #ffd14a;
					outline-offset: 3px;
				}
				.lp-wake-face {
					width: 34px;
					height: 34px;
					border-radius: 50%;
					overflow: hidden;
					background: #dcecff;
					flex: none;
				}
				.lp-wake-face img {
					display: block;
					width: 100%;
					height: 100%;
					object-fit: cover;
					object-position: 50% 9%;
				}
				@keyframes lp-float {
					0%, 100% { transform: translateY(0) rotate(-0.35deg); }
					50% { transform: translateY(-6px) rotate(0.35deg); }
				}
				@keyframes lp-walk {
					0%, 100% { transform: translateY(0) rotate(-2deg); }
					25% { transform: translateY(-5px) rotate(1deg); }
					50% { transform: translateY(0) rotate(2deg); }
					75% { transform: translateY(-4px) rotate(-1deg); }
				}
				@keyframes lp-pop {
					0% { transform: scale(1) rotate(0); }
					30% { transform: scale(1.08, 0.92) rotate(-2deg); }
					62% { transform: scale(0.96, 1.05) rotate(2deg); }
					100% { transform: scale(1) rotate(0); }
				}
				@keyframes lp-spin {
					0% { transform: rotate(0) scale(1); }
					55% { transform: rotate(190deg) scale(1.06); }
					100% { transform: rotate(360deg) scale(1); }
				}
				@keyframes lp-particle {
					0% { opacity: 0; transform: translate(-50%, 0) scale(0.35) rotate(0); }
					18% { opacity: 1; }
					100% { opacity: 0; transform: translate(calc(-50% + var(--lp-dx, 0px)), var(--lp-dy, -85px)) scale(1.12) rotate(var(--lp-rot, 20deg)); }
				}
				@media (prefers-reduced-motion: reduce) {
					.lp-body,
					.lp-pet.is-walking .lp-body,
					.lp-pet.is-happy .lp-body,
					.lp-pet.is-spinning .lp-body {
						animation: none !important;
					}
					.lp-bubble,
					.lp-menu,
					.lp-wake,
					.lp-img,
					.lp-shadow {
						transition: none !important;
					}
				}
			`;

			const LINES = [
				"今天也要元气满满！",
				"法条背完了吗？",
				"厚德济世，先从摸鱼开始～",
				"你敲代码，我帮你守着屏幕！",
				"嘘——我在假装很懂的样子。",
				"要不要休息一下，喝口水？",
				"我狮吼一声，Bug 全退散！",
				"校徽上的星星，是我偷偷摘下来的。",
				"再忙也要记得吃饭哦。",
				"摸摸头，好运 +1！",
				"本狮子今天也很帅。",
				"有我在，ddl 不敢靠近。",
				"你负责发光，我负责可爱。",
				"法律人的头发，要好好保护！",
				"这题不会？先摸摸狮子。",
				"我在你桌面上巡逻，一切正常。",
				"累了就靠一会儿，我替你站岗。",
				"别卷啦，陪我晒晒太阳。",
				"正义也许会迟到，但刑小狮不会。",
				"我把今天的烦恼都吃掉啦。"
			];

			const REACTIONS = [
				"嘿嘿，被你摸到啦！",
				"狮子不发威，你当我是小猫？",
				"再摸一下，好运继续 +1！",
				"嗷呜～今天也要加油！",
				"收到摸摸，能量满格！",
				"你的手好暖，我再待一会儿。",
				"我可是有校徽认证的狮子！",
				"摸头可以，别忘了休息。"
			];

			const PARTICLE_COLORS = ["#f2645a", "#f2b63d", "#4f8fe8", "#33b58c", "#ef7fa8"];
			const PARTICLE_GLYPHS = ["♥", "✦", "★", "✧", "●"];

			function clamp(value, min, max) {
				return Math.max(min, Math.min(max, value));
			}

			function pick(list) {
				return list[Math.floor(Math.random() * list.length)];
			}

			function loadState() {
				const next = { x: null, y: null, size: 200, hidden: false, locked: false, positioned: false };
				try {
					const raw = window.localStorage.getItem(STORAGE_KEY);
					if (!raw) return next;
					const parsed = JSON.parse(raw);
					if (parsed && typeof parsed === "object") {
						if (Number.isFinite(parsed.x)) next.x = parsed.x;
						if (Number.isFinite(parsed.y)) next.y = parsed.y;
						if (Number.isFinite(parsed.size)) next.size = clamp(Math.round(parsed.size), MIN_SIZE, MAX_SIZE);
						next.hidden = parsed.hidden === true;
						next.locked = parsed.locked === true;
						next.positioned = parsed.positioned === true;
					}
				} catch {
					/* localStorage may be unavailable in hardened browsers */
				}
				return next;
			}

			function normalizeDisplay(value) {
				return DISPLAY_MODES.indexOf(value) >= 0 ? value : "both";
			}

			async function readDisplay() {
				try {
					const response = await fetch(DISPLAY_URL, { cache: "no-store" });
					if (!response.ok) return null;
					const data = await response.json();
					return normalizeDisplay(data && data.display);
				} catch {
					return null;
				}
			}

			function registerSettings(ctx, require) {
				let slots;
				try {
					slots = ctx && ctx.slots;
				} catch {
					return;
				}
				if (!slots || typeof slots.inject !== "function" || typeof slots.register !== "function" || typeof require !== "function") return;
				let React;
				let jsx;
				try {
					React = require("react");
					jsx = React.createElement;
				} catch {
					return;
				}
				const OPTIONS = [
					{ id: "both", title: "桌面 + 网页", hint: "桌面悬浮窗和 DSH 页面内都显示" },
					{ id: "desktop", title: "仅桌面", hint: "只在桌面悬浮显示，DSH 页面内隐藏" },
					{ id: "web", title: "仅网页", hint: "只在 DSH 网页界面显示；其他网页请装浏览器扩展" },
					{ id: "off", title: "关闭显示", hint: "都不显示，随时可以在这里重新打开" },
				];
				function LionSettings() {
					const [display, setDisplay] = React.useState("both");
					const [saving, setSaving] = React.useState("");
					const [error, setError] = React.useState("");
					React.useEffect(() => {
						let alive = true;
						readDisplay().then((value) => {
							if (alive && value) setDisplay(value);
						});
						return () => { alive = false; };
					}, []);
					const save = React.useCallback(async (next) => {
						if (next === display && !error) return;
						setSaving(next);
						setError("");
						try {
							const response = await fetch(DISPLAY_URL, {
								method: "PUT",
								headers: { "content-type": "application/json" },
								body: JSON.stringify({ display: next }),
							});
							if (!response.ok) throw new Error("HTTP " + response.status);
							const data = await response.json();
							const saved = normalizeDisplay(data && data.display);
							setDisplay(saved);
							window.dispatchEvent(new CustomEvent("dsh-lion-pet:display", { detail: saved }));
						} catch (e) {
							setError("保存失败：" + (e && e.message ? e.message : "请稍后重试"));
						} finally {
							setSaving("");
						}
					}, [display, error]);
					const cards = OPTIONS.map((option) => {
						const active = display === option.id;
						const busy = saving === option.id;
						return jsx("button", {
							type: "button",
							role: "radio",
							"aria-checked": active,
							disabled: Boolean(saving),
							onClick: () => save(option.id),
							style: {
								display: "flex",
								flexDirection: "column",
								alignItems: "flex-start",
								gap: "5px",
								padding: "12px 14px",
								borderRadius: "12px",
								border: active ? "2px solid #4f8fe8" : "1px solid rgba(120, 140, 170, .28)",
								background: active ? "rgba(79, 143, 232, .09)" : "rgba(255, 255, 255, .55)",
								textAlign: "left",
								cursor: saving ? "wait" : "pointer",
								font: "inherit",
								color: "#1d355f",
								opacity: busy ? 0.62 : 1,
							},
						}, jsx("span", {
							style: { display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 700 },
						}, jsx("span", {
							"aria-hidden": "true",
							style: {
								width: "14px",
								height: "14px",
								borderRadius: "50%",
								border: active ? "4px solid #4f8fe8" : "1.5px solid #9aabc4",
								background: "#fff",
								flex: "none",
							},
						}), option.title, busy ? jsx("span", { style: { color: "#4f8fe8", fontWeight: 500 } }, "保存中…") : null),
						jsx("span", { style: { fontSize: "12px", lineHeight: 1.55, color: "#6d7f99" } }, option.hint));
					});
					return jsx("section", {
						style: {
							display: "flex",
							flexDirection: "column",
							gap: "14px",
							padding: "4px 2px 14px",
							maxWidth: "640px",
						},
					},
					jsx("div", {
						style: { display: "flex", flexDirection: "column", gap: "5px" },
					},
					jsx("h3", { style: { margin: 0, fontSize: "16px", color: "#172e55" } }, "显示位置"),
					jsx("p", { style: { margin: 0, fontSize: "13px", lineHeight: 1.65, color: "#6d7f99" } }, "选择刑小狮出现在哪里。桌面模式会打开一个透明置顶的小窗口，可拖动、点击和右键互动。")),
					jsx("div", {
						role: "radiogroup",
						"aria-label": "刑小狮显示位置",
						style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px" },
					}, cards),
					error ? jsx("p", { style: { margin: 0, fontSize: "12px", color: "#c74a3f" } }, error) : null);
				}
				try {
					slots.inject("settings.section", function* () {
						yield slots.register({
							name: "settings.section",
							id: "lion-pet-config",
							order: 32,
							label: () => "刑小狮桌宠",
							inject: () => ({}),
						}, LionSettings);
					});
				} catch {
					/* settings section is optional; the pet must still mount */
				}
			}

			function apply(ctx) {
				let host = null;
				let root = null;
				let layer = null;
				let petEl = null;
				let bodyEl = null;
				let frontEl = null;
				let sideEl = null;
				let bubbleEl = null;
				let menuEl = null;
				let wakeEl = null;
				let particlesEl = null;
				let locked = false;

				let vw = 0;
				let vh = 0;
				let x = 0;
				let y = 0;
				let w = 200;
				let h = 278;

				let drag = null;
				let inertiaRaf = 0;
				let walkRaf = 0;
				let idleTimer = 0;
				let greetingTimer = 0;
				let bubbleTimer = 0;
				let happyTimer = 0;
				let spinTimer = 0;
				let menuOpen = false;
				let pose = "front";
				let facing = "left";
				let velocityX = 0;
				let velocityY = 0;
				let domReadyHandler = null;
				let display = "both";
				let displayTimer = 0;

				const state = loadState();
				locked = state.locked;

				const listeners = [];

				function on(target, type, handler, options) {
					target.addEventListener(type, handler, options);
					listeners.push(() => target.removeEventListener(type, handler, options));
				}

				function measureViewport() {
					const doc = document.documentElement;
					vw = Math.max(320, window.innerWidth || (doc && doc.clientWidth) || 1280);
					vh = Math.max(320, window.innerHeight || (doc && doc.clientHeight) || 800);
				}

				function measurePet() {
					w = clamp(Math.round(state.size), MIN_SIZE, MAX_SIZE);
					h = Math.round(w * FRONT_RATIO);
				}

				function applyGeometry() {
					if (!petEl) return;
					petEl.style.width = w + "px";
					petEl.style.height = h + "px";
					petEl.classList.toggle("is-locked", locked);
				}

				function persist() {
					try {
						window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
							x: Math.round(x),
							y: Math.round(y),
							size: Math.round(state.size),
							hidden: state.hidden === true,
							locked: locked === true,
							positioned: state.positioned === true
						}));
					} catch {
						/* ignore storage failures */
					}
				}

				function positionBubble() {
					if (!bubbleEl || !bubbleEl.classList.contains("is-on")) return;
					bubbleEl.classList.remove("below", "align-left", "align-right");
					const bw = bubbleEl.offsetWidth || 220;
					const bh = bubbleEl.offsetHeight || 56;
					if (y < bh + 18) bubbleEl.classList.add("below");
					if (x + w / 2 - bw / 2 < 10) bubbleEl.classList.add("align-left");
					else if (x + w / 2 + bw / 2 > vw - 10) bubbleEl.classList.add("align-right");
				}

				function say(text, duration) {
					if (!bubbleEl || !text) return;
					bubbleEl.textContent = text;
					bubbleEl.classList.add("is-on");
					window.clearTimeout(bubbleTimer);
					positionBubble();
					bubbleTimer = window.setTimeout(() => {
						if (bubbleEl) bubbleEl.classList.remove("is-on");
					}, duration || 4800);
				}

				function setPose(nextPose, nextFacing) {
					pose = nextPose;
					if (nextFacing) facing = nextFacing;
					if (!petEl || !bodyEl) return;
					petEl.classList.toggle("pose-side", pose === "side");
					bodyEl.style.setProperty("--lp-flip", facing === "right" ? "-1" : "1");
				}

				function setPosition(nextX, nextY, save) {
					x = clamp(nextX, 0, Math.max(0, vw - w));
					y = clamp(nextY, 0, Math.max(0, vh - h));
					if (petEl) petEl.style.transform = "translate3d(" + x + "px, " + y + "px, 0)";
					positionBubble();
					if (save) persist();
				}

				function resetPosition(save) {
					measureViewport();
					measurePet();
					applyGeometry();
					state.positioned = false;
					setPosition(vw - w - 28, vh - h - 180, false);
					if (save === true) persist();
				}

				function setSize(nextSize, save) {
					const oldW = w;
					const oldH = h;
					state.size = clamp(Math.round(nextSize), MIN_SIZE, MAX_SIZE);
					measurePet();
					applyGeometry();
					if (state.positioned) {
						const centerShift = (oldW - w) / 2;
						const bottomShift = oldH - h;
						setPosition(x + centerShift, y + bottomShift, false);
					} else {
						setPosition(vw - w - 28, vh - h - 180, false);
					}
					if (save === true) persist();
				}

				function spawnParticles(count) {
					if (!particlesEl) return;
					const n = count || 6;
					for (let i = 0; i < n; i += 1) {
						const p = document.createElement("span");
						p.className = "lp-particle";
						p.textContent = pick(PARTICLE_GLYPHS);
						p.style.color = pick(PARTICLE_COLORS);
						p.style.left = (46 + Math.random() * 10) + "%";
						p.style.setProperty("--lp-dx", (Math.random() * 110 - 55).toFixed(1) + "px");
						p.style.setProperty("--lp-dy", (-55 - Math.random() * 75).toFixed(1) + "px");
						p.style.setProperty("--lp-rot", (Math.random() * 80 - 40).toFixed(1) + "deg");
						p.style.fontSize = (13 + Math.random() * 9).toFixed(1) + "px";
						p.style.animationDelay = (Math.random() * 0.12).toFixed(2) + "s";
						particlesEl.appendChild(p);
						window.setTimeout(() => p.remove(), 1500);
					}
				}

				function cancelWalk() {
					if (walkRaf) {
						window.cancelAnimationFrame(walkRaf);
						walkRaf = 0;
					}
					if (petEl) petEl.classList.remove("is-walking");
					setPose("front");
				}

				function cancelInertia() {
					if (inertiaRaf) {
						window.cancelAnimationFrame(inertiaRaf);
						inertiaRaf = 0;
					}
					velocityX = 0;
					velocityY = 0;
				}

				function startInertia() {
					cancelInertia();
					let vx = clamp(velocityX, -42, 42);
					let vy = clamp(velocityY, -42, 42);
					if (Math.hypot(vx, vy) < 0.75) {
						persist();
						return;
					}
					const tick = () => {
						vx *= 0.93;
						vy *= 0.93;
						let nx = x + vx;
						let ny = y + vy;
						if (nx < 0) {
							nx = 0;
							vx *= -0.55;
						} else if (nx > vw - w) {
							nx = vw - w;
							vx *= -0.55;
						}
						if (ny < 0) {
							ny = 0;
							vy *= -0.55;
						} else if (ny > vh - h) {
							ny = vh - h;
							vy *= -0.55;
						}
						setPosition(nx, ny, false);
						if (Math.hypot(vx, vy) > 0.32) {
							inertiaRaf = window.requestAnimationFrame(tick);
						} else {
							inertiaRaf = 0;
							persist();
						}
					};
					inertiaRaf = window.requestAnimationFrame(tick);
				}

				function startWalk() {
					if (state.hidden || drag || locked) return false;
					const margin = 10;
					const maxX = Math.max(margin, vw - w - margin);
					const maxY = Math.max(margin, vh - h - margin);
					const dir = Math.random() < 0.5 ? -1 : 1;
					let targetX = x + dir * (110 + Math.random() * 260);
					if (targetX < margin || targetX > maxX) targetX = x - dir * (110 + Math.random() * 220);
					targetX = clamp(targetX, margin, maxX);
					// Keep idle wandering in the lower strip of the window so the pet
					// never strolls across the middle of a conversation.
					const lowerStripTop = Math.max(margin, vh - h - 180);
					const anchorY = Math.max(y, lowerStripTop);
					const targetY = clamp(anchorY + (Math.random() * 2 - 1) * 28, lowerStripTop, maxY);
					const dx = targetX - x;
					const dy = targetY - y;
					const distance = Math.hypot(dx, dy);
					if (distance < 70) {
						say("鎴戝氨鍦ㄨ繖閲岄櫔浣狅綖");
						return false;
					}
					cancelInertia();
					cancelWalk();
					setPose("side", dx < 0 ? "left" : "right");
					if (petEl) petEl.classList.add("is-walking");
					const fromX = x;
					const fromY = y;
					const duration = clamp(distance / 190 * 1000, 1300, 4400);
					const started = performance.now();
					const step = (now) => {
						const t = Math.min(1, (now - started) / duration);
						const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
						setPosition(fromX + dx * eased, fromY + dy * eased, false);
						if (t < 1) {
							walkRaf = window.requestAnimationFrame(step);
						} else {
							walkRaf = 0;
							if (petEl) petEl.classList.remove("is-walking");
							setPose("front");
							state.positioned = true;
							persist();
						}
					};
					walkRaf = window.requestAnimationFrame(step);
					return true;
				}

				function react(text) {
					if (state.hidden || !petEl) return;
					cancelWalk();
					cancelInertia();
					setPose("front");
					petEl.classList.remove("is-happy");
					void petEl.offsetWidth;
					petEl.classList.add("is-happy");
					window.clearTimeout(happyTimer);
					happyTimer = window.setTimeout(() => {
						if (petEl) petEl.classList.remove("is-happy");
					}, 640);
					spawnParticles(7);
					say(text || pick(REACTIONS));
				}

				function spin() {
					if (state.hidden || !petEl) return;
					cancelWalk();
					setPose("front");
					petEl.classList.remove("is-spinning");
					void petEl.offsetWidth;
					petEl.classList.add("is-spinning");
					window.clearTimeout(spinTimer);
					spinTimer = window.setTimeout(() => {
						if (petEl) petEl.classList.remove("is-spinning");
					}, 820);
					spawnParticles(5);
					say(pick(["转圈圈～", "看我的狮子回旋！", "晕乎乎……但很好看。"]));
				}

				function webVisible() {
					return display === "web" || display === "both";
				}

				function applyVisibility() {
					if (!host || !petEl || !wakeEl) return;
					host.style.display = webVisible() ? "block" : "none";
					if (!webVisible()) {
						closeMenu();
						cancelWalk();
						cancelInertia();
						if (bubbleEl) bubbleEl.classList.remove("is-on");
						return;
					}
					petEl.hidden = state.hidden === true;
					wakeEl.hidden = state.hidden !== true;
					if (state.hidden) {
						closeMenu();
						cancelWalk();
						cancelInertia();
						if (bubbleEl) bubbleEl.classList.remove("is-on");
					}
				}

				async function refreshDisplay() {
					const next = await readDisplay();
					if (!next || next === display) return;
					const wasVisible = webVisible();
					display = next;
					applyVisibility();
					if (!wasVisible && webVisible() && !state.hidden) {
						say("我从桌面溜回来啦～");
					}
				}

				function toggleLock() {
					locked = !locked;
					state.locked = locked;
					if (petEl) petEl.classList.toggle("is-locked", locked);
					if (menuEl) {
						const label = menuEl.querySelector(".lp-lock-label");
						if (label) label.textContent = locked ? "解除锁定" : "锁定位置";
					}
					persist();
					say(locked ? "位置锁好啦，我不会乱跑。" : "解锁！又可以到处溜达了。");
				}

				function closeMenu() {
					if (!menuEl) return;
					const hadFocus = menuEl.contains(document.activeElement);
					menuOpen = false;
					menuEl.classList.remove("is-on");
					menuEl.setAttribute("aria-hidden", "true");
					if (hadFocus && petEl) petEl.focus({ preventScroll: true });
				}

				function openMenu(clientX, clientY) {
					if (!menuEl || state.hidden) return;
					menuOpen = true;
					menuEl.classList.add("is-on");
					menuEl.setAttribute("aria-hidden", "false");
					menuEl.style.left = "0px";
					menuEl.style.top = "0px";
					const mw = menuEl.offsetWidth || 192;
					const mh = menuEl.offsetHeight || 260;
					let left = clientX + 8;
					let top = clientY + 8;
					if (left + mw > vw - 8) left = clientX - mw - 8;
					if (top + mh > vh - 8) top = clientY - mh - 8;
					menuEl.style.left = clamp(left, 8, Math.max(8, vw - mw - 8)) + "px";
					menuEl.style.top = clamp(top, 8, Math.max(8, vh - mh - 8)) + "px";
					const first = menuEl.querySelector("button");
					if (first) first.focus({ preventScroll: true });
				}

				function handleMenuAction(action) {
					closeMenu();
					if (action === "pet") react();
					else if (action === "walk") {
						if (!startWalk()) say("现在不想动，先陪你待着。");
					} else if (action === "spin") spin();
					else if (action === "smaller") {
						if (state.size <= MIN_SIZE) say("已经是最小只啦！");
						else setSize(state.size - 28, true);
					} else if (action === "bigger") {
						if (state.size >= MAX_SIZE) say("再大就装不下啦！");
						else setSize(state.size + 28, true);
					} else if (action === "lock") toggleLock();
					else if (action === "reset") {
						resetPosition(true);
						say("回到我的老位置啦。");
					} else if (action === "hide") {
						state.hidden = true;
						persist();
						applyVisibility();
					}
				}

				function onPointerDown(event) {
					if (event.button !== 0 || state.hidden) return;
					closeMenu();
					cancelInertia();
					cancelWalk();
					if (bubbleEl) bubbleEl.classList.remove("is-on");
					drag = {
						id: event.pointerId,
						sx: event.clientX,
						sy: event.clientY,
						ox: x,
						oy: y,
						moved: false,
						locked,
						lastX: event.clientX,
						lastY: event.clientY,
						lastT: performance.now()
					};
					velocityX = 0;
					velocityY = 0;
					if (petEl && petEl.setPointerCapture) {
						try { petEl.setPointerCapture(event.pointerId); } catch {}
					}
					if (!locked && petEl) petEl.classList.add("is-dragging");
					if (bodyEl) bodyEl.style.setProperty("--lp-tilt", "0deg");
					event.preventDefault();
				}

				function onPointerMove(event) {
					if (!drag || event.pointerId !== drag.id) return;
					const dx = event.clientX - drag.sx;
					const dy = event.clientY - drag.sy;
					if (Math.hypot(dx, dy) > 4) {
						drag.moved = true;
						if (!drag.locked) state.positioned = true;
					}
					if (drag.locked) return;
					const now = performance.now();
					const dt = Math.max(1, now - drag.lastT);
					const rawVx = (event.clientX - drag.lastX) / dt * 16;
					const rawVy = (event.clientY - drag.lastY) / dt * 16;
					velocityX = velocityX * 0.55 + rawVx * 0.45;
					velocityY = velocityY * 0.55 + rawVy * 0.45;
					drag.lastX = event.clientX;
					drag.lastY = event.clientY;
					drag.lastT = now;
					if (bodyEl) bodyEl.style.setProperty("--lp-tilt", clamp(velocityX * 0.28, -9, 9).toFixed(2) + "deg");
					setPosition(drag.ox + dx, drag.oy + dy, false);
				}

				function endDrag(event) {
					if (!drag || (event && event.pointerId !== drag.id)) return;
					const wasMoved = drag.moved;
					const wasLocked = drag.locked;
					if (petEl && petEl.releasePointerCapture) {
						try { petEl.releasePointerCapture(drag.id); } catch {}
					}
					if (petEl) petEl.classList.remove("is-dragging");
					if (bodyEl) bodyEl.style.setProperty("--lp-tilt", "0deg");
					drag = null;
					if (!wasMoved) {
						react();
						return;
					}
					if (wasLocked) {
						persist();
						return;
					}
					startInertia();
				}

				function scheduleIdle() {
					window.clearTimeout(idleTimer);
					const delay = 9000 + Math.random() * 13000;
					idleTimer = window.setTimeout(() => {
						if (!state.hidden && !drag && !menuOpen && document.visibilityState !== "hidden") {
							const roll = Math.random();
							if (roll < 0.48) say(pick(LINES));
							else if (roll < 0.8) startWalk();
							else if (roll < 0.9) spin();
							else react(pick(REACTIONS));
						}
						scheduleIdle();
					}, delay);
				}

				function mount() {
					if (host || !document.body) return;
					host = document.createElement("div");
					host.id = "dsh-lion-pet-host";
					host.setAttribute("data-dsh-plugin", "lion-pet");
					host.style.cssText = "position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:2147483000;display:block;pointer-events:none;";
					root = host.attachShadow({ mode: "open" });
					root.innerHTML = `
						<style>${CSS}</style>
						<div class="lp-layer">
							<div class="lp-pet" role="button" tabindex="0" aria-label="刑小狮桌宠：拖动可以搬家，单击摸摸头，右键打开菜单">
								<div class="lp-halo"></div>
								<div class="lp-shadow"></div>
								<div class="lp-body">
									<img class="lp-img lp-front is-on" alt="" draggable="false" src="${FRONT}">
									<img class="lp-img lp-side" alt="" draggable="false" src="${SIDE}">
									<div class="lp-particles"></div>
								</div>
								<div class="lp-bubble" role="status" aria-live="polite"></div>
							</div>
							<div class="lp-menu" role="menu" aria-hidden="true" aria-label="刑小狮菜单">
								<button type="button" role="menuitem" data-action="pet"><span class="lp-dot"></span>摸摸头</button>
								<button type="button" role="menuitem" data-action="walk"><span class="lp-dot red"></span>散散步</button>
								<button type="button" role="menuitem" data-action="spin"><span class="lp-dot yellow"></span>转个圈</button>
								<div class="lp-sep"></div>
								<button type="button" role="menuitem" data-action="smaller"><span class="lp-dot green"></span>缩小一点</button>
								<button type="button" role="menuitem" data-action="bigger"><span class="lp-dot green"></span>放大一点</button>
								<button type="button" role="menuitem" data-action="lock"><span class="lp-dot"></span><span class="lp-lock-label">锁定位置</span></button>
								<div class="lp-sep"></div>
								<button type="button" role="menuitem" data-action="reset"><span class="lp-dot"></span>回到右下角</button>
								<button type="button" role="menuitem" data-action="hide"><span class="lp-dot red"></span>隐藏刑小狮</button>
							</div>
							<button type="button" class="lp-wake" hidden aria-label="唤醒刑小狮">
								<span class="lp-wake-face"><img alt="" draggable="false" src="${FRONT}"></span>
								<span>唤醒刑小狮</span>
							</button>
						</div>
					`;
					document.documentElement.appendChild(host);

					layer = root.querySelector(".lp-layer");
					petEl = root.querySelector(".lp-pet");
					bodyEl = root.querySelector(".lp-body");
					frontEl = root.querySelector(".lp-front");
					sideEl = root.querySelector(".lp-side");
					bubbleEl = root.querySelector(".lp-bubble");
					menuEl = root.querySelector(".lp-menu");
					wakeEl = root.querySelector(".lp-wake");
					particlesEl = root.querySelector(".lp-particles");

					measureViewport();
					measurePet();
					applyGeometry();
					if (state.positioned && Number.isFinite(state.x) && Number.isFinite(state.y)) {
						setPosition(state.x, state.y, false);
					} else {
						resetPosition(false);
					}
					applyVisibility();
					setPose("front");

					const lockLabel = menuEl.querySelector(".lp-lock-label");
					if (lockLabel) lockLabel.textContent = locked ? "解除锁定" : "锁定位置";

					on(petEl, "pointerdown", onPointerDown);
					on(petEl, "pointermove", onPointerMove);
					on(petEl, "pointerup", endDrag);
					on(petEl, "pointercancel", endDrag);
					on(petEl, "contextmenu", (event) => {
						event.preventDefault();
						event.stopPropagation();
						openMenu(event.clientX, event.clientY);
					});
					on(petEl, "keydown", (event) => {
						if (event.key === "Enter" || event.key === " ") {
							event.preventDefault();
							react();
						} else if (event.key === "ContextMenu" || event.key === "m" || event.key === "M") {
							event.preventDefault();
							const rect = petEl.getBoundingClientRect();
							openMenu(rect.left + rect.width * 0.72, rect.top + rect.height * 0.38);
						}
					});
					on(wakeEl, "click", () => {
						state.hidden = false;
						persist();
						applyVisibility();
						window.setTimeout(() => say("我回来啦！"), 260);
					});
					on(menuEl, "click", (event) => {
						const button = event.target && event.target.closest ? event.target.closest("button[data-action]") : null;
						if (button) handleMenuAction(button.dataset.action);
					});
					on(menuEl, "keydown", (event) => {
						if (event.key === "Escape") {
							event.preventDefault();
							closeMenu();
							if (petEl) petEl.focus({ preventScroll: true });
							return;
						}
						if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
						const items = Array.from(menuEl.querySelectorAll("button[data-action]"));
						const index = items.indexOf(document.activeElement);
						if (!items.length) return;
						event.preventDefault();
						const next = event.key === "ArrowDown" ? (index + 1 + items.length) % items.length : (index - 1 + items.length) % items.length;
						items[next].focus({ preventScroll: true });
					});
					on(document, "pointerdown", (event) => {
						if (!menuOpen) return;
						const path = event.composedPath ? event.composedPath() : [];
						if (path.includes(menuEl) || path.includes(petEl)) return;
						closeMenu();
					}, true);
					on(document, "keydown", (event) => {
						if (event.key === "Escape" && menuOpen) {
							event.preventDefault();
							closeMenu();
						}
					});
					on(window, "resize", () => {
						measureViewport();
						if (state.positioned) {
							setPosition(x, y, false);
						} else {
							resetPosition(false);
						}
					});
					on(window, "blur", () => {
						if (drag) endDrag({ pointerId: drag.id });
					});
					on(window, "dsh-lion-pet:display", (event) => {
						const next = normalizeDisplay(event && event.detail);
						if (next === display) return;
						display = next;
						applyVisibility();
					});

					refreshDisplay();
					displayTimer = window.setInterval(refreshDisplay, 2500);
					greetingTimer = window.setTimeout(() => {
						if (!state.hidden && webVisible()) say("嗨，我是刑小狮！今天也一起加油吧～");
					}, 900);
					scheduleIdle();
				}

				function unmount() {
					window.clearTimeout(idleTimer);
					window.clearTimeout(greetingTimer);
					window.clearTimeout(bubbleTimer);
					window.clearTimeout(happyTimer);
					window.clearTimeout(spinTimer);
					window.clearInterval(displayTimer);
					window.cancelAnimationFrame(inertiaRaf);
					window.cancelAnimationFrame(walkRaf);
					if (domReadyHandler) {
						document.removeEventListener("DOMContentLoaded", domReadyHandler);
						domReadyHandler = null;
					}
					for (const off of listeners.splice(0)) {
						try { off(); } catch {}
					}
					if (host && host.parentNode) host.parentNode.removeChild(host);
					host = null;
					root = null;
					layer = null;
					petEl = null;
					bodyEl = null;
					frontEl = null;
					sideEl = null;
					bubbleEl = null;
					menuEl = null;
					wakeEl = null;
					particlesEl = null;
				}

				const dispose = () => {
					unmount();
				};

				const start = () => {
					if (!document.body) {
						domReadyHandler = start;
						document.addEventListener("DOMContentLoaded", start, { once: true });
						return;
					}
					mount();
				};
				try {
					registerSettings(ctx, require);
				} catch (error) {
					// A settings-slot problem must never take the pet down with it.
					console.warn("[dsh-lion-pet] settings registration failed", error);
				}
				start();
				if (ctx && typeof ctx.effect === "function") {
					ctx.effect(() => dispose, "dsh-lion-pet: floating overlay");
				} else {
					return dispose;
				}
			}

			const module = { exports: { name: "lion-pet", inject: ["slots"], apply } };
			return module.exports;
		}
	});
})();
