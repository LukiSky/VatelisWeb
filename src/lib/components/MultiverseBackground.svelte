<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';

	let canvas: HTMLCanvasElement;
	let mouseX = $state(0);
	let mouseY = $state(0);

	onMount(() => {
		const w = window.innerWidth;
		const h = window.innerHeight;

		// Scene
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 2000);
		camera.position.z = 500;

		const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
		renderer.setSize(w, h);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.setClearColor(0x000000, 1);

		// ── Star field ──
		const starCount = 1500;
		const starGeo = new THREE.BufferGeometry();
		const starPos = new Float32Array(starCount * 3);
		const starSizes = new Float32Array(starCount);
		for (let i = 0; i < starCount; i++) {
			starPos[i * 3] = (Math.random() - 0.5) * 2000;
			starPos[i * 3 + 1] = (Math.random() - 0.5) * 1500;
			starPos[i * 3 + 2] = (Math.random() - 0.5) * 1000;
			starSizes[i] = Math.random() * 1.5 + 0.3;
		}
		starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
		starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
		const starMat = new THREE.PointsMaterial({
			color: 0xffffff,
			size: 1,
			transparent: true,
			opacity: 0.5,
			sizeAttenuation: true
		});
		scene.add(new THREE.Points(starGeo, starMat));

		// ── Geometric debris (floating shards) ──
		type Debris = { mesh: THREE.Mesh; vel: THREE.Vector3; rotSpeed: THREE.Vector3 };
		const debris: Debris[] = [];
		const geos = [
			new THREE.IcosahedronGeometry(4, 0),
			new THREE.TetrahedronGeometry(5, 0),
			new THREE.OctahedronGeometry(3.5, 0),
			new THREE.BoxGeometry(8, 0.4, 6)
		];
		const colors = [0x8A2BE2, 0x3B5A9D, 0xB53B44, 0x6a1b9a];

		for (let i = 0; i < 45; i++) {
			const gi = Math.floor(Math.random() * geos.length);
			const isGlass = gi === 3;
			const mat = new THREE.MeshBasicMaterial({
				color: colors[gi],
				wireframe: !isGlass,
				transparent: true,
				opacity: isGlass ? 0.08 : Math.random() * 0.3 + 0.15,
				side: isGlass ? THREE.DoubleSide : THREE.FrontSide
			});
			const mesh = new THREE.Mesh(geos[gi], mat);
			mesh.position.set(
				(Math.random() - 0.5) * 900,
				(Math.random() - 0.5) * 700,
				(Math.random() - 0.5) * 500 - 100
			);
			mesh.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
			scene.add(mesh);
			debris.push({
				mesh,
				vel: new THREE.Vector3(
					(Math.random() - 0.5) * 0.15,
					(Math.random() - 0.5) * 0.12,
					(Math.random() - 0.5) * 0.05
				),
				rotSpeed: new THREE.Vector3(
					(Math.random() - 0.5) * 0.008,
					(Math.random() - 0.5) * 0.008,
					(Math.random() - 0.5) * 0.004
				)
			});
		}

		// ── Dimensional fracture lines ──
		for (let i = 0; i < 8; i++) {
			const points = [];
			const startX = (Math.random() - 0.5) * 600;
			const startY = (Math.random() - 0.5) * 400;
			const startZ = (Math.random() - 0.5) * 200 - 150;
			for (let j = 0; j < 5; j++) {
				points.push(new THREE.Vector3(
					startX + (Math.random() - 0.5) * 120,
					startY + (Math.random() - 0.5) * 80,
					startZ + (Math.random() - 0.5) * 40
				));
			}
			const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
			const lineMat = new THREE.LineBasicMaterial({
				color: 0x8A2BE2,
				transparent: true,
				opacity: 0.15
			});
			scene.add(new THREE.Line(lineGeo, lineMat));
		}

		// ── Ambient glow spheres ──
		const glowGeo = new THREE.SphereGeometry(2, 8, 8);
		const glowSpheres: THREE.Mesh[] = [];
		for (let i = 0; i < 12; i++) {
			const glowMat = new THREE.MeshBasicMaterial({
				color: i % 2 === 0 ? 0x8A2BE2 : 0xFFD700,
				transparent: true,
				opacity: 0.3
			});
			const sphere = new THREE.Mesh(glowGeo, glowMat);
			sphere.position.set(
				(Math.random() - 0.5) * 700,
				(Math.random() - 0.5) * 500,
				(Math.random() - 0.5) * 300 - 50
			);
			scene.add(sphere);
			glowSpheres.push(sphere);
		}

		// ── Animation loop ──
		let animId: number;
		const clock = new THREE.Clock();

		const animate = () => {
			animId = requestAnimationFrame(animate);
			const t = clock.getElapsedTime();

			// Parallax camera
			const tx = (mouseX / w - 0.5) * 40;
			const ty = (mouseY / h - 0.5) * 25;
			camera.position.x += (tx - camera.position.x) * 0.03;
			camera.position.y += (-ty - camera.position.y) * 0.03;
			camera.lookAt(0, 0, 0);

			// Debris drift
			for (const d of debris) {
				d.mesh.position.add(d.vel);
				d.mesh.rotation.x += d.rotSpeed.x;
				d.mesh.rotation.y += d.rotSpeed.y;
				d.mesh.rotation.z += d.rotSpeed.z;
				// Bounce at bounds
				if (Math.abs(d.mesh.position.x) > 500) d.vel.x *= -1;
				if (Math.abs(d.mesh.position.y) > 400) d.vel.y *= -1;
				if (Math.abs(d.mesh.position.z) > 300) d.vel.z *= -1;
			}

			// Glow pulse
			for (let i = 0; i < glowSpheres.length; i++) {
				const s = glowSpheres[i];
				const mat = s.material as THREE.MeshBasicMaterial;
				mat.opacity = 0.15 + Math.sin(t * 1.5 + i) * 0.15;
				s.scale.setScalar(1 + Math.sin(t * 2 + i * 0.5) * 0.3);
			}

			renderer.render(scene, camera);
		};
		animate();

		// Mouse tracking
		const onMove = (e: MouseEvent) => { mouseX = e.clientX; mouseY = e.clientY; };
		window.addEventListener('mousemove', onMove);

		// Resize
		const onResize = () => {
			const nw = window.innerWidth;
			const nh = window.innerHeight;
			camera.aspect = nw / nh;
			camera.updateProjectionMatrix();
			renderer.setSize(nw, nh);
		};
		window.addEventListener('resize', onResize);

		return () => {
			cancelAnimationFrame(animId);
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('resize', onResize);
			renderer.dispose();
		};
	});
</script>

<canvas bind:this={canvas} id="multiverse-bg"></canvas>

<style>
	canvas {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100vh;
		z-index: 0;
		pointer-events: none;
	}
</style>
