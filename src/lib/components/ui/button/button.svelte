<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		class?: string;
		variant?: 'default' | 'ghost' | 'outline';
		size?: 'default' | 'sm' | 'icon';
		children?: Snippet;
	}

	let {
		class: className = '',
		variant = 'default',
		size = 'default',
		children,
		...rest
	}: Props = $props();

	// Custom Shadcn-like component for Vatelis, fully customized for the theme
	const variants = {
		default: 'bg-[rgba(138,43,226,0.15)] border border-[rgba(138,43,226,0.4)] text-white hover:bg-[rgba(138,43,226,0.25)] hover:shadow-[0_0_20px_rgba(138,43,226,0.4)]',
		ghost: 'hover:bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.7)] hover:text-[#FFD700]',
		outline: 'border border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.05)] text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.15)]'
	};
	
	const sizes = {
		default: 'h-10 px-4 py-2',
		sm: 'h-8 px-3 py-1 text-xs',
		icon: 'h-10 w-10'
	};
</script>

<button
	class={cn(
		"inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(138,43,226,0.5)] disabled:pointer-events-none disabled:opacity-50 backdrop-blur-sm cursor-pointer",
		variants[variant],
		sizes[size],
		className
	)}
	{...rest}
>
	{@render children?.()}
</button>
