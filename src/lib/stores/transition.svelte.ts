/**
 * Transition state store for hyperdrive page navigation effect.
 * Controls the multiversal jump animation phases.
 */

class TransitionStore {
	active = $state(false);
	targetUrl = $state('/');
	phase = $state<'idle' | 'suckin' | 'warp' | 'snapin'>('idle');
	progress = $state(0);

	trigger(url: string) {
		if (this.active) return;
		this.active = true;
		this.targetUrl = url;
		this.phase = 'suckin';
		this.progress = 0;
	}

	setPhase(phase: 'idle' | 'suckin' | 'warp' | 'snapin') {
		this.phase = phase;
	}

	reset() {
		this.active = false;
		this.targetUrl = '/';
		this.phase = 'idle';
		this.progress = 0;
	}
}

export const transitionStore = new TransitionStore();
