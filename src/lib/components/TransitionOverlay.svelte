<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { transitionStore } from '$lib/stores/transition.svelte';
	import gsap from 'gsap';

	let canvas: HTMLCanvasElement;
	let overlayEl: HTMLDivElement;

	onMount(() => {
		const ctx = canvas.getContext('2d')!;
		let w = window.innerWidth;
		let h = window.innerHeight;
		canvas.width = w;
		canvas.height = h;

		const resize = () => {
			w = window.innerWidth;
			h = window.innerHeight;
			canvas.width = w;
			canvas.height = h;
		};
		window.addEventListener('resize', resize);

		// Speed lines for warp effect
		interface SpeedLine {
			x: number;
			y: number;
			length: number;
			speed: number;
			alpha: number;
			hue: number;
		}

		const lines: SpeedLine[] = [];
		for (let i = 0; i < 120; i++) {
			lines.push({
				x: Math.random() * w,
				y: Math.random() * h,
				length: Math.random() * 80 + 20,
				speed: Math.random() * 15 + 5,
				alpha: Math.random() * 0.6 + 0.1,
				hue: Math.random() > 0.5 ? 270 : 45
			});
		}

		let warpActive = false;
		let warpProgress = 0;
		let animId: number;

		const drawWarp = () => {
			animId = requestAnimationFrame(drawWarp);
			if (!warpActive) return;

			ctx.fillStyle = `rgba(0, 0, 0, ${0.3 + warpProgress * 0.3})`;
			ctx.fillRect(0, 0, w, h);

			const cx = w * 0.5;
			const cy = h * 0.5;

			for (const line of lines) {
				// Horizontal hyperdrive to the right
				const lineLen = line.length * (1 + warpProgress * 5);
				const endX = line.x + lineLen;
				const endY = line.y;

				ctx.beginPath();
				ctx.moveTo(line.x, line.y);
				ctx.lineTo(endX, endY);
				const lightness = line.hue === 270 ? '50%' : '60%';
				ctx.strokeStyle = `hsla(${line.hue}, 80%, ${lightness}, ${line.alpha * warpProgress})`;
				ctx.lineWidth = 1 + warpProgress * 2;
				ctx.stroke();

				// Move towards the right
				line.x += line.speed * (1 + warpProgress * 15);

				// Reset if out of bounds (re-enter from the left)
				if (line.x > w + 50) {
					line.x = -150 - Math.random() * 200;
					line.y = Math.random() * h;
				}
			}

			// Right-side portal glow
			const gradient = ctx.createRadialGradient(w, cy, 0, w, cy, h * warpProgress);
			gradient.addColorStop(0, `rgba(138, 43, 226, ${0.4 * warpProgress})`);
			gradient.addColorStop(0.5, `rgba(138, 43, 226, ${0.1 * warpProgress})`);
			gradient.addColorStop(1, 'transparent');
			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, w, h);
		};
		requestAnimationFrame(drawWarp);

		// Watch for transition triggers
		$effect(() => {
			if (transitionStore.phase === 'suckin') {
				warpActive = true;
				overlayEl.style.pointerEvents = 'all';

				const tl = gsap.timeline({
					onComplete: async () => {
						transitionStore.setPhase('warp');
					}
				});

				// Suck-in: darken + start warp
				tl.to({ val: 0 }, {
					val: 1,
					duration: 0.6,
					ease: 'power2.in',
					onUpdate: function() { warpProgress = this.targets()[0].val; }
				});
			}

			if (transitionStore.phase === 'warp') {
				// Peak warp + navigate
				const tl = gsap.timeline({
					onComplete: () => {
						transitionStore.setPhase('snapin');
					}
				});

				tl.to({ val: warpProgress }, {
					val: 1,
					duration: 0.3,
					ease: 'power3.in',
					onUpdate: function() { warpProgress = this.targets()[0].val; }
				});

				tl.call(() => {
					goto(transitionStore.targetUrl);
				}, [], 0.15);
			}

			if (transitionStore.phase === 'snapin') {
				const tl = gsap.timeline({
					onComplete: () => {
						warpActive = false;
						warpProgress = 0;
						ctx.clearRect(0, 0, w, h);
						overlayEl.style.pointerEvents = 'none';
						transitionStore.reset();
					}
				});

				tl.to({ val: warpProgress }, {
					val: 0,
					duration: 0.7,
					ease: 'power2.out',
					onUpdate: function() { warpProgress = this.targets()[0].val; }
				});
			}
		});

		return () => {
			cancelAnimationFrame(animId);
			window.removeEventListener('resize', resize);
		};
	});
</script>

<div bind:this={overlayEl} class="transition-overlay">
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	.transition-overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		pointer-events: none;
	}
	canvas {
		width: 100%;
		height: 100%;
	}
</style>
