<script lang="ts">
	import MascotStage from '$lib/components/MascotStage.svelte';
	import ChatSpace from '$lib/components/ChatSpace.svelte';
</script>

<svelte:head>
	<title>Vatelis — Home</title>
	<meta name="description" content="Welcome to Vatelis. Enter the multiverse." />
</svelte:head>

<!-- Mascot floats in center zone -->
<MascotStage />

<!-- Chat space floats in right zone -->
<ChatSpace />
