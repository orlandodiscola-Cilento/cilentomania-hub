(function (global) {
  'use strict';

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[character]));

  class CileoUI {
    constructor(options) {
      this.options = options;
      this.isOpen = false;
      this.lastFocus = null;
      this.root = this.build();
      document.body.appendChild(this.root);
      this.elements = {
        launcher: this.root.querySelector('[data-cileo-launcher]'),
        avatar: this.root.querySelector('[data-cileo-avatar]'),
        bubble: this.root.querySelector('[data-cileo-bubble]'),
        panel: this.root.querySelector('[data-cileo-panel]'),
        close: this.root.querySelector('[data-cileo-close]'),
        content: this.root.querySelector('[data-cileo-content]'),
        messages: this.root.querySelector('[data-cileo-messages]'),
        actions: this.root.querySelector('[data-cileo-actions]'),
        suggestionsToggle: this.root.querySelector('[data-cileo-suggestions-toggle]'),
        form: this.root.querySelector('[data-cileo-form]'),
        input: this.root.querySelector('[data-cileo-input]')
      };
      this.hasConversation = false;
      this.suggestionState = 'initial';
      this.viewportFrame = 0;
      this.bind();
      this.setSuggestionState('initial');
      this.updateViewport();
    }

    build() {
      const root = document.createElement('aside');
      root.className = 'cileo';
      root.setAttribute('aria-label', 'Velio, guida digitale di Cilentomania');
      root.innerHTML = `
        <div class="cileo__bubble" data-cileo-bubble role="status" hidden>
          <strong>Ciao e benvenuto! <span aria-hidden="true">👋</span></strong>
          <span>Io sono Velio, la guida digitale di Cilentomania.</span>
          <span>Scopri il Parco Nazionale del Cilento, Vallo di Diano e Alburni.</span>
        </div>
        <section class="cileo__panel" data-cileo-panel role="dialog" aria-modal="false" aria-labelledby="cileo-title" hidden>
          <header class="cileo__header">
            <div><h2 id="cileo-title">Velio</h2><p>La guida digitale di Cilentomania<br>Scopri il Parco Nazionale del Cilento, Vallo di Diano e Alburni</p></div>
            <button class="cileo__close" data-cileo-close type="button" aria-label="Chiudi Velio">&times;</button>
          </header>
          <div class="cileo__content" data-cileo-content>
            <div class="cileo__messages" data-cileo-messages aria-live="polite"></div>
            <div class="cileo__actions" id="cileo-suggestions" data-cileo-actions aria-label="Azioni rapide"></div>
            <button class="cileo__suggestions-toggle" data-cileo-suggestions-toggle type="button" aria-expanded="false" aria-controls="cileo-suggestions" hidden>Suggerimenti</button>
          </div>
          <form class="cileo__form" data-cileo-form>
            <label class="cileo__sr-only" for="cileo-input">Scrivi a Velio</label>
            <input id="cileo-input" data-cileo-input autocomplete="off" placeholder="Chiedi a Velio..." maxlength="300">
            <button type="submit" aria-label="Invia messaggio"><span aria-hidden="true">&#8593;</span></button>
          </form>
        </section>
        <button class="cileo__launcher" data-cileo-launcher type="button" aria-label="Apri Velio" aria-expanded="false"></button>
        <div class="cileo__avatar-visual" aria-hidden="true">
          <img data-cileo-avatar alt="Velio, guida digitale di Cilentomania">
          <span class="cileo__online" aria-hidden="true"></span>
        </div>`;
      return root;
    }

    bind() {
      this.elements.launcher.addEventListener('click', () => this.toggle());
      this.elements.close.addEventListener('click', () => this.close());
      this.elements.suggestionsToggle.addEventListener('click', () => {
        const collapsedState = this.hasConversation ? 'conversation' : 'initial';
        const nextState = this.suggestionState === 'suggestions-open' ? collapsedState : 'suggestions-open';
        this.setSuggestionState(nextState);
        this.scheduleContentScroll();
      });
      this.elements.form.addEventListener('submit', event => {
        event.preventDefault();
        const value = this.elements.input.value.trim();
        if (!value) return;
        this.elements.input.value = '';
        this.options.onMessage(value);
      });
      this.root.addEventListener('keydown', event => {
        if (event.key === 'Escape' && this.isOpen) this.close();
      });

      const scheduleViewportUpdate = () => {
        window.cancelAnimationFrame(this.viewportFrame);
        this.viewportFrame = window.requestAnimationFrame(() => this.updateViewport());
      };
      window.addEventListener('resize', scheduleViewportUpdate, { passive: true });
      window.addEventListener('orientationchange', scheduleViewportUpdate, { passive: true });
      window.visualViewport?.addEventListener('resize', scheduleViewportUpdate, { passive: true });
      window.visualViewport?.addEventListener('scroll', scheduleViewportUpdate, { passive: true });
      this.elements.input.addEventListener('focus', () => {
        if (this.suggestionState === 'suggestions-open') {
          this.setSuggestionState(this.hasConversation ? 'conversation' : 'initial');
        }
        scheduleViewportUpdate();
      });
      this.elements.input.addEventListener('blur', scheduleViewportUpdate);
    }

    updateViewport() {
      const viewport = window.visualViewport;
      const width = viewport?.width ?? document.documentElement.clientWidth;
      const height = viewport?.height ?? window.innerHeight;
      const offsetLeft = viewport?.offsetLeft ?? 0;
      const offsetTop = viewport?.offsetTop ?? 0;
      const bottom = Math.max(0, window.innerHeight - offsetTop - height);
      const keyboardOpen = this.isOpen && document.activeElement === this.elements.input;

      this.root.style.setProperty('--cileo-vv-width', `${width}px`);
      this.root.style.setProperty('--cileo-vv-height', `${height}px`);
      this.root.style.setProperty('--cileo-vv-left', `${offsetLeft}px`);
      this.root.style.setProperty('--cileo-vv-top', `${offsetTop}px`);
      this.root.style.setProperty('--cileo-vv-bottom', `${bottom}px`);
      this.root.classList.toggle('is-keyboard-open', keyboardOpen);
      this.syncSuggestionControls();
    }

    scrollContentToBottom() {
      this.elements.content.scrollTop = this.elements.content.scrollHeight;
    }

    scheduleContentScroll() {
      this.scrollContentToBottom();
      window.requestAnimationFrame(() => this.scrollContentToBottom());
    }

    setSuggestionState(state) {
      this.suggestionState = state;
      this.root.dataset.suggestionsState = state;
      this.syncSuggestionControls();
    }

    syncSuggestionControls() {
      const isInitial = this.suggestionState === 'initial';
      const isExpanded = this.suggestionState === 'suggestions-open';
      const keyboardOpen = this.root.classList.contains('is-keyboard-open');
      this.elements.suggestionsToggle.hidden = isInitial && !keyboardOpen;
      this.elements.suggestionsToggle.textContent = isExpanded ? 'Nascondi suggerimenti' : 'Suggerimenti';
      this.elements.suggestionsToggle.setAttribute('aria-expanded', String(isExpanded));
    }

    lockPageScroll() {
      if (this.pageScrollLock) return;
      const body = document.body;
      this.pageScrollLock = {
        y: window.scrollY,
        position: body.style.position,
        top: body.style.top,
        left: body.style.left,
        right: body.style.right,
        width: body.style.width,
        overflow: body.style.overflow
      };
      document.documentElement.classList.add('cileo-page-locked');
      body.style.position = 'fixed';
      body.style.top = `-${this.pageScrollLock.y}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.width = '100%';
      body.style.overflow = 'hidden';
    }

    unlockPageScroll() {
      if (!this.pageScrollLock) return;
      const lock = this.pageScrollLock;
      const body = document.body;
      document.documentElement.classList.remove('cileo-page-locked');
      body.style.position = lock.position;
      body.style.top = lock.top;
      body.style.left = lock.left;
      body.style.right = lock.right;
      body.style.width = lock.width;
      body.style.overflow = lock.overflow;
      this.pageScrollLock = null;
      window.scrollTo(0, lock.y);
    }

    setActions(actions) {
      this.currentActions = actions;
      if (!this.primaryActions) this.primaryActions = actions;
      const visibleActions = this.suggestionState === 'initial' ? actions : this.primaryActions;
      this.elements.actions.innerHTML = visibleActions.map((action, index) =>
        `<button type="button" data-cileo-action="${index}">${action.icon ? `<span aria-hidden="true">${escapeHtml(action.icon)}</span>` : ''}${escapeHtml(action.label)}</button>`
      ).join('');
      this.elements.actions.querySelectorAll('[data-cileo-action]').forEach(button => {
        button.addEventListener('click', () => this.options.onAction(visibleActions[Number(button.dataset.cileoAction)]));
      });
      window.requestAnimationFrame(() => this.scrollContentToBottom());
    }

    addMessage(text, sender) {
      const message = document.createElement('div');
      message.className = 'cileo__message cileo__message--' + sender;
      message.textContent = text;
      if (sender === 'user') {
        this.hasConversation = true;
        this.setSuggestionState('conversation');
      }
      this.elements.messages.appendChild(message);
      this.scheduleContentScroll();
      return message;
    }

    showTyping() {
      const typing = document.createElement('div');
      typing.className = 'cileo__message cileo__message--assistant cileo__typing';
      typing.setAttribute('aria-label', 'Velio sta scrivendo');
      typing.innerHTML = '<i></i><i></i><i></i>';
      this.elements.messages.appendChild(typing);
      this.scheduleContentScroll();
      return () => typing.remove();
    }

    showBubble() {
      this.elements.bubble.hidden = false;
      this.elements.bubble.classList.add('is-visible');
    }

    hideBubble() {
      this.elements.bubble.classList.remove('is-visible');
      this.elements.bubble.hidden = true;
    }

    open() {
      if (this.isOpen) return;
      this.lastFocus = document.activeElement;
      this.isOpen = true;
      this.hideBubble();
      this.elements.panel.hidden = false;
      this.elements.launcher.setAttribute('aria-expanded', 'true');
      this.elements.launcher.setAttribute('aria-label', 'Velio aperto');
      this.root.classList.add('is-open');
      this.lockPageScroll();
      this.updateViewport();
      this.focusTimer = window.setTimeout(() => {
        this.focusTimer = 0;
        if (this.isOpen) this.elements.input.focus();
      }, 240);
      this.options.onOpen();
    }

    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      window.clearTimeout(this.focusTimer);
      this.focusTimer = 0;
      this.root.classList.remove('is-open');
      this.root.classList.remove('is-keyboard-open');
      if (this.suggestionState === 'suggestions-open') {
        this.setSuggestionState(this.hasConversation ? 'conversation' : 'initial');
      }
      this.elements.panel.hidden = true;
      this.elements.launcher.setAttribute('aria-expanded', 'false');
      this.elements.launcher.setAttribute('aria-label', 'Apri Velio');
      this.unlockPageScroll();
      this.options.onClose();
      this.lastFocus?.focus?.();
    }

    toggle() {
      this.isOpen ? this.close() : this.open();
    }
  }

  global.CileoUI = CileoUI;
})(window);
