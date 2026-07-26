(function (global) {
  'use strict';

  function sanitizeCilentinoContextValue(value) {
    const trimmed = String(value || '').trim();
    return trimmed || null;
  }

  function getCilentinoNavigationContext() {
    const overlay = document.getElementById('overlay');
    const panelContent = document.getElementById('panelContent');
    const context = {
      section: 'home',
      municipalityId: null,
      municipalityName: null,
      module: null,
      recordId: null,
      recordName: null
    };

    if (!overlay || !panelContent || !overlay.classList.contains('open')) return context;

    const detail = panelContent.querySelector('[data-module-detail-root]');
    if (detail) {
      const entityType = detail.getAttribute('data-entity-type');
      context.section = 'detail';
      context.module = entityType === 'restaurant' ? 'eat' : entityType === 'accommodation' ? 'sleep' : null;
      context.recordId = sanitizeCilentinoContextValue(detail.getAttribute('data-entity-id'));
      context.municipalityId = sanitizeCilentinoContextValue(detail.getAttribute('data-comune-id'));
      const detailHeader = detail.querySelector('.module-detail__head h2');
      context.recordName = sanitizeCilentinoContextValue(detailHeader?.textContent);
      const backButton = detail.querySelector('[data-module-back-municipality]');
      context.municipalityName = sanitizeCilentinoContextValue(backButton?.getAttribute('data-module-back-municipality'));
      return context;
    }

    const moduleExperience = panelContent.querySelector('[data-module-experience]');
    if (moduleExperience) {
      const moduleType = moduleExperience.getAttribute('data-module-type');
      context.section = moduleType === 'eat' ? 'eat' : 'sleep';
      context.module = moduleType === 'eat' ? 'eat' : 'sleep';
      context.municipalityId = sanitizeCilentinoContextValue(moduleExperience.getAttribute('data-comune-id'));
      context.municipalityName = sanitizeCilentinoContextValue(moduleExperience.getAttribute('data-municipality-name'));
      return context;
    }

    const municipalitySheet = panelContent.querySelector('.territory-municipality');
    if (municipalitySheet) {
      context.section = 'territory';
      const firstAction = municipalitySheet.querySelector('[data-municipality-action][data-municipality]');
      context.municipalityName = sanitizeCilentinoContextValue(firstAction?.getAttribute('data-municipality'));
      context.municipalityId = sanitizeCilentinoContextValue(firstAction?.getAttribute('data-comune-id'));
      return context;
    }

    const filteredSection = panelContent.querySelector('[data-hub-section][data-municipality-name]');
    if (filteredSection) {
      const section = sanitizeCilentinoContextValue(filteredSection.getAttribute('data-hub-section')) || 'territory';
      context.section = section;
      context.municipalityName = sanitizeCilentinoContextValue(filteredSection.getAttribute('data-municipality-name'));
      return context;
    }

    const hubSection = panelContent.querySelector('[data-hub-section]');
    if (hubSection) {
      const section = sanitizeCilentinoContextValue(hubSection.getAttribute('data-hub-section')) || 'home';
      context.section = section === 'routes' ? 'itineraries' : section;
      const townList = panelContent.querySelector('#townList[data-town-selector-context="home-module"]');
      if (townList) {
        const moduleType = sanitizeCilentinoContextValue(townList.getAttribute('data-module-type'));
        if (moduleType === 'sleep' || moduleType === 'eat') {
          context.section = moduleType;
          context.module = moduleType;
        }
      }
      return context;
    }

    if (panelContent.querySelector('#eventSearch, #eventsGrid')) {
      context.section = 'events';
      return context;
    }
    if (panelContent.querySelector('.infopoint-item, [data-infopoint-toggle], #infopointGeoStatus')) {
      context.section = 'infopoints';
      return context;
    }

    return context;
  }

  function buildContextualSuggestion(id, label, prompt) {
    return { id, label, prompt, action: null, target: null };
  }

  function getCilentinoContextualSuggestions(context) {
    const area = context.municipalityName ? `a ${context.municipalityName}` : 'nel Cilento';
    const areaQuestion = context.municipalityName ? `a ${context.municipalityName}?` : 'nel Cilento?';
    const supportsGeo = Boolean(navigator.geolocation);
    const supportsEventDates = typeof global.activeEvents === 'function' && Array.isArray(global.activeEvents()) && global.activeEvents().some(event => event?.startDate);

    if (context.section === 'detail' && context.module === 'sleep') {
      const name = context.recordName || 'questa struttura';
      return [
        buildContextualSuggestion('detail-sleep-similar', 'Strutture simili', `Mostrami strutture simili a ${name}`),
        buildContextualSuggestion('detail-sleep-eat-near', 'Dove mangiare vicino', `Dove posso mangiare vicino a ${name}?`),
        buildContextualSuggestion('detail-sleep-sights', 'Cosa vedere nei dintorni', `Cosa posso vedere nei dintorni di ${name}?`),
        buildContextualSuggestion('detail-sleep-events', 'Eventi nelle vicinanze', `Quali eventi ci sono vicino a ${name}?`),
        buildContextualSuggestion('detail-sleep-reach', 'Raggiungere la struttura', `Come posso raggiungere ${name}?`)
      ];
    }

    if (context.section === 'detail' && context.module === 'eat') {
      const name = context.recordName || 'questa attività';
      return [
        buildContextualSuggestion('detail-eat-similar', 'Locali simili', `Mostrami locali simili a ${name}`),
        buildContextualSuggestion('detail-eat-sleep-near', 'Dove dormire vicino', `Dove posso dormire vicino a ${name}?`),
        buildContextualSuggestion('detail-eat-sights', 'Cosa vedere nei dintorni', `Cosa posso vedere nei dintorni di ${name}?`),
        buildContextualSuggestion('detail-eat-events', 'Eventi nelle vicinanze', `Quali eventi ci sono vicino a ${name}?`),
        buildContextualSuggestion('detail-eat-reach', 'Raggiungere il locale', `Come posso raggiungere ${name}?`)
      ];
    }

    if (context.section === 'sleep') {
      const requested = [
        ['hotel', 'Hotel', `Mostrami gli hotel ${area}`],
        ['bb', 'B&B', `Mostrami i B&B ${area}`],
        ['case-vacanze', 'Case vacanze', `Mostrami le case vacanze ${area}`],
        ['vicino-mare', 'Vicino al mare', `Cerco una struttura vicino al mare ${area}`],
        ['piscina', 'Con piscina', `Cerco una struttura con piscina ${area}`],
        ['parcheggio', 'Con parcheggio', `Cerco una struttura con parcheggio ${area}`],
        ['pet', 'Pet friendly', `Cerco una struttura che accetta animali ${area}`],
        ['accessibile', 'Accessibile', `Cerco una struttura accessibile ${area}`]
      ];
      return requested.map(([id, label, prompt]) => buildContextualSuggestion(`sleep-${id}`, label, prompt));
    }

    if (context.section === 'eat') {
      const requested = [
        ['cilentana', 'Cucina cilentana', `Dove posso mangiare cucina cilentana ${areaQuestion}`],
        ['pesce', 'Ristoranti di pesce', `Mostrami i ristoranti di pesce ${area}`],
        ['bracerie', 'Bracerie', `Mostrami le bracerie ${area}`],
        ['pizzerie', 'Pizzerie', `Mostrami le pizzerie ${area}`],
        ['vegetariano', 'Vegetariano', `Cerco proposte vegetariane ${area}`],
        ['glutenfree', 'Senza glutine', `Cerco locali con opzioni senza glutine ${area}`],
        ['pranzo', 'Aperto a pranzo', `Quali locali sono aperti a pranzo ${areaQuestion}`],
        ['cena', 'Aperto a cena', `Quali locali sono aperti a cena ${areaQuestion}`]
      ];
      return requested.map(([id, label, prompt]) => buildContextualSuggestion(`eat-${id}`, label, prompt));
    }

    if (context.section === 'events') {
      const suggestions = [];
      if (supportsEventDates) {
        suggestions.push(buildContextualSuggestion('events-today', 'Eventi oggi', `Quali eventi ci sono oggi ${areaQuestion}`));
        suggestions.push(buildContextualSuggestion('events-weekend', 'Eventi nel weekend', `Quali eventi ci sono nel weekend ${areaQuestion}`));
      }
      suggestions.push(buildContextualSuggestion('events-family', 'Eventi per famiglie', `Quali eventi per famiglie ci sono ${areaQuestion}`));
      suggestions.push(buildContextualSuggestion('events-music', 'Musica e spettacoli', `Quali eventi di musica e spettacoli ci sono ${areaQuestion}`));
      suggestions.push(buildContextualSuggestion('events-traditions', 'Sagre e tradizioni', `Quali sagre e tradizioni ci sono ${areaQuestion}`));
      if (supportsGeo) suggestions.push(buildContextualSuggestion('events-nearby', 'Eventi vicino a me', 'Quali eventi ci sono vicino a me nel Cilento?'));
      return suggestions;
    }

    if (context.section === 'experiences') {
      const suggestions = [
        buildContextualSuggestion('exp-sea', 'Mare', `Quali esperienze mare mi consigli ${areaQuestion}`),
        buildContextualSuggestion('exp-nature', 'Natura', `Quali esperienze natura mi consigli ${areaQuestion}`),
        buildContextualSuggestion('exp-food', 'Enogastronomia', `Quali esperienze enogastronomiche ci sono ${areaQuestion}`),
        buildContextualSuggestion('exp-borghi', 'Borghi', `Quali esperienze nei borghi ci sono ${areaQuestion}`),
        buildContextualSuggestion('exp-family', 'Famiglie', `Quali esperienze per famiglie ci sono ${areaQuestion}`)
      ];
      if (supportsGeo) suggestions.push(buildContextualSuggestion('exp-nearby', 'Esperienze vicino a me', 'Quali esperienze ci sono vicino a me nel Cilento?'));
      return suggestions;
    }

    if (context.section === 'itineraries') {
      const suggestions = [
        buildContextualSuggestion('it-walk', 'Itinerari a piedi', `Consigliami itinerari a piedi ${area}`),
        buildContextualSuggestion('it-car', 'Itinerari in auto', `Consigliami itinerari in auto ${area}`),
        buildContextualSuggestion('it-borghi', 'Borghi', `Consigliami itinerari tra i borghi ${area}`),
        buildContextualSuggestion('it-coast', 'Costa', `Consigliami itinerari lungo la costa ${area}`),
        buildContextualSuggestion('it-nature', 'Natura', `Consigliami itinerari natura ${area}`)
      ];
      if (supportsGeo) suggestions.push(buildContextualSuggestion('it-nearby', 'Itinerari vicino a me', 'Consigliami itinerari vicino a me nel Cilento'));
      return suggestions;
    }

    if (context.section === 'infopoints') {
      const suggestions = [
        buildContextualSuggestion('info-nearest', 'Infopoint più vicino', 'Qual è l’Infopoint Cilentomania più vicino?'),
        buildContextualSuggestion('info-hours', 'Orari', `Quali sono gli orari degli Infopoint ${areaQuestion}`),
        buildContextualSuggestion('info-contacts', 'Contatti', `Mostrami i contatti degli Infopoint ${area}`),
        buildContextualSuggestion('info-reach', 'Come raggiungerli', `Come posso raggiungere gli Infopoint ${areaQuestion}`),
        buildContextualSuggestion('info-services', 'Servizi disponibili', `Quali servizi offrono gli Infopoint ${areaQuestion}`)
      ];
      return suggestions;
    }

    if (context.section === 'territory' && context.municipalityName) {
      return [
        buildContextualSuggestion('town-sights', `Cosa vedere a ${context.municipalityName}`, `Cosa posso vedere a ${context.municipalityName}?`),
        buildContextualSuggestion('town-sleep', `Dove dormire a ${context.municipalityName}`, `Dove posso dormire a ${context.municipalityName}?`),
        buildContextualSuggestion('town-eat', `Dove mangiare a ${context.municipalityName}`, `Dove posso mangiare a ${context.municipalityName}?`),
        buildContextualSuggestion('town-events', `Eventi a ${context.municipalityName}`, `Quali eventi ci sono a ${context.municipalityName}?`),
        buildContextualSuggestion('town-experiences', `Esperienze a ${context.municipalityName}`, `Quali esperienze posso vivere a ${context.municipalityName}?`),
        buildContextualSuggestion('town-infopoints', `Infopoint di ${context.municipalityName}`, `Ci sono Infopoint Cilentomania a ${context.municipalityName}?`)
      ];
    }

    return [
      buildContextualSuggestion('home-territory', 'Esplora il territorio', 'Aiutami a esplorare il territorio del Cilento'),
      buildContextualSuggestion('home-events', 'Eventi', 'Quali eventi posso trovare nel Cilento?'),
      buildContextualSuggestion('home-experiences', 'Esperienze', 'Quali esperienze posso vivere nel Cilento?'),
      buildContextualSuggestion('home-sleep', 'Dove dormire', 'Aiutami a trovare dove dormire nel Cilento'),
      buildContextualSuggestion('home-eat', 'Dove mangiare', 'Aiutami a trovare dove mangiare nel Cilento'),
      buildContextualSuggestion('home-infopoints', 'I nostri Infopoint', 'Mostrami gli Infopoint di Cilentomania')
    ];
  }

  class Cileo {
    constructor(options = {}) {
      const script = document.currentScript || [...document.scripts].find(item => /(?:^|\/)cileo\.js(?:\?|$)/.test(item.src));
      this.baseUrl = options.baseUrl || new URL('../', script?.src || document.baseURI);
      this.demo = new global.CileoDemoProvider(new URL('data/cileo-demo.json', this.baseUrl));
      this.ui = new global.CileoUI({
        onOpen: () => this.animation.play([{ state: 'welcome', duration: 1000 }, { state: 'idea', duration: 1200 }]),
        onClose: () => this.animation.play([{ state: 'goodbye', duration: 1500 }, { state: 'welcome', duration: 2000 }]),
        onAction: action => this.handleAction(action),
        onMessage: message => this.handleMessage(message),
        onSuggestionsRequest: () => this.getContextualSuggestions()
      });
      this.animation = new global.CileoAnimation(this.ui.elements.avatar, {
        assetBase: new URL('assets/cileo/avatar/', this.baseUrl)
      });
      this.started = false;
      this.observeNavigationContext();
    }

    getContextualSuggestions() {
      const context = getCilentinoNavigationContext();
      return getCilentinoContextualSuggestions(context);
    }

    observeNavigationContext() {
      const panelContent = document.getElementById('panelContent');
      const overlay = document.getElementById('overlay');
      if (!panelContent || !overlay) return;
      const closeSuggestions = () => {
        if (this.ui?.suggestionState === 'suggestions-open') this.ui.setSuggestionState('conversation');
      };
      const panelObserver = new MutationObserver(closeSuggestions);
      panelObserver.observe(panelContent, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-hub-section', 'data-module-type', 'data-entity-type'] });
      const overlayObserver = new MutationObserver(closeSuggestions);
      overlayObserver.observe(overlay, { attributes: true, attributeFilter: ['class'] });
      this.contextObservers = [panelObserver, overlayObserver];
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
  global.getCilentinoNavigationContext = getCilentinoNavigationContext;
  global.getCilentinoContextualSuggestions = getCilentinoContextualSuggestions;
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
