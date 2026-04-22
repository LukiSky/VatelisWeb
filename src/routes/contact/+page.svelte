<script lang="ts">
	import { onMount } from 'svelte';
	import gsap from 'gsap';

	let titleEl: HTMLHeadingElement;
	let subtitleEl: HTMLParagraphElement;

	onMount(() => {
		gsap.fromTo(titleEl, { opacity: 0, y: 40, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out', delay: 0.3 });
		gsap.fromTo(subtitleEl, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.6 });
	});
</script>

<svelte:head>
	<title>Vatelis — Contact</title>
</svelte:head>

<div class="placeholder-page" style="pointer-events: all;">
	<h1 bind:this={titleEl} class="page-title">Contact</h1>
	<p bind:this={subtitleEl} class="page-subtitle">Sample placeholder text to test layout.</p>
</div>

<style>
	.placeholder-page {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
</style>
