(function (global) {
  'use strict';

  const CILEO_STATES = Object.freeze({
    welcome: { file: 'Avatar_Cileo_Ciao.png', alt: 'Velio ti dà il benvenuto' },
    thinking: { file: 'Avatar_Cileo_Pensa.png', alt: 'Velio sta pensando' },
    searching: { file: 'Avatar_Cileo_Cerca.png', alt: 'Velio sta cercando' },
    map: { file: 'Avatar_Cileo_Cartina.png', alt: 'Velio consulta la cartina' },
    idea: { file: 'Avatar_Cileo_Idea.png', alt: 'Velio ha un suggerimento' },
    pointing: { file: 'Avatar_Cileo_Indica.png', alt: 'Velio indica una direzione' },
    success: { file: 'Avatar_Cileo_Ok.png', alt: 'Velio ha completato la risposta' },
    goodbye: { file: 'Avatar_Cileo_Arrivederci.png', alt: 'Velio ti saluta' },
    hug: { file: 'Avatar_Cileo_Abbraccio.png', alt: 'Velio ti manda un abbraccio' }
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
      this.hitAreas = new Map();
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
        const applyImage = () => {
          if (generation !== this.generation) return;
          this.updateHitArea(config.file);
        };
        this.image.addEventListener('load', applyImage, { once: true });
        this.image.src = nextSrc;
        this.image.alt = config.alt;
        this.image.dataset.state = normalized;
        this.image.dataset.pose = normalized;
        this.current = normalized;
        if (this.image.complete && this.image.naturalWidth) applyImage();
        this.schedule(() => {
          if (generation === this.generation) this.image.classList.remove('is-changing');
        }, 60);
      }, 140);
      return true;
    }

    updateHitArea(file) {
      const launcher = this.image.closest('.cileo')?.querySelector('[data-cileo-launcher]');
      if (!launcher || !this.image.naturalWidth || !this.image.naturalHeight) return;
      if (this.hitAreas.has(file)) {
        launcher.style.clipPath = this.hitAreas.get(file);
        return;
      }

      try {
        const canvas = document.createElement('canvas');
        const width = this.image.naturalWidth;
        const height = this.image.naturalHeight;
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(this.image, 0, 0);
        const pixels = context.getImageData(0, 0, width, height).data;
        const rows = [];
        const step = Math.max(1, Math.floor(height / 28));

        for (let y = 0; y < height; y += step) {
          let left = width;
          let right = -1;
          const end = Math.min(height, y + step);
          for (let scanY = y; scanY < end; scanY += 1) {
            for (let x = 0; x < width; x += 1) {
              if (pixels[(scanY * width + x) * 4 + 3] > 12) {
                left = Math.min(left, x);
                right = Math.max(right, x);
              }
            }
          }
          if (right >= left) rows.push({ y: (y + end - 1) / 2, left, right });
        }
        if (!rows.length) return;

        const boxWidth = launcher.clientWidth;
        const boxHeight = launcher.clientHeight;
        const scale = Math.min(boxWidth / width, boxHeight / height);
        const offsetX = (boxWidth - width * scale) / 2;
        const offsetY = boxHeight - height * scale;
        const point = (x, y) => `${((offsetX + x * scale) / boxWidth * 100).toFixed(2)}% ${((offsetY + y * scale) / boxHeight * 100).toFixed(2)}%`;
        const padding = 3 / scale;
        const rightEdge = rows.map(row => point(Math.min(width, row.right + padding), row.y));
        const leftEdge = rows.slice().reverse().map(row => point(Math.max(0, row.left - padding), row.y));
        const clipPath = `polygon(${rightEdge.concat(leftEdge).join(',')})`;
        this.hitAreas.set(file, clipPath);
        launcher.style.clipPath = clipPath;
      } catch (error) {
        console.warn('Cileo: area interattiva dell\'avatar non disponibile.', error);
      }
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
