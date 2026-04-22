<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import MultiverseBackground from '$lib/components/MultiverseBackground.svelte';
	import PhysicsWorld from '$lib/components/PhysicsWorld.svelte';
	import FloatingMenu from '$lib/components/FloatingMenu.svelte';
	import TransitionOverlay from '$lib/components/TransitionOverlay.svelte';

	let { children }: { children: Snippet } = $props();
</script>

<svelte:head>
	<title>Vatelis — Multiversal Experience</title>
</svelte:head>

<!-- Three.js cinematic background (z: 0) -->
<MultiverseBackground />

<!-- Physics world wraps all interactive elements -->
<PhysicsWorld>
	<!-- Floating navigation menu (z: 10) -->
	<FloatingMenu />

	<!-- Page content (z: 5) -->
	<main id="page-content">
		{@render children()}
	</main>

	<!-- Hyperdrive transition effect (z: 100) -->
	<TransitionOverlay />
</PhysicsWorld>

<style>
	:global(#page-content) {
		position: fixed;
		inset: 0;
		z-index: 5;
		pointer-events: none;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
