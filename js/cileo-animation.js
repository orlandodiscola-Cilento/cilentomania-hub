(function (global) {
  'use strict';

  const DEFAULT_AVATAR_VISUAL = Object.freeze({ scale: 1, x: '0%', y: '0%' });
  const MACHINE_STATES = Object.freeze({
    GREETING: 'GREETING',
    SLEEPING: 'SLEEPING',
    THINKING: 'THINKING',
    TOPIC: 'TOPIC',
    COMPLETE: 'COMPLETE',
    ERROR: 'ERROR'
  });
  const CHAT_TOPIC_STATES = Object.freeze([
    'chef',
    'concierge',
    'guida',
    'escursionista',
    'marinaio',
    'bagnino',
    'archeologo',
    'agricoltore',
    'eventi'
  ]);
  const NORMALIZATION_REFERENCE_STATES = Object.freeze([
    'ciao',
    'penso',
    'indico',
    'ok',
    'ascolto',
    'benvenuto'
  ]);
  const MACHINE_STATE_TO_AVATAR = Object.freeze({
    [MACHINE_STATES.GREETING]: 'ciao',
    [MACHINE_STATES.SLEEPING]: 'dormo',
    [MACHINE_STATES.THINKING]: 'penso',
    [MACHINE_STATES.COMPLETE]: 'indico',
    [MACHINE_STATES.ERROR]: 'penso'
  });

  const normalizeVisualTransform = visual => {
    const scale = Number(visual?.scale);
    const xRaw = visual?.x;
    const yRaw = visual?.y;
    const toPercent = value => {
      if (typeof value === 'number' && Number.isFinite(value)) return `${value}%`;
      if (typeof value === 'string' && value.trim()) return value.trim();
      return '0%';
    };
    return Object.freeze({
      scale: Number.isFinite(scale) ? scale : 1,
      x: toPercent(xRaw),
      y: toPercent(yRaw)
    });
  };

  const avatarEntry = (file, fallbackFile, alt, visual) => Object.freeze({
    file,
    fallbackFile,
    alt,
    visual: normalizeVisualTransform(visual || DEFAULT_AVATAR_VISUAL)
  });

  const CILEO_AVATAR_REGISTRY = Object.freeze({
    welcome: avatarEntry('cilentino-ciao.png', 'Avatar_Cileo_Ciao.png', 'Cilentino ti da il benvenuto'),
    thinking: avatarEntry('cilentino-penso.png', 'Avatar_Cileo_Pensa.png', 'Cilentino sta pensando'),
    searching: avatarEntry('cilentino-cerco.png', 'Avatar_Cileo_Cerca.png', 'Cilentino sta cercando'),
    map: avatarEntry('cilentino-cartina.png', 'Avatar_Cileo_Cartina.png', 'Cilentino consulta la cartina'),
    idea: avatarEntry('cilentino-ho-un-idea.png', 'Avatar_Cileo_Idea.png', 'Cilentino ha un suggerimento'),
    pointing: avatarEntry('cilentino-indico.png', 'Avatar_Cileo_Indica.png', 'Cilentino indica una direzione'),
    success: avatarEntry('cilentino-ok.png', 'Avatar_Cileo_Ok.png', 'Cilentino ha completato la risposta'),
    goodbye: avatarEntry('cilentino-arrivederci.png', 'Avatar_Cileo_Arrivederci.png', 'Cilentino ti saluta'),
    hug: avatarEntry('cilentino-abbraccio.png', 'Avatar_Cileo_Abbraccio.png', 'Cilentino ti manda un abbraccio'),

    ciao: avatarEntry('cilentino-ciao.png', 'Avatar_Cileo_Ciao.png', 'Cilentino ti saluta'),
    benvenuto: avatarEntry('cilentino-benvenuto.png', 'Avatar_Cileo_Ciao.png', 'Cilentino ti da il benvenuto'),
    ascolto: avatarEntry('cilentino-ascolto.png', 'Avatar_Cileo_Pensa.png', 'Cilentino ti ascolta con attenzione'),
    penso: avatarEntry('cilentino-penso.png', 'Avatar_Cileo_Pensa.png', 'Cilentino riflette sulla tua richiesta'),
    cerco: avatarEntry('cilentino-cerco.png', 'Avatar_Cileo_Cerca.png', 'Cilentino sta cercando la risposta migliore'),
    cartina: avatarEntry('cilentino-cartina.png', 'Avatar_Cileo_Cartina.png', 'Cilentino consulta una cartina'),
    'ho-un-idea': avatarEntry('cilentino-ho-un-idea.png', 'Avatar_Cileo_Idea.png', 'Cilentino ha una nuova idea'),
    indico: avatarEntry('cilentino-indico.png', 'Avatar_Cileo_Indica.png', 'Cilentino ti indica dove andare'),
    ok: avatarEntry('cilentino-ok.png', 'Avatar_Cileo_Ok.png', 'Cilentino conferma la soluzione'),
    arrivederci: avatarEntry('cilentino-arrivederci.png', 'Avatar_Cileo_Arrivederci.png', 'Cilentino ti augura arrivederci'),
    abbraccio: avatarEntry('cilentino-abbraccio.png', 'Avatar_Cileo_Abbraccio.png', 'Cilentino ti manda un abbraccio'),
    dormo: avatarEntry('cilentino-dormo.png', 'Avatar_Cileo_Pensa.png', 'Cilentino pensa a dove dormire'),
    eventi: avatarEntry('cilentino-eventi.png', 'Avatar_Cileo_Idea.png', 'Cilentino segnala eventi in programma'),
    festeggio: avatarEntry('cilentino-festeggio.png', 'Avatar_Cileo_Ok.png', 'Cilentino festeggia con te'),
    foto: avatarEntry('cilentino-foto.png', 'Avatar_Cileo_Idea.png', 'Cilentino propone contenuti fotografici'),
    geolocalizzo: avatarEntry('cilentino-geolocalizzo.png', 'Avatar_Cileo_Cerca.png', 'Cilentino cerca vicino alla tua posizione'),
    letgo: avatarEntry('cilentino-letgo.png', 'Avatar_Cileo_Indica.png', 'Cilentino ti invita a partire'),
    navigo: avatarEntry('cilentino-navigo.png', 'Avatar_Cileo_Cartina.png', 'Cilentino prepara la navigazione'),

    chef: avatarEntry('cilentino-chef.png', 'Avatar_Cileo_Indica.png', 'Cilentino Chef per consigli enogastronomici', { scale: 1.064, x: '+1.12%', y: '+2.79%' }),
    concierge: avatarEntry('cilentino-concierge.png', 'Avatar_Cileo_Indica.png', 'Cilentino Concierge per servizi e ospitalita', { scale: 1.099, x: '-3.43%', y: '+1.99%' }),
    guida: avatarEntry('cilentino-guida.png', 'Avatar_Cileo_Cartina.png', 'Cilentino Guida per esplorare il territorio', { scale: 1.017, x: '+2.07%', y: '+0.96%' }),
    escursionista: avatarEntry('cilentino-escursionista.png', 'Avatar_Cileo_Cerca.png', 'Cilentino Escursionista per natura e outdoor', { scale: 1.162, x: '-2.07%', y: '+4.94%' }),
    marinaio: avatarEntry('cilentino-marinaio.png', 'Avatar_Cileo_Cartina.png', 'Cilentino Marinaio per costa e mare', { scale: 1.131, x: '-0.80%', y: '+2.47%' }),
    bagnino: avatarEntry('cilentino-bagnino.png', 'Avatar_Cileo_Ciao.png', 'Cilentino Bagnino per spiagge e balneazione', { scale: 1.173, x: '-3.11%', y: '+1.44%' }),
    archeologo: avatarEntry('cilentino-archeologo.png', 'Avatar_Cileo_Idea.png', 'Cilentino Archeologo per storia e cultura', { scale: 1.131, x: '-0.24%', y: '+3.27%' }),
    agricoltore: avatarEntry('cilentino-agricoltore.png', 'Avatar_Cileo_Idea.png', 'Cilentino Agricoltore per ruralita e produzioni locali', { scale: 1.063, x: '-4.47%', y: '+0.24%' })
  });

  const LEGACY_STATES = Object.freeze({
    saluto: 'welcome',
    pensa: 'thinking',
    cerca: 'searching',
    cartina: 'map',
    idea: 'idea',
    indica: 'pointing',
    ok: 'success',
    arrivederci: 'goodbye',
    abbraccio: 'hug'
  });

  const DEFAULT_STATE = 'welcome';

  class CileoAnimation {
    constructor(image, options) {
      this.image = image;
      this.assetBase = options.assetBase;
      this.current = '';
      this.currentMachineState = '';
      this.generation = 0;
      this.renderToken = 0;
      this.timers = new Set();
      this.hitAreas = new Map();
      this.metricCache = new Map();
      this.visualCache = new Map();
      this.referenceMetrics = null;
      this.normalizationPromise = this.prepareNormalizationCache();
    }

    normalizeState(state) {
      const normalized = LEGACY_STATES[state] || String(state || '').trim().toLocaleLowerCase('it-IT');
      if (normalized && CILEO_AVATAR_REGISTRY[normalized]) return normalized;
      return DEFAULT_STATE;
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

    normalizeMachineState(machineState) {
      const normalized = String(machineState || '').trim().toUpperCase();
      return MACHINE_STATES[normalized] || MACHINE_STATES.GREETING;
    }

    resolveTopicState(topicState) {
      const normalized = this.normalizeState(topicState);
      return CHAT_TOPIC_STATES.includes(normalized) ? normalized : 'guida';
    }

    getAvatarStateForMachineState(machineState, options = {}) {
      if (machineState === MACHINE_STATES.TOPIC) return this.resolveTopicState(options.topicState);
      return MACHINE_STATE_TO_AVATAR[machineState] || 'ciao';
    }

    setMachineAnimationClass(machineState) {
      const visualRoot = this.image.closest('.cileo__avatar-visual');
      if (!visualRoot) return;
      Array.from(visualRoot.classList)
        .filter(className => className.indexOf('is-machine-') === 0)
        .forEach(className => visualRoot.classList.remove(className));
      visualRoot.classList.add(`is-machine-${String(machineState || '').toLowerCase()}`);
    }

    applyVisualTransform(visual) {
      const transform = normalizeVisualTransform(visual || DEFAULT_AVATAR_VISUAL);
      this.image.style.setProperty('--cileo-avatar-scale', String(transform.scale));
      this.image.style.setProperty('--cileo-avatar-x', transform.x);
      this.image.style.setProperty('--cileo-avatar-y', transform.y);
    }

    async prepareNormalizationCache() {
      const states = Array.from(new Set([...NORMALIZATION_REFERENCE_STATES, ...CHAT_TOPIC_STATES, 'dormo']));
      await Promise.all(states.map(state => this.ensureMetrics(state)));
      this.referenceMetrics = this.buildReferenceMetrics();
      states.forEach(state => {
        const metrics = this.metricCache.get(state);
        if (metrics) this.visualCache.set(state, this.calculateNormalizedVisual(state, metrics));
      });
    }

    async ensureMetrics(state) {
      const normalized = this.normalizeState(state);
      if (this.metricCache.has(normalized)) return this.metricCache.get(normalized);
      const config = CILEO_AVATAR_REGISTRY[normalized];
      if (!config) return null;

      try {
        const image = await this.loadImageMetricsSource(config.file, config.fallbackFile);
        const metrics = this.measureAlphaMetrics(image);
        this.metricCache.set(normalized, metrics);
        return metrics;
      } catch (error) {
        return null;
      }
    }

    loadImageMetricsSource(file, fallbackFile) {
      const load = src => new Promise((resolve, reject) => {
        const probe = new Image();
        probe.decoding = 'async';
        probe.onload = () => resolve(probe);
        probe.onerror = () => reject(new Error(`image-load:${src}`));
        probe.src = new URL(src, this.assetBase).href;
      });

      return load(file).catch(error => {
        if (!fallbackFile) throw error;
        return load(fallbackFile);
      });
    }

    measureAlphaMetrics(image) {
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0, width, height);
      const pixels = context.getImageData(0, 0, width, height).data;
      const alphaThreshold = 12;
      const rowCoverage = new Array(height).fill(0);
      const colCoverage = new Array(width).fill(0);
      let left = width;
      let right = -1;
      let top = height;
      let bottom = -1;

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          if (pixels[(y * width + x) * 4 + 3] <= alphaThreshold) continue;
          rowCoverage[y] += 1;
          colCoverage[x] += 1;
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      }

      if (right < left || bottom < top) {
        return {
          width,
          height,
          full: { left: 0, right: width - 1, top: 0, bottom: height - 1, width, height },
          core: { left: 0, right: width - 1, top: 0, bottom: height - 1, width, height },
          centerX: width / 2,
          baseY: height - 1
        };
      }

      const maxRowCoverage = Math.max(...rowCoverage);
      const maxColCoverage = Math.max(...colCoverage);
      const coreRowThreshold = Math.max(6, Math.round(maxRowCoverage * 0.12));
      const coreColThreshold = Math.max(6, Math.round(maxColCoverage * 0.12));
      const coreTop = rowCoverage.findIndex(value => value >= coreRowThreshold);
      const coreBottom = height - 1 - rowCoverage.slice().reverse().findIndex(value => value >= coreRowThreshold);
      const coreLeft = colCoverage.findIndex(value => value >= coreColThreshold);
      const coreRight = width - 1 - colCoverage.slice().reverse().findIndex(value => value >= coreColThreshold);

      return {
        width,
        height,
        full: {
          left,
          right,
          top,
          bottom,
          width: right - left + 1,
          height: bottom - top + 1
        },
        core: {
          left: coreLeft,
          right: coreRight,
          top: coreTop,
          bottom: coreBottom,
          width: coreRight - coreLeft + 1,
          height: coreBottom - coreTop + 1
        },
        centerX: (coreLeft + coreRight) / 2,
        baseY: bottom
      };
    }

    buildReferenceMetrics() {
      const referenceEntries = NORMALIZATION_REFERENCE_STATES
        .map(state => this.metricCache.get(state))
        .filter(Boolean);
      if (!referenceEntries.length) return null;
      const median = values => {
        const ordered = values.slice().sort((leftValue, rightValue) => leftValue - rightValue);
        const middle = Math.floor(ordered.length / 2);
        return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
      };
      return Object.freeze({
        coreHeight: median(referenceEntries.map(entry => entry.core.height)),
        coreWidth: median(referenceEntries.map(entry => entry.core.width)),
        centerX: median(referenceEntries.map(entry => entry.centerX)),
        baseY: median(referenceEntries.map(entry => entry.baseY))
      });
    }

    calculateNormalizedVisual(state, metrics) {
      if (!metrics || !this.referenceMetrics) return DEFAULT_AVATAR_VISUAL;

      if (state === 'dormo') {
        const widthScale = this.referenceMetrics.coreWidth / Math.max(metrics.full.width, 1);
        const scale = Math.max(0.82, Math.min(1.02, widthScale * 1.9));
        const x = `${(((this.referenceMetrics.centerX - metrics.centerX) / metrics.width) * 100).toFixed(2)}%`;
        const y = `${((((this.referenceMetrics.baseY - metrics.baseY) / metrics.height) * 100) + 8).toFixed(2)}%`;
        return normalizeVisualTransform({ scale, x, y });
      }

      const heightScale = this.referenceMetrics.coreHeight / Math.max(metrics.core.height, 1);
      const widthScale = this.referenceMetrics.coreWidth / Math.max(metrics.core.width, 1);
      const scale = Math.max(0.9, Math.min(1.18, (heightScale * 0.72) + (widthScale * 0.28)));
      const x = `${(((this.referenceMetrics.centerX - metrics.centerX) / metrics.width) * 100).toFixed(2)}%`;
      const y = `${(((this.referenceMetrics.baseY - metrics.baseY) / metrics.height) * 100).toFixed(2)}%`;
      return normalizeVisualTransform({ scale, x, y });
    }

    getResolvedVisualTransform(state) {
      const normalized = this.normalizeState(state);
      return this.visualCache.get(normalized) || DEFAULT_AVATAR_VISUAL;
    }

    applyRenderedState(avatarState, machineState, generation, renderToken) {
      const normalized = this.normalizeState(avatarState);
      const config = CILEO_AVATAR_REGISTRY[normalized];
      if (!config || generation !== this.generation || renderToken !== this.renderToken) return false;

      const nextSrc = new URL(config.file, this.assetBase).href;
      this.setMachineAnimationClass(machineState);
      this.applyVisualTransform(DEFAULT_AVATAR_VISUAL);
      this.image.classList.add('is-changing');

      const applyLoadedState = () => {
        if (generation !== this.generation || renderToken !== this.renderToken) return;
        this.applyVisualTransform(this.getResolvedVisualTransform(normalized));
        this.updateHitArea(config.file);
        this.image.classList.remove('is-changing');
      };

      this.image.addEventListener('load', applyLoadedState, { once: true });
      this.image.addEventListener('error', () => {
        if (generation !== this.generation || renderToken !== this.renderToken || !config.fallbackFile) return;
        const fallbackSrc = new URL(config.fallbackFile, this.assetBase).href;
        if (this.image.src === fallbackSrc) return;
        this.image.src = fallbackSrc;
      }, { once: true });
      this.image.src = nextSrc;
      this.image.alt = config.alt;
      this.image.dataset.state = normalized;
      this.image.dataset.pose = normalized;
      this.image.dataset.machineState = machineState;
      this.current = normalized;
      this.currentMachineState = machineState;

      if (this.image.complete && this.image.naturalWidth) applyLoadedState();
      this.normalizationPromise
        .then(() => {
          if (generation !== this.generation || renderToken !== this.renderToken || this.current !== normalized) return;
          this.applyVisualTransform(this.getResolvedVisualTransform(normalized));
        })
        .catch(() => {});
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

    setMachineState(machineState, options = {}) {
      const normalizedMachineState = this.normalizeMachineState(machineState);
      const generation = this.cancelTimers();
      this.renderToken += 1;
      return this.applyRenderedState(this.getAvatarStateForMachineState(normalizedMachineState, options), normalizedMachineState, generation, this.renderToken);
    }

    setCileoState(state, options = {}) {
      const normalized = this.normalizeState(state);
      if (!CILEO_AVATAR_REGISTRY[normalized]) {
        console.warn('Stato Cileo non riconosciuto:', state);
        return false;
      }

      const generation = this.cancelTimers();
      this.renderToken += 1;
      this.applyRenderedState(normalized, options.machineState || this.currentMachineState || MACHINE_STATES.GREETING, generation, this.renderToken);
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
        .filter(step => CILEO_AVATAR_REGISTRY[step.state]);
      if (!steps.length) return false;

      const generation = this.cancelTimers();
      this.renderToken += 1;
      const renderToken = this.renderToken;
      const advance = index => {
        if (generation !== this.generation || !steps[index]) return;
        this.applyRenderedState(steps[index].state, this.currentMachineState || MACHINE_STATES.GREETING, generation, renderToken);
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
  global.CILEO_AVATAR_REGISTRY = CILEO_AVATAR_REGISTRY;
  global.CILEO_MACHINE_STATES = MACHINE_STATES;
  global.CILEO_STATES = CILEO_AVATAR_REGISTRY;
  global.CILEO_POSES = Object.freeze(Object.keys(CILEO_AVATAR_REGISTRY));
})(window);
