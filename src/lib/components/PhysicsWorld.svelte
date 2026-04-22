<script lang="ts" module>
	import type Matter from 'matter-js';

	export interface PhysicsContext {
		engine: Matter.Engine;
		world: Matter.World;
		addBody: (id: string, body: Matter.Body, opts?: { spring?: { x: number; y: number; stiffness?: number; damping?: number } }) => void;
		removeBody: (id: string) => void;
		getBodies: () => Map<string, { body: Matter.Body; spring?: Matter.Constraint }>;
		getMousePosition: () => { x: number; y: number };
	}

	export const PHYSICS_KEY = Symbol('physics');
</script>

<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import MatterModule from 'matter-js';

	const { Engine, World, Bodies, Mouse, MouseConstraint, Constraint, Runner, Events } = MatterModule;

	let { children }: { children: Snippet } = $props();
	let container: HTMLDivElement;
	let mousePos = { x: 0, y: 0 };

	// Physics bodies registry
	const bodies = new Map<string, { body: MatterModule.Body; spring?: MatterModule.Constraint }>();

	// Floating DOM debris
	type DomDebris = { body: MatterModule.Body; el: HTMLDivElement; hue: number; size: number };
	let domDebris: DomDebris[] = $state([]);

	const engine = Engine.create({ gravity: { x: 0, y: 0 } });
	const world = engine.world;

	const ctx: PhysicsContext = {
		engine,
		world,
		addBody(id, body, opts) {
			World.add(world, body);
			const entry: { body: MatterModule.Body; spring?: MatterModule.Constraint } = { body };
			if (opts?.spring) {
				const spring = Constraint.create({
					bodyA: body,
					pointB: { x: opts.spring.x, y: opts.spring.y },
					stiffness: opts.spring.stiffness ?? 0.015,
					damping: opts.spring.damping ?? 0.1,
					length: 0,
					render: { visible: false }
				});
				World.add(world, spring);
				entry.spring = spring;
			}
			bodies.set(id, entry);
		},
		removeBody(id) {
			const entry = bodies.get(id);
			if (entry) {
				World.remove(world, entry.body);
				if (entry.spring) World.remove(world, entry.spring);
				bodies.delete(id);
			}
		},
		getBodies: () => bodies,
		getMousePosition: () => mousePos
	};

	setContext(PHYSICS_KEY, ctx);

	onMount(() => {
		const w = window.innerWidth;
		const h = window.innerHeight;

		// Screen edge walls (invisible, thick)
		const wallThickness = 60;
		const walls = [
			Bodies.rectangle(w / 2, -wallThickness / 2, w + 200, wallThickness, { isStatic: true }),
			Bodies.rectangle(w / 2, h + wallThickness / 2, w + 200, wallThickness, { isStatic: true }),
			Bodies.rectangle(-wallThickness / 2, h / 2, wallThickness, h + 200, { isStatic: true }),
			Bodies.rectangle(w + wallThickness / 2, h / 2, wallThickness, h + 200, { isStatic: true })
		];
		World.add(world, walls);

		// Mouse constraint
		const mouse = Mouse.create(container);
		const mouseConstraint = MouseConstraint.create(engine, {
			mouse,
			constraint: { stiffness: 0.2, render: { visible: false } }
		});
		// Prevent mouse scroll from interfering
		mouse.element.removeEventListener('wheel', (mouse as any).mousewheel);
		World.add(world, mouseConstraint);

		// Track mouse position
		Events.on(mouseConstraint, 'mousemove', (e: any) => {
			mousePos = { x: e.mouse.position.x, y: e.mouse.position.y };
		});

		// Create floating DOM debris particles
		const debrisData: DomDebris[] = [];
		for (let i = 0; i < 30; i++) {
			const size = Math.random() * 8 + 3;
			const x = Math.random() * w;
			const y = Math.random() * h;
			const isCircle = Math.random() > 0.4;
			const body = isCircle
				? Bodies.circle(x, y, size / 2, {
						frictionAir: 0.002,
						restitution: 0.8,
						mass: 0.1,
						label: `debris-${i}`
					})
				: Bodies.polygon(x, y, Math.floor(Math.random() * 3) + 3, size, {
						frictionAir: 0.002,
						restitution: 0.8,
						mass: 0.1,
						label: `debris-${i}`
					});
			// Give initial random velocity
			MatterModule.Body.setVelocity(body, {
				x: (Math.random() - 0.5) * 1.5,
				y: (Math.random() - 0.5) * 1.5
			});
			World.add(world, body);
			const hue = [270, 220, 45, 350][Math.floor(Math.random() * 4)];
			const el = document.createElement('div');
			el.className = 'physics-debris';
			el.style.cssText = `
				position: fixed;
				width: ${size}px;
				height: ${size}px;
				background: hsla(${hue}, 70%, 55%, 0.35);
				border: 1px solid hsla(${hue}, 80%, 60%, 0.25);
				border-radius: ${isCircle ? '50%' : '2px'};
				pointer-events: none;
				z-index: 1;
				box-shadow: 0 0 ${size * 2}px hsla(${hue}, 80%, 50%, 0.15);
			`;
			container.appendChild(el);
			debrisData.push({ body, el, hue, size });
		}
		domDebris = debrisData;

		// Physics update loop
		let animId: number;
		const tick = () => {
			animId = requestAnimationFrame(tick);
			Engine.update(engine, 1000 / 60);

			// Update DOM debris positions
			for (const d of domDebris) {
				const { x, y } = d.body.position;
				const angle = d.body.angle;
				d.el.style.transform = `translate(${x - d.size / 2}px, ${y - d.size / 2}px) rotate(${angle}rad)`;
			}
		};
		tick();

		return () => {
			cancelAnimationFrame(animId);
			World.clear(world, false);
			Engine.clear(engine);
			for (const d of domDebris) {
				d.el.remove();
			}
		};
	});
</script>

<div bind:this={container} id="physics-world" style="position:fixed;inset:0;z-index:1;overflow:hidden;">
	{@render children()}
</div>
