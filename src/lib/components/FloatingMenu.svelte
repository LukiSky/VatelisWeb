<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { PHYSICS_KEY, type PhysicsContext } from './PhysicsWorld.svelte';
	import { transitionStore } from '$lib/stores/transition.svelte';
	import { Menu, X } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import MatterModule from 'matter-js';

	const { Bodies, Body } = MatterModule;
	const physics = getContext<PhysicsContext>(PHYSICS_KEY);

	interface MenuItem {
		label: string;
		href: string;
		el?: HTMLDivElement;
		bodyId: string;
	}

	const menuItems: MenuItem[] = [
		{ label: 'Home', href: '/', bodyId: 'menu-home' },
		{ label: 'About', href: '/about', bodyId: 'menu-about' },
		{ label: 'Services', href: '/services', bodyId: 'menu-services' },
		{ label: 'Portfolio', href: '/portfolio', bodyId: 'menu-portfolio' },
		{ label: 'Contact', href: '/contact', bodyId: 'menu-contact' }
	];

	let menuEls: HTMLDivElement[] = $state([]);
	let currentPath = $derived($page.url.pathname);
	let isOpen = $state(true); // Toggle state

	const startX = 100;
	const startY = window.innerHeight * 0.3;
	const spacing = 55;

	onMount(() => {

		menuItems.forEach((item, i) => {
			const x = startX;
			const y = startY + i * spacing;
			const body = Bodies.rectangle(x, y, 120, 36, {
				frictionAir: 0.08,
				restitution: 0.4,
				mass: 0.8,
				label: item.bodyId,
				chamfer: { radius: 4 }
			});
			physics.addBody(item.bodyId, body, {
				spring: { x, y, stiffness: 0.02, damping: 0.12 }
			});
		});

		// Update DOM positions from physics each frame
		let animId: number;
		const update = () => {
			animId = requestAnimationFrame(update);
			const allBodies = physics.getBodies();
			
			menuItems.forEach((item, i) => {
				const entry = allBodies.get(item.bodyId);
				const el = menuEls[i];
				if (entry && el) {
					// Update spring targets based on toggle state
					if (entry.spring) {
						entry.spring.pointB.x = isOpen ? startX : -150; // Pull off screen if closed
					}
					
					const { x, y } = entry.body.position;
					const angle = entry.body.angle;
					el.style.transform = `translate(${x - 60}px, ${y - 18}px) rotate(${angle}rad)`;
				}
			});
		};
		update();

		return () => {
			cancelAnimationFrame(animId);
			menuItems.forEach((item) => physics.removeBody(item.bodyId));
		};
	});

	function handleNav(href: string) {
		if (href === currentPath) return;
		transitionStore.trigger(href);
	}

	function toggleMenu() {
		isOpen = !isOpen;
	}
</script>

<!-- Menu Toggle Button -->
<div class="menu-toggle-container">
	<Button variant="default" size="icon" onclick={toggleMenu} aria-label="Toggle Menu">
		{#if isOpen}
			<X size={20} />
		{:else}
			<Menu size={20} />
		{/if}
	</Button>
</div>

<nav id="floating-menu" aria-label="Main navigation">
	{#each menuItems as item, i}
		<div
			bind:this={menuEls[i]}
			class="menu-item"
			class:active={currentPath === item.href}
			role="link"
			tabindex="0"
			onclick={() => handleNav(item.href)}
			onkeydown={(e) => e.key === 'Enter' && handleNav(item.href)}
		>
			<span class="menu-label">{item.label}</span>
			{#if currentPath === item.href}
				<div class="active-indicator"></div>
			{/if}
		</div>
	{/each}
</nav>

<style>
	.menu-toggle-container {
		position: fixed;
		top: 30px;
		left: 40px;
		z-index: 20;
		pointer-events: all;
	}

	nav {
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: 10;
	}

	.menu-item {
		position: fixed;
		top: 0;
		left: 0;
		width: 120px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: all;
		cursor: pointer;
		user-select: none;
		transition: filter 0.2s ease;
		will-change: transform;
	}

	.menu-label {
		font-family: 'Outfit', sans-serif;
		font-size: 0.95rem;
		font-weight: 500;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.65);
		text-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
		transition: all 0.25s ease;
	}

	.menu-item:hover .menu-label {
		color: #FFD700;
		text-shadow: 0 0 20px rgba(255, 215, 0, 0.5), 0 0 40px rgba(255, 215, 0, 0.2);
	}

	.menu-item.active .menu-label {
		color: #FFD700;
		font-weight: 700;
		text-shadow: 0 0 25px rgba(255, 215, 0, 0.6), 0 0 50px rgba(255, 215, 0, 0.2);
	}

	.active-indicator {
		position: absolute;
		bottom: 2px;
		left: 50%;
		transform: translateX(-50%);
		width: 30px;
		height: 2px;
		background: linear-gradient(90deg, transparent, #FFD700, transparent);
		box-shadow: 0 0 10px rgba(255, 215, 0, 0.6);
		animation: pulse-glow 2s ease-in-out infinite;
	}

	@keyframes pulse-glow {
		0%, 100% { opacity: 0.7; }
		50% { opacity: 1; }
	}
</style>
