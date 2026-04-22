<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { PHYSICS_KEY, type PhysicsContext } from './PhysicsWorld.svelte';
	import MatterModule from 'matter-js';

	const { Bodies, Body } = MatterModule;
	const physics = getContext<PhysicsContext>(PHYSICS_KEY);

	let mascotEl: HTMLDivElement;
	let emotion = $state<'neutral' | 'happy' | 'thinking' | 'excited'>('neutral');
	let breathPhase = $state(0);
	let mouseOffset = $state({ x: 0, y: 0 });

	onMount(() => {
		const w = window.innerWidth;
		const h = window.innerHeight;
		const cx = w * 0.45;
		const cy = h * 0.48;

		// Heavy mascot physics body
		const mascotBody = Bodies.circle(cx, cy, 80, {
			frictionAir: 0.04,
			restitution: 0.3,
			mass: 50,
			label: 'mascot'
		});
		physics.addBody('mascot', mascotBody, {
			spring: { x: cx, y: cy, stiffness: 0.008, damping: 0.15 }
		});

		// Stepped breathing animation (Spider-Verse 12fps)
		let animId: number;
		let lastStepTime = 0;
		const STEP_INTERVAL = 1000 / 12; // 12fps

		const update = (time: number) => {
			animId = requestAnimationFrame(update);

			// Stepped time for Spider-Verse feel
			if (time - lastStepTime >= STEP_INTERVAL) {
				lastStepTime = time;
				breathPhase = Math.sin(time * 0.002) * 0.03;
			}

			// Update DOM from physics
			const entry = physics.getBodies().get('mascot');
			if (entry && mascotEl) {
				const { x, y } = entry.body.position;
				const angle = entry.body.angle;
				const scale = 1 + breathPhase;
				mascotEl.style.transform = `translate(${x - 140}px, ${y - 170}px) rotate(${angle}rad) scale(${scale})`;
			}
		};
		requestAnimationFrame(update);

		// Mouse parallax for 3D illusion
		const onMove = (e: MouseEvent) => {
			mouseOffset = {
				x: (e.clientX / w - 0.5) * 12,
				y: (e.clientY / h - 0.5) * 8
			};
		};
		window.addEventListener('mousemove', onMove);

		return () => {
			cancelAnimationFrame(animId);
			physics.removeBody('mascot');
			window.removeEventListener('mousemove', onMove);
		};
	});
</script>

<div class="mascot-stage">
	<div bind:this={mascotEl} class="mascot-container" data-emotion={emotion}>
		<!-- 3D parallax illusion via layered transforms -->
		<div class="mascot-3d-wrapper" style="transform: perspective(800px) rotateY({mouseOffset.x}deg) rotateX({-mouseOffset.y}deg);">
			<!-- Glow behind mascot -->
			<div class="mascot-glow"></div>
			<!-- The mascot image -->
			<img
				src="/mascots/mascot_neutral_float.png"
				alt="Vatelis Mascot"
				class="mascot-img"
				draggable="false"
			/>
			<!-- Chest reactor glow overlay -->
			<div class="chest-glow"></div>
		</div>
	</div>
</div>

<style>
	.mascot-stage {
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: 5;
	}

	.mascot-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 280px;
		height: 340px;
		pointer-events: all;
		cursor: grab;
		will-change: transform;
		/* Spider-Verse stepped animation */
		animation: float-breathe 4s steps(8) infinite;
	}

	.mascot-container:active { cursor: grabbing; }

	.mascot-3d-wrapper {
		position: relative;
		width: 100%;
		height: 100%;
		transition: transform 0.15s ease-out;
		transform-style: preserve-3d;
	}

	.mascot-img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		filter: drop-shadow(0 0 30px rgba(255, 215, 0, 0.25))
		        drop-shadow(0 0 60px rgba(138, 43, 226, 0.15));
		position: relative;
		z-index: 2;
	}

	.mascot-glow {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 200px;
		height: 200px;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(255, 215, 0, 0.12) 0%, transparent 70%);
		z-index: 1;
		animation: pulse-glow 3s ease-in-out infinite;
	}

	.chest-glow {
		position: absolute;
		top: 55%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, transparent 70%);
		z-index: 3;
		animation: pulse-glow 2s ease-in-out infinite;
		pointer-events: none;
	}

	@keyframes float-breathe {
		0%, 100% { filter: brightness(1); }
		50% { filter: brightness(1.05); }
	}

	@keyframes pulse-glow {
		0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
		50% { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
	}
</style>
