(function (global) {
  'use strict';

  const CILEO_STATES = Object.freeze({
    welcome: { file: 'Avatar_Cileo_Ciao.png', alt: 'Cileo ti dà il benvenuto' },
    thinking: { file: 'Avatar_Cileo_Pensa.png', alt: 'Cileo sta pensando' },
    searching: { file: 'Avatar_Cileo_Cerca.png', alt: 'Cileo sta cercando' },
    map: { file: 'Avatar_Cileo_Cartina.png', alt: 'Cileo consulta la cartina' },
    idea: { file: 'Avatar_Cileo_Idea.png', alt: 'Cileo ha un suggerimento' },
    pointing: { file: 'Avatar_Cileo_Indica.png', alt: 'Cileo indica una direzione' },
    success: { file: 'Avatar_Cileo_Ok.png', alt: 'Cileo ha completato la risposta' },
    goodbye: { file: 'Avatar_Cileo_Arrivederci.png', alt: 'Cileo ti saluta' },
    hug: { file: 'Avatar_Cileo_Abbraccio.png', alt: 'Cileo ti manda un abbraccio' }
  });

  const LEGACY_STATES = Object.freeze({
    saluto: 'welcome', pensa: 'thinking', cerca: 'searching', cartina: 'map',
    indica: 'pointing', ok: 'success', arrivederci: 'goodbye', abbraccio: 'hug'
  });

  class CileoAnimation {
    constructor(image, options) {
      this.image = image;
      this.assetBase = options.assetBase;
      this.current = '';
      this.generation = 0;
      this.timers = new Set();
      this.preload();
    }

    normalizeState(state) {
      return LEGACY_STATES[state] || state;
    }

    preload() {
      Object.values(CILEO_STATES).forEach(({ file }) => {
        const image = new Image();
        image.src = new URL(file, this.assetBase).href;
      });
    }

    schedule(callback, delay) {
      const timer = window.setTimeout(() => {
        this.timers.delete(timer);
        callback();
      }, delay);
      this.timers.add(timer);
      return timer;
    }

    cancelTimers() {
      this.generation += 1;
      this.timers.forEach(timer => window.clearTimeout(timer));
      this.timers.clear();
      this.image.classList.remove('is-changing');
      return this.generation;
    }

    applyState(state, generation) {
      const normalized = this.normalizeState(state);
      const config = CILEO_STATES[normalized];
      if (!config || generation !== this.generation) return false;

      const nextSrc = new URL(config.file, this.assetBase).href;
      if (this.current === normalized && this.image.src === nextSrc) return true;

      this.image.classList.add('is-changing');
      this.schedule(() => {
        if (generation !== this.generation) return;
        this.image.src = nextSrc;
        this.image.alt = config.alt;
        this.image.dataset.state = normalized;
        this.image.dataset.pose = normalized;
        this.current = normalized;
        this.schedule(() => {
          if (generation === this.generation) this.image.classList.remove('is-changing');
        }, 60);
      }, 140);
      return true;
    }

    setCileoState(state, options = {}) {
      const normalized = this.normalizeState(state);
      if (!CILEO_STATES[normalized]) {
        console.warn('Stato Cileo non riconosciuto:', state);
        return false;
      }

      const generation = this.cancelTimers();
      this.applyState(normalized, generation);
      const duration = Math.max(Number(options.duration) || 0, Number(options.minDuration) || 0);
      if (duration && options.nextState) {
        this.schedule(() => {
          if (generation === this.generation) this.setCileoState(options.nextState);
        }, duration + 200);
      }
      return true;
    }

    play(sequence) {
      const steps = sequence
        .map(step => ({ state: this.normalizeState(step.state || step.pose), duration: Math.max(650, Number(step.duration) || 900) }))
        .filter(step => CILEO_STATES[step.state]);
      if (!steps.length) return false;

      const generation = this.cancelTimers();
      const advance = index => {
        if (generation !== this.generation || !steps[index]) return;
        this.applyState(steps[index].state, generation);
        if (steps[index + 1]) this.schedule(() => advance(index + 1), steps[index].duration + 200);
      };
      advance(0);
      return true;
    }

    setPose(pose, duration) {
      return this.setCileoState(pose, duration ? { duration, nextState: 'welcome' } : {});
    }

    destroy() {
      this.cancelTimers();
    }
  }

  global.CileoAnimation = CileoAnimation;
  global.CILEO_STATES = CILEO_STATES;
  global.CILEO_POSES = Object.freeze(Object.keys(CILEO_STATES));
})(window);
