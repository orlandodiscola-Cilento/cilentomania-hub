(function (global) {
  'use strict';

  class Cileo {
    constructor(options = {}) {
      const script = document.currentScript || [...document.scripts].find(item => /(?:^|\/)cileo\.js(?:\?|$)/.test(item.src));
      this.baseUrl = options.baseUrl || new URL('../', script?.src || document.baseURI);
      this.demo = new global.CileoDemoProvider(new URL('data/cileo-demo.json', this.baseUrl));
      this.ui = new global.CileoUI({
        onOpen: () => this.animation.play([{ state: 'welcome', duration: 1000 }, { state: 'idea', duration: 1200 }]),
        onClose: () => this.animation.play([{ state: 'goodbye', duration: 1500 }, { state: 'welcome', duration: 2000 }]),
        onAction: action => this.handleAction(action),
        onMessage: message => this.handleMessage(message)
      });
      this.animation = new global.CileoAnimation(this.ui.elements.avatar, {
        assetBase: new URL('assets/cileo/avatar/', this.baseUrl)
      });
      this.started = false;
    }

    async init() {
      this.animation.setCileoState('welcome', { minDuration: 2000 });
      try {
        const data = await this.demo.load();
        this.ui.setActions(data.actions || []);
        this.ui.addMessage(data.welcome, 'assistant');
      } catch (error) {
        console.error('Cileo:', error);
        this.ui.addMessage('In questo momento non riesco a mostrarti i miei consigli. Torna presto: il Cilento ha ancora tanto da raccontare.', 'assistant');
      }
      this.ui.root.classList.add('is-ready');
      this.started = true;
      document.dispatchEvent(new CustomEvent('cileo:ready', { detail: { instance: this } }));
      return this;
    }

    async handleAction(action) {
      if (!action) return;
      this.ui.addMessage(action.label, 'user');
      await this.respond(action.query || action.label, action.id);
    }

    async handleMessage(message) {
      this.ui.addMessage(message, 'user');
      await this.respond(message);
    }

    async respond(message, actionId) {
      this.animation.play([{ state: 'thinking', duration: 900 }, { state: 'searching', duration: 900 }]);
      const stopTyping = this.ui.showTyping();
      try {
        const [response] = await Promise.all([
          this.demo.reply(message, actionId),
          new Promise(resolve => window.setTimeout(resolve, 2200))
        ]);
        stopTyping();
        this.ui.addMessage(response.text, 'assistant');
        this.ui.setActions(response.actions || this.demo.getActions());
        const positive = /\b(?:grazie|perfetto|perfetta|bellissimo|bellissima)\b/i.test(message);
        const contextualState = positive ? 'hug' : response.pose;
        const sequence = [{ state: contextualState, duration: 1300 }];
        if (!positive && response.actions?.length && contextualState !== 'pointing') {
          sequence.push({ state: 'pointing', duration: 1200 });
        }
        sequence.push({ state: 'success', duration: 1200 }, { state: contextualState, duration: 1600 });
        this.animation.play(sequence);
      } catch (error) {
        stopTyping();
        this.ui.addMessage('Questo consiglio per ora mi sfugge. Possiamo continuare esplorando luoghi, eventi e itinerari del Cilento.', 'assistant');
        this.animation.setCileoState('thinking', { duration: 1400, nextState: 'welcome' });
      }
    }

    setCileoState(state, options) {
      return this.animation.setCileoState(state, options);
    }

    testPoses() {
      const poses = [
        'welcome', 'thinking', 'searching', 'map', 'idea', 'pointing', 'success', 'hug', 'goodbye'
      ].map(state => ({ state, duration: 1200 }));
      poses.push({ state: 'welcome', duration: 2000 });
      return this.animation.play(poses);
    }
  }

  global.Cileo = Cileo;
  const start = () => {
    if (global.cileo) return;
    const instance = new Cileo();
    global.cileo = instance;
    instance.init().catch(error => console.error('Errore di inizializzazione Cileo:', error));
    const isDevelopment = /^(?:localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:' || new URLSearchParams(location.search).has('cileoDebug');
    if (isDevelopment) global.testCileoPoses = () => instance.testPoses();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})(window);
