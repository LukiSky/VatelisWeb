<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { PHYSICS_KEY, type PhysicsContext } from './PhysicsWorld.svelte';
	import { Mic, SendHorizonal } from 'lucide-svelte';
	import MatterModule from 'matter-js';

	const { Bodies, Body } = MatterModule;
	const physics = getContext<PhysicsContext>(PHYSICS_KEY);

	interface ChatBubble {
		id: string;
		text: string;
		sender: 'user' | 'bot';
		bodyId: string;
		el?: HTMLDivElement;
	}

	let inputText = $state('');
	let isSending = $state(false);
	let errorMessage = $state('');
	let bubbleEls: HTMLDivElement[] = $state([]);
	let chatContainerEl: HTMLDivElement;
	let inputAreaEl: HTMLDivElement;

	const sampleMessages: ChatBubble[] = [
		{ id: 'b1', text: 'Hey there! Welcome to the multiverse. ✨', sender: 'bot', bodyId: 'chat-b1' },
		{ id: 'b2', text: 'What can you do?', sender: 'user', bodyId: 'chat-b2' },
		{ id: 'b3', text: 'I can help you navigate dimensions, build worlds, and break reality. 🌀', sender: 'bot', bodyId: 'chat-b3' },
		{ id: 'b4', text: "That's incredible!", sender: 'user', bodyId: 'chat-b4' }
	];

	let bubbles = $state<ChatBubble[]>(sampleMessages);

	function addBubblePhysics(bubble: ChatBubble, index: number) {
		const chatX = window.innerWidth * 0.82;
		const by = window.innerHeight * 0.25 + index * 65;
		const bx = chatX + (bubble.sender === 'user' ? 40 : -40);
		const body = Bodies.rectangle(bx, by, 200, 45, {
			frictionAir: 0.06,
			restitution: 0.5,
			mass: 0.3,
			label: bubble.bodyId,
			chamfer: { radius: 8 }
		});
		physics.addBody(bubble.bodyId, body, {
			spring: { x: bx, y: by, stiffness: 0.025, damping: 0.15 }
		});
	}

	async function sendMessage() {
		const text = inputText.trim();
		if (!text || isSending) return;

		const userBubble: ChatBubble = {
			id: crypto.randomUUID(),
			text,
			sender: 'user',
			bodyId: `chat-${crypto.randomUUID()}`
		};
		bubbles = [...bubbles, userBubble];
		addBubblePhysics(userBubble, bubbles.length - 1);
		inputText = '';
		isSending = true;
		errorMessage = '';

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					messages: bubbles.map((bubble) => ({
						role: bubble.sender === 'bot' ? 'model' : 'user',
						text: bubble.text
					}))
				})
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error ?? 'Unable to send message.');

			const botBubble = {
				id: crypto.randomUUID(),
				text: result.reply,
				sender: 'bot' as const,
				bodyId: `chat-${crypto.randomUUID()}`
			};
			bubbles = [
				...bubbles,
				botBubble
			];
			addBubblePhysics(botBubble, bubbles.length - 1);
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Unable to send message.';
		} finally {
			isSending = false;
		}
	}

	onMount(() => {
		const w = window.innerWidth;
		const h = window.innerHeight;
		const chatX = w * 0.82;
		const chatStartY = h * 0.25;
		const bubbleSpacing = 65;

		// Register chat container as physics body (tethered)
		const containerBody = Bodies.rectangle(chatX, h * 0.5, 340, 400, {
			isStatic: true,
			isSensor: true,
			label: 'chat-container'
		});
		physics.addBody('chat-container', containerBody);

		// Create physics bodies for each bubble
		bubbles.forEach((bubble, i) => {
			const bx = chatX + (bubble.sender === 'user' ? 40 : -40);
			const by = chatStartY + i * bubbleSpacing;
			const body = Bodies.rectangle(bx, by, 200, 45, {
				frictionAir: 0.06,
				restitution: 0.5,
				mass: 0.3,
				label: bubble.bodyId,
				chamfer: { radius: 8 }
			});
			physics.addBody(bubble.bodyId, body, {
				spring: { x: bx, y: by, stiffness: 0.025, damping: 0.15 }
			});
		});

		// Input area body (tethered strongly)
		const inputBody = Bodies.rectangle(chatX, h * 0.78, 320, 50, {
			frictionAir: 0.1,
			restitution: 0.2,
			mass: 2,
			label: 'chat-input'
		});
		physics.addBody('chat-input', inputBody, {
			spring: { x: chatX, y: h * 0.78, stiffness: 0.05, damping: 0.2 }
		});

		// Update DOM positions
		let animId: number;
		const update = () => {
			animId = requestAnimationFrame(update);
			const allBodies = physics.getBodies();

			bubbles.forEach((bubble, i) => {
				const entry = allBodies.get(bubble.bodyId);
				const el = bubbleEls[i];
				if (entry && el) {
					const { x, y } = entry.body.position;
					const angle = entry.body.angle;
					el.style.transform = `translate(${x - 120}px, ${y - 22}px) rotate(${angle}rad)`;
				}
			});

			const inputEntry = allBodies.get('chat-input');
			if (inputEntry && inputAreaEl) {
				const { x, y } = inputEntry.body.position;
				const angle = inputEntry.body.angle;
				inputAreaEl.style.transform = `translate(${x - 160}px, ${y - 25}px) rotate(${angle}rad)`;
			}
		};
		requestAnimationFrame(update);

		return () => {
			cancelAnimationFrame(animId);
			bubbles.forEach((b) => physics.removeBody(b.bodyId));
			physics.removeBody('chat-container');
			physics.removeBody('chat-input');
		};
	});
</script>

<div bind:this={chatContainerEl} class="chat-space">
	<!-- Chat bubbles -->
	{#each bubbles as bubble, i}
		<div
			bind:this={bubbleEls[i]}
			class="chat-bubble"
			class:user={bubble.sender === 'user'}
			class:bot={bubble.sender === 'bot'}
		>
			<span class="bubble-text">{bubble.text}</span>
		</div>
	{/each}

	<!-- Input area -->
	<div bind:this={inputAreaEl} class="chat-input-area">
		<div class="input-wrapper">
			<input
				type="text"
				placeholder="Type a message..."
				bind:value={inputText}
				class="chat-input"
				id="chat-input-field"
				disabled={isSending}
				onkeydown={(event) => event.key === 'Enter' && sendMessage()}
			/>
			<button class="btn-mic" aria-label="Microphone" id="btn-mic">
				<Mic size={18} />
			</button>
			<button
				class="btn-send"
				aria-label="Send message"
				id="btn-send"
				disabled={isSending || !inputText.trim()}
				onclick={sendMessage}
			>
				<SendHorizonal size={18} />
			</button>
		</div>
		{#if errorMessage}
			<p class="chat-error" role="alert">{errorMessage}</p>
		{/if}
	</div>
</div>

<style>
	.chat-space {
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: 6;
	}

	.chat-bubble {
		position: fixed;
		top: 0;
		left: 0;
		max-width: 240px;
		padding: 10px 16px;
		border-radius: 16px;
		pointer-events: all;
		cursor: grab;
		will-change: transform;
		backdrop-filter: blur(8px);
		transition: box-shadow 0.3s ease;
	}

	.chat-bubble:active { cursor: grabbing; }

	.chat-bubble.bot {
		background: rgba(138, 43, 226, 0.08);
		border: 1px solid rgba(138, 43, 226, 0.2);
		border-radius: 16px 16px 16px 4px;
	}

	.chat-bubble.user {
		background: rgba(255, 215, 0, 0.06);
		border: 1px solid rgba(255, 215, 0, 0.15);
		border-radius: 16px 16px 4px 16px;
	}

	.chat-bubble:hover {
		box-shadow: 0 0 20px rgba(138, 43, 226, 0.2);
	}

	.bubble-text {
		font-size: 0.85rem;
		font-weight: 400;
		color: rgba(255, 255, 255, 0.85);
		line-height: 1.4;
	}

	.chat-input-area {
		position: fixed;
		top: 0;
		left: 0;
		width: 320px;
		height: 50px;
		pointer-events: all;
		will-change: transform;
	}

	.input-wrapper {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		height: 100%;
		padding: 0 12px;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 25px;
		border: 1px solid rgba(255, 255, 255, 0.06);
		backdrop-filter: blur(12px);
	}

	.chat-input {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		color: white;
		font-family: 'Outfit', sans-serif;
		font-size: 0.85rem;
		font-weight: 300;
		letter-spacing: 0.02em;
	}

	.chat-input::placeholder {
		color: rgba(255, 255, 255, 0.25);
	}

	.btn-mic, .btn-send {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.25s ease;
		background: transparent;
	}

	.btn-mic {
		color: rgba(138, 43, 226, 0.7);
	}
	.btn-mic:hover {
		color: #8A2BE2;
		background: rgba(138, 43, 226, 0.12);
		box-shadow: 0 0 15px rgba(138, 43, 226, 0.3);
	}

	.btn-send {
		color: rgba(255, 215, 0, 0.7);
	}
	.btn-send:hover {
		color: #FFD700;
		background: rgba(255, 215, 0, 0.12);
		box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
	}

	.btn-send:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.chat-error {
		margin: 8px 12px;
		color: #ff9f9f;
		font-size: 0.75rem;
	}

	/* Pulsing ring animation on mic */
	.btn-mic::after {
		content: '';
		position: absolute;
		width: 34px;
		height: 34px;
		border-radius: 50%;
		border: 1px solid rgba(138, 43, 226, 0.3);
		animation: ring-pulse 2.5s ease-in-out infinite;
	}

	@keyframes ring-pulse {
		0%, 100% { transform: scale(1); opacity: 0.5; }
		50% { transform: scale(1.3); opacity: 0; }
	}
</style>
