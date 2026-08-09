(function (global) {
  'use strict';

  const CILEO_STORAGE_KEYS = {
    localState: 'cileo:chat:state:v1',
    sessionState: 'cileo:chat:runtime:v1'
  };

  function t(key, fallback, params) {
    const i18n = global.CilentomaniaI18n;
    return i18n?.t ? i18n.t(key, fallback, params) : fallback;
  }

  function getChatLanguage() {
    const i18n = global.CilentomaniaI18n;
    const language = i18n?.normalizeLanguage
      ? i18n.normalizeLanguage(i18n.getCurrentLanguage?.() || 'it')
      : 'it';
    return language || 'it';
  }

  function getDefaultWelcome() {
    return t('chat.welcome', 'Posso aiutarti a trovare borghi, spiagge, eventi, esperienze, itinerari, ristoranti, strutture ricettive e Infopoint.\n\nDa dove vuoi iniziare?');
  }

  function getDefaultActions() {
    return [
      { id: 'territorio', label: t('chat.actions.territory', 'Esplora il territorio'), query: t('chat.queries.territory', 'Aiutami a esplorare il territorio del Cilento') },
      { id: 'eventi', label: t('chat.actions.events', 'Eventi'), query: t('chat.queries.events', 'Quali eventi posso trovare nel Cilento?') },
      { id: 'esperienze', label: t('chat.actions.experiences', 'Esperienze'), query: t('chat.queries.experiences', 'Quali esperienze posso vivere nel Cilento?') },
      { id: 'mangiare', label: t('chat.actions.eat', 'Dove mangiare'), query: t('chat.queries.eat', 'Aiutami a trovare dove mangiare nel Cilento') },
      { id: 'dormire', label: t('chat.actions.sleep', 'Dove dormire'), query: t('chat.queries.sleep', 'Aiutami a trovare dove dormire nel Cilento') },
      { id: 'itinerari', label: t('chat.actions.itineraries', 'Itinerari'), query: t('chat.queries.itineraries', 'Consigliami un itinerario nel Cilento') },
      { id: 'infopoint', label: t('chat.actions.infopoint', 'Infopoint'), query: t('chat.queries.infopoint', 'Mostrami gli Infopoint di Cilentomania') },
      { id: 'vicino', label: t('chat.actions.nearby', "Cosa c'e vicino a me"), query: t('chat.queries.nearby', "Cosa c'e vicino a me nel Cilento?") }
    ];
  }

  function normalizeForIntentMatch(value) {
    return String(value || '')
      .toLocaleLowerCase('it-IT')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ' ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function includesAny(value, words) {
    return words.some(word => value.includes(word));
  }

  function mapLegacyPose(pose) {
    const legacyMap = {
      welcome: 'ciao',
      thinking: 'penso',
      searching: 'cerco',
      map: 'cartina',
      idea: 'ho-un-idea',
      pointing: 'indico',
      success: 'ok',
      goodbye: 'arrivederci',
      hug: 'abbraccio'
    };
    return legacyMap[String(pose || '').trim()] || null;
  }

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
      this.config = Object.assign({
        apiBaseUrl: '',
        enableDemoFallback: true,
        requestTimeoutMs: 7000
      }, global.CILENTINO_CONFIG || {});
      this.apiClient = global.CilentinoApiClient || null;
      this.demo = new global.CileoDemoProvider(new URL('data/cileo-demo.json', this.baseUrl));
      this.ui = new global.CileoUI({
        onOpen: () => this.handleChatOpen(),
        onClose: () => this.handleChatClose(),
        onLauncherPointerEnter: event => this.handleLauncherPointerEnter(event),
        onLauncherClick: event => this.handleLauncherClick(event),
        onInteraction: source => this.registerInteraction(source),
        onAction: action => this.handleAction(action),
        onMessage: message => this.handleMessage(message),
        onSuggestionsRequest: () => this.getContextualSuggestions(),
        onClearChat: () => this.clearChat()
      });
      this.animation = new global.CileoAnimation(this.ui.elements.avatar, {
        assetBase: new URL('assets/cileo/avatar/', this.baseUrl)
      });
      this.messages = [];
      this.initialWelcome = '';
      this.initialActions = [];
      this.conversationRevision = 0;
      this.turnId = 0;
      this.turnTimers = new Set();
      this.sleepTimer = 0;
      this.wakeBubbleTimer = 0;
      this.stopTyping = null;
      this.requestInFlight = false;
      this.requestPhase = 'idle';
      this.currentTopicAvatar = 'guida';
      this.isSleeping = false;
      this.sleepCycleId = 0;
      this.wakeBubbleCycleId = 0;
      this.started = false;
      this.observeNavigationContext();
    }

    scheduleTurnCallback(turnId, callback, delay) {
      const timer = window.setTimeout(() => {
        this.turnTimers.delete(timer);
        if (turnId !== this.turnId) return;
        callback();
      }, delay);
      this.turnTimers.add(timer);
      return timer;
    }

    clearTurnTimers() {
      this.turnTimers.forEach(timer => window.clearTimeout(timer));
      this.turnTimers.clear();
    }

    clearSleepTimer() {
      if (!this.sleepTimer) return;
      window.clearTimeout(this.sleepTimer);
      this.sleepTimer = 0;
    }

    clearWakeBubbleTimer() {
      if (!this.wakeBubbleTimer) return;
      window.clearTimeout(this.wakeBubbleTimer);
      this.wakeBubbleTimer = 0;
    }

    hideWakeBubble() {
      this.clearWakeBubbleTimer();
      this.ui.hideBubble();
    }

    setAvatarMachineState(machineState, options = {}) {
      return this.animation.setMachineState(machineState, options);
    }

    isChatBusy() {
      return this.requestInFlight || this.requestPhase === 'waiting' || this.requestPhase === 'typing';
    }

    isSleepBlocked() {
      return this.isChatBusy() || this.ui.confirmOpen || document.activeElement === this.ui.elements.input;
    }

    showWakeBubble() {
      if (!this.sleepCycleId || this.wakeBubbleCycleId === this.sleepCycleId) return;
      this.wakeBubbleCycleId = this.sleepCycleId;
      this.ui.showBubble({
        title: t('chat.wakePromptTitle', 'Ciao!'),
        message: t('chat.wakePromptMessage', 'Cosa posso fare per te?')
      });
      this.clearWakeBubbleTimer();
      this.wakeBubbleTimer = window.setTimeout(() => {
        this.wakeBubbleTimer = 0;
        this.ui.hideBubble();
      }, 3000);
    }

    restartSleepTimer() {
      this.clearSleepTimer();
      if (!this.started || this.isSleepBlocked()) return;
      this.sleepTimer = window.setTimeout(() => {
        this.sleepTimer = 0;
        if (this.isSleepBlocked()) {
          this.restartSleepTimer();
          return;
        }
        this.isSleeping = true;
        this.sleepCycleId += 1;
        this.setAvatarMachineState('SLEEPING');
      }, 8000);
    }

    wakeFromSleep(showBubble = true) {
      if (!this.isSleeping || this.isChatBusy()) return false;
      this.isSleeping = false;
      this.setAvatarMachineState('GREETING');
      if (showBubble) this.showWakeBubble();
      this.restartSleepTimer();
      return true;
    }

    registerInteraction(source) {
      if (source === 'submit' || source === 'quick-action') this.hideWakeBubble();
      this.clearSleepTimer();
      if (!this.isChatBusy()) this.restartSleepTimer();
    }

    cancelActiveTurn() {
      this.turnId += 1;
      this.clearTurnTimers();
      this.clearSleepTimer();
      this.hideWakeBubble();
      if (this.stopTyping) {
        this.stopTyping();
        this.stopTyping = null;
      }
      this.animation.cancelTimers();
      return this.turnId;
    }

    handleLauncherPointerEnter(event) {
      if (event?.pointerType && event.pointerType !== 'mouse') return;
      if (this.isChatBusy()) return;
      this.registerInteraction('launcher-pointerenter');
      this.wakeFromSleep(true);
    }

    handleLauncherClick() {
      if (this.isChatBusy()) {
        this.registerInteraction('launcher-click');
        return;
      }
      const woke = this.wakeFromSleep(true);
      if (!woke) this.registerInteraction('launcher-click');
    }

    handleChatOpen() {
      this.registerInteraction('open');
    }

    handleChatClose() {
      this.registerInteraction('close');
    }

    shouldUseGeolocation(message) {
      return /vicino a me|infopoint piu vicino|infopoint più vicino/i.test(String(message || ''));
    }

    selectTopicAvatar(message, intent, context) {
      const normalized = normalizeForIntentMatch(message);
      const section = String(context?.section || '').toLocaleLowerCase('it-IT');
      const intentKey = String(intent || '').toLocaleLowerCase('it-IT');

      if (includesAny(normalized, ['ristor', 'mang', 'cena', 'pranzo', 'pizzeria', 'trattoria', 'cucina', 'menu'])) return 'chef';
      if (includesAny(normalized, ['hotel', 'bb', 'b b', 'alloggio', 'camera', 'struttura ricettiva', 'dormire', 'infopoint', 'contatti utili'])) return 'concierge';
      if (includesAny(normalized, ['trek', 'sentier', 'escurs', 'cammin', 'hiking', 'natura', 'bosco', 'montagna', 'outdoor'])) return 'escursionista';
      if (includesAny(normalized, ['muse', 'archeolog', 'templ', 'rovine', 'storia antica', 'sito storico'])) return 'archeologo';
      if (includesAny(normalized, ['agri', 'olio', 'vino', 'cantina', 'fattoria', 'rurale', 'prodotti tipici', 'caseificio'])) return 'agricoltore';
      if (includesAny(normalized, ['event', 'sagra', 'festival', 'concerto'])) return 'eventi';

      if (includesAny(normalized, ['spiaggia', 'spiagge', 'balne', 'lido', 'ombrellone'])) return 'bagnino';
      if (includesAny(normalized, ['mare', 'porto', 'barca', 'barche', 'vela', 'navig', 'traversata', 'costa'])) return 'marinaio';

      const byIntent = {
        food: 'chef',
        accommodation: 'concierge',
        infopoints: 'concierge',
        useful_contacts: 'concierge',
        attractions: 'archeologo',
        experiences: 'escursionista',
        itineraries: 'guida',
        general_territory: 'guida',
        events: 'eventi'
      };
      if (byIntent[intentKey]) return byIntent[intentKey];

      const bySection = {
        eat: 'chef',
        sleep: 'concierge',
        infopoints: 'concierge',
        events: 'eventi',
        itineraries: 'guida',
        experiences: 'escursionista',
        territory: 'guida'
      };
      return bySection[section] || null;
    }

    async renderAssistantMessage(answerText, turnId) {
      const text = String(answerText || '');
      const messageNode = this.ui.addMessage('', 'assistant');
      const messageEntry = { sender: 'assistant', text: '' };
      this.messages.push(messageEntry);
      this.saveStorageState();

      const graphemes = Array.from(text);
      if (!graphemes.length) {
        messageEntry.text = text;
        messageNode.textContent = text;
        this.saveStorageState();
        return true;
      }

      let index = 0;
      let commitCounter = 0;
      const updateChunk = () => {
        if (turnId !== this.turnId) return false;
        index = Math.min(graphemes.length, index + (graphemes.length > 180 ? 3 : 2));
        const partialText = graphemes.slice(0, index).join('');
        messageEntry.text = partialText;
        messageNode.textContent = partialText;
        commitCounter += 1;
        if (commitCounter % 3 === 0 || index >= graphemes.length) this.saveStorageState();
        return index >= graphemes.length;
      };

      return await new Promise(resolve => {
        const tick = () => {
          if (turnId !== this.turnId) {
            resolve(false);
            return;
          }
          const done = updateChunk();
          if (done) {
            messageEntry.text = text;
            messageNode.textContent = text;
            this.saveStorageState();
            resolve(true);
            return;
          }
          this.scheduleTurnCallback(turnId, tick, graphemes.length > 220 ? 12 : 18);
        };
        tick();
      });
    }

    selectMomentPose(message, response, context, positive) {
      if (positive) return 'festeggio';

      const normalized = normalizeForIntentMatch(message);
      const intentKey = String(response?.intent || '').toLocaleLowerCase('it-IT');
      const section = String(context?.section || '').toLocaleLowerCase('it-IT');

      if (includesAny(normalized, ['ciao', 'arrivederci', 'a presto', 'buonanotte'])) return 'arrivederci';
      if (this.shouldUseGeolocation(message)) return 'geolocalizzo';
      if (includesAny(normalized, ['foto', 'fotograf', 'immagin'])) return 'foto';
      if (includesAny(normalized, ['navig', 'traghett', 'rotta', 'barca'])) return 'navigo';
      if (intentKey === 'events' || section === 'events' || includesAny(normalized, ['event', 'sagra', 'festival', 'concerto'])) return 'eventi';
      if (intentKey === 'accommodation' || section === 'sleep' || includesAny(normalized, ['dormire', 'hotel', 'alloggio', 'camera'])) return 'dormo';
      if (response?.actions?.length) return 'letgo';

      return mapLegacyPose(response?.pose) || 'ho-un-idea';
    }

    async getEphemeralLocation(message) {
      if (!this.shouldUseGeolocation(message) || !navigator.geolocation) return null;
      return new Promise(resolve => {
        const timeout = window.setTimeout(() => resolve(null), 1200);
        navigator.geolocation.getCurrentPosition(
          position => {
            window.clearTimeout(timeout);
            resolve({
              lat: Number(position.coords.latitude),
              lon: Number(position.coords.longitude),
              accuracy: Number(position.coords.accuracy || 0)
            });
          },
          () => {
            window.clearTimeout(timeout);
            resolve(null);
          },
          { enableHighAccuracy: false, timeout: 1000, maximumAge: 0 }
        );
      });
    }

    formatSources(sources) {
      if (!Array.isArray(sources) || !sources.length) return '';
      const summary = sources
        .slice(0, 3)
        .map(source => {
          const type = source.record_type ? `${source.record_type}` : 'record';
          const id = source.record_id ? `#${source.record_id}` : '';
          return `${type}${id}`;
        })
        .join(' | ');
      return summary ? `\n\nFonti interne: ${summary}` : '';
    }

    async requestBackendResponse(message) {
      const apiBase = String(this.config.apiBaseUrl || '').trim();
      if (!apiBase) return null;
      const payload = {
        message,
        conversation: this.messages.slice(-12).map(entry => ({ sender: entry.sender, text: entry.text })),
        location: await this.getEphemeralLocation(message),
        language: getChatLanguage()
      };
      let response;
      if (this.apiClient?.requestChat) {
        response = await this.apiClient.requestChat(this.config, payload);
      } else {
        const timeoutMs = Number(this.config.requestTimeoutMs) || 7000;
        response = await new Promise((resolve, reject) => {
          const timer = window.setTimeout(() => reject(new Error('timeout')), timeoutMs);
          fetch(`${apiBase.replace(/\/$/, '')}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }).then(async result => {
            window.clearTimeout(timer);
            if (!result.ok) throw new Error(`chat-http-${result.status}`);
            resolve(await result.json());
          }).catch(error => {
            window.clearTimeout(timer);
            reject(error);
          });
        });
      }
      if (!response || typeof response.answer !== 'string') return null;
      return response;
    }

    readStorageState() {
      const parseStored = value => {
        if (!value) return null;
        try {
          return JSON.parse(value);
        } catch (error) {
          return null;
        }
      };
      try {
        const localState = parseStored(localStorage.getItem(CILEO_STORAGE_KEYS.localState));
        const sessionState = parseStored(sessionStorage.getItem(CILEO_STORAGE_KEYS.sessionState));
        return localState || sessionState || null;
      } catch (error) {
        return null;
      }
    }

    saveStorageState() {
      const state = {
        messages: this.messages,
        actions: this.ui.currentActions || this.initialActions,
        inputValue: this.ui.elements.input.value || ''
      };
      const serialized = JSON.stringify(state);
      try {
        localStorage.setItem(CILEO_STORAGE_KEYS.localState, serialized);
      } catch (error) {
        // Ignore storage quota or availability errors.
      }
      try {
        sessionStorage.setItem(CILEO_STORAGE_KEYS.sessionState, serialized);
      } catch (error) {
        // Ignore storage quota or availability errors.
      }
    }

    removeStorageState() {
      try {
        localStorage.removeItem(CILEO_STORAGE_KEYS.localState);
      } catch (error) {
        // Ignore storage availability errors.
      }
      try {
        sessionStorage.removeItem(CILEO_STORAGE_KEYS.sessionState);
      } catch (error) {
        // Ignore storage availability errors.
      }
    }

    addChatMessage(text, sender) {
      const content = String(text || '');
      this.messages.push({ sender, text: content });
      this.ui.addMessage(content, sender);
      this.saveStorageState();
    }

    setChatActions(actions) {
      this.ui.setActions(actions);
      this.saveStorageState();
    }

    restoreChatFromState(state) {
      const restoredMessages = Array.isArray(state?.messages)
        ? state.messages.filter(entry => entry && (entry.sender === 'assistant' || entry.sender === 'user')).map(entry => ({
            sender: entry.sender,
            text: String(entry.text || '')
          }))
        : [];
      if (!restoredMessages.length) return false;
      this.messages = restoredMessages;
      this.ui.restoreMessages(restoredMessages);
      this.setChatActions(state.actions || this.initialActions);
      this.ui.setSuggestionState('conversation');
      this.ui.elements.input.value = typeof state.inputValue === 'string' ? state.inputValue : '';
      return true;
    }

    getContextualSuggestions() {
      const context = getCilentinoNavigationContext();
      return getCilentinoContextualSuggestions(context);
    }

    syncLocalizedDefaults(refreshCurrentMessage = false) {
      this.initialWelcome = getDefaultWelcome();
      this.initialActions = getDefaultActions();
      if (refreshCurrentMessage && this.messages.length === 1 && this.messages[0].sender === 'assistant') {
        this.messages = [];
        this.ui.clearMessages();
        this.setChatActions(this.initialActions);
        this.addChatMessage(this.initialWelcome, 'assistant');
      }
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
      if (global.CilentomaniaI18n?.init) {
        await global.CilentomaniaI18n.init();
      }
      this.setAvatarMachineState('GREETING');
      try {
        const data = await this.demo.load();
        const useLocalizedDemo = getChatLanguage() !== 'it';
        this.initialWelcome = useLocalizedDemo
          ? getDefaultWelcome()
          : String(data.welcome || getDefaultWelcome());
        this.initialActions = useLocalizedDemo
          ? getDefaultActions()
          : (Array.isArray(data.actions) && data.actions.length ? data.actions : getDefaultActions());
        const restored = this.readStorageState();
        const restoredOk = this.restoreChatFromState(restored);
        if (!restoredOk) {
          this.setChatActions(this.initialActions);
          this.addChatMessage(this.initialWelcome, 'assistant');
          this.ui.elements.input.value = '';
        }
      } catch (error) {
        console.error('Cileo:', error);
        this.initialWelcome = getDefaultWelcome();
        this.initialActions = getDefaultActions();
        this.setChatActions(this.initialActions);
        this.addChatMessage(this.initialWelcome, 'assistant');
      }

      document.addEventListener('cilentomania:languagechange', () => {
        this.syncLocalizedDefaults(true);
        if (!this.started) return;
        if (!this.messages.length || (this.messages.length === 1 && this.messages[0].sender === 'assistant')) {
          this.clearChat();
          return;
        }
        if (Array.isArray(this.ui.currentActions) && this.ui.currentActions.length) {
          this.ui.setActions(this.ui.currentActions.map(action => ({ ...action })));
        }
      });

      this.ui.root.classList.add('is-ready');
      this.started = true;
      this.syncLocalizedDefaults(true);
      this.restartSleepTimer();
      document.dispatchEvent(new CustomEvent('cileo:ready', { detail: { instance: this } }));
      return this;
    }

    async handleAction(action) {
      if (!action) return;
      this.addChatMessage(action.label, 'user');
      await this.respond(action.query || action.label, action.id);
    }

    async handleMessage(message) {
      this.addChatMessage(message, 'user');
      await this.respond(message);
    }

    async respond(message, actionId) {
      const turnId = this.cancelActiveTurn();
      const context = getCilentinoNavigationContext();
      const thematicAvatar = this.selectTopicAvatar(message, null, context);
      this.currentTopicAvatar = thematicAvatar;
      this.requestInFlight = true;
      this.requestPhase = 'waiting';
      this.isSleeping = false;
      this.stopTyping = this.ui.showTyping();
      this.scheduleTurnCallback(turnId, () => {
        if (this.requestPhase !== 'waiting') return;
        this.setAvatarMachineState('THINKING');
      }, 300);
      try {
        let response = null;
        let fromBackend = false;
        try {
          response = await this.requestBackendResponse(message);
          fromBackend = Boolean(response);
        } catch (error) {
          response = null;
        }

        if (!response && this.config.enableDemoFallback) {
          const demoResponse = await this.demo.reply(message, actionId);
          response = {
            answer: demoResponse.text,
            actions: demoResponse.actions || this.demo.getActions(),
            sources: [],
            fallback: true,
            intent: demoResponse.intent || null,
            pose: demoResponse.pose || 'idea'
          };
          fromBackend = false;
        }

        if (turnId !== this.turnId) return;

        if (!response) {
          this.stopTyping?.();
          this.stopTyping = null;
          this.addChatMessage(t('chat.fallback', 'Questo consiglio per ora mi sfugge. Possiamo continuare esplorando luoghi, eventi e itinerari del Cilento.'), 'assistant');
          this.setChatActions(this.initialActions);
          this.requestInFlight = false;
          this.requestPhase = 'idle';
          this.setAvatarMachineState('ERROR');
          this.restartSleepTimer();
          return;
        }

        const answerText = fromBackend
          ? `${response.answer}${this.formatSources(response.sources)}`
          : response.answer;

        this.requestPhase = 'typing';
        let topicShownAt = 0;
        if (thematicAvatar) {
          this.setAvatarMachineState('TOPIC', { topicState: thematicAvatar });
          topicShownAt = Date.now();
        }
        this.stopTyping?.();
        this.stopTyping = null;
        const rendered = await this.renderAssistantMessage(answerText, turnId);
        if (!rendered || turnId !== this.turnId) return;

        if (thematicAvatar && topicShownAt) {
          const elapsed = Date.now() - topicShownAt;
          if (elapsed < 1200) {
            await new Promise(resolve => this.scheduleTurnCallback(turnId, resolve, 1200 - elapsed));
            if (turnId !== this.turnId) return;
          }
        }

        this.setChatActions(Array.isArray(response.actions) && response.actions.length ? response.actions : this.demo.getActions());
        this.requestInFlight = false;
        this.requestPhase = 'idle';
        this.setAvatarMachineState('COMPLETE');
        this.restartSleepTimer();
      } catch (error) {
        this.stopTyping?.();
        this.stopTyping = null;
        if (turnId !== this.turnId) return;
        this.addChatMessage(t('chat.fallback', 'Questo consiglio per ora mi sfugge. Possiamo continuare esplorando luoghi, eventi e itinerari del Cilento.'), 'assistant');
        this.requestInFlight = false;
        this.requestPhase = 'idle';
        this.setAvatarMachineState('ERROR');
        this.restartSleepTimer();
      }
    }

    clearChat() {
      this.conversationRevision += 1;
      this.cancelActiveTurn();
      this.requestInFlight = false;
      this.requestPhase = 'idle';
      this.isSleeping = false;
      this.messages = [];
      this.ui.clearMessages();
      this.ui.elements.input.value = '';
      this.ui.setSuggestionState('conversation');
      this.setChatActions(this.initialActions);
      this.removeStorageState();
      this.addChatMessage(this.initialWelcome, 'assistant');
      this.setAvatarMachineState('GREETING');
      this.restartSleepTimer();
      this.ui.elements.input.focus({ preventScroll: true });
    }

    setCileoState(state, options) {
      return this.animation.setCileoState(state, options);
    }

    testPoses() {
      const poses = [
        'benvenuto', 'ascolto', 'penso', 'cerco', 'cartina', 'ho-un-idea', 'indico', 'ok', 'arrivederci', 'abbraccio',
        'eventi', 'foto', 'geolocalizzo', 'dormo', 'letgo', 'navigo', 'festeggio',
        'chef', 'concierge', 'guida', 'escursionista', 'marinaio', 'bagnino', 'archeologo', 'agricoltore'
      ].map(state => ({ state, duration: 1200 }));
      poses.push({ state: 'ciao', duration: 2000 });
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
