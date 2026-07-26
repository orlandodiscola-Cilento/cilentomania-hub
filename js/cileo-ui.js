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
        clear: this.root.querySelector('[data-cileo-clear]'),
        close: this.root.querySelector('[data-cileo-close]'),
        content: this.root.querySelector('[data-cileo-content]'),
        messages: this.root.querySelector('[data-cileo-messages]'),
        actions: this.root.querySelector('[data-cileo-actions]'),
        suggestionsToggle: this.root.querySelector('[data-cileo-suggestions-toggle]'),
        form: this.root.querySelector('[data-cileo-form]'),
        input: this.root.querySelector('[data-cileo-input]'),
        confirmOverlay: this.root.querySelector('[data-cileo-confirm]'),
        confirmCancel: this.root.querySelector('[data-cileo-confirm-cancel]'),
        confirmDelete: this.root.querySelector('[data-cileo-confirm-delete]')
      };
      this.hasConversation = false;
      this.suggestionState = 'conversation';
      this.confirmOpen = false;
      this.lastConfirmFocus = null;
      this.viewportFrame = 0;
      this.bind();
      this.setSuggestionState('conversation');
      this.updateViewport();
    }

    build() {
      const root = document.createElement('aside');
      root.className = 'cileo';
      root.setAttribute('aria-label', 'Cilentino, guida digitale di Cilentomania');
      root.innerHTML = `
        <div class="cileo__bubble" data-cileo-bubble role="status" hidden>
          <strong>Ciao, sono Cilentino <span aria-hidden="true">👋</span></strong>
          <span>La guida digitale di Cilentomania.</span>
          <span>Sarò il tuo compagno di viaggio alla scoperta del Parco Nazionale del Cilento, Vallo di Diano e Alburni.</span>
        </div>
        <section class="cileo__panel" data-cileo-panel role="dialog" aria-modal="false" aria-labelledby="cileo-title" hidden>
          <header class="cileo__header">
            <div class="cileo__header-copy"><h2 id="cileo-title">Ciao, sono Cilentino</h2><p>La guida digitale di Cilentomania</p><p>Sarò il tuo compagno di viaggio alla scoperta del Parco Nazionale del Cilento, Vallo di Diano e Alburni.</p></div>
            <div class="cileo__header-actions">
              <button class="cileo__close" data-cileo-close type="button" aria-label="Chiudi Cilentino">&times;</button>
              <button class="cileo__clear" data-cileo-clear type="button" aria-label="Cancella chat"><span aria-hidden="true">🗑</span><span>Cancella chat</span></button>
            </div>
          </header>
          <div class="cileo__content" data-cileo-content>
            <div class="cileo__messages" data-cileo-messages aria-live="polite"></div>
            <div class="cileo__actions" id="cileo-suggestions" data-cileo-actions aria-label="Azioni rapide"></div>
            <button class="cileo__suggestions-toggle" data-cileo-suggestions-toggle type="button" aria-expanded="false" aria-controls="cileo-suggestions">Suggerimenti</button>
          </div>
          <form class="cileo__form" data-cileo-form>
            <label class="cileo__sr-only" for="cileo-input">Scrivi a Cilentino</label>
            <input id="cileo-input" data-cileo-input autocomplete="off" placeholder="Chiedi a Cilentino..." maxlength="300">
            <button type="submit" aria-label="Invia messaggio"><span aria-hidden="true">&#8593;</span></button>
          </form>
          <div class="cileo__confirm" data-cileo-confirm hidden>
            <div class="cileo__confirm-backdrop" data-cileo-confirm-cancel></div>
            <section class="cileo__confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="cileo-confirm-title" aria-describedby="cileo-confirm-description">
              <h3 id="cileo-confirm-title">Cancella chat</h3>
              <p id="cileo-confirm-description">Vuoi cancellare questa conversazione?</p>
              <div class="cileo__confirm-actions">
                <button type="button" class="cileo__confirm-cancel" data-cileo-confirm-cancel>Annulla</button>
                <button type="button" class="cileo__confirm-delete" data-cileo-confirm-delete>Cancella</button>
              </div>
            </section>
          </div>
        </section>
        <button class="cileo__launcher" data-cileo-launcher type="button" aria-label="Apri Cilentino" aria-expanded="false"></button>
        <div class="cileo__avatar-visual" aria-hidden="true">
          <img data-cileo-avatar alt="Cilentino, guida digitale di Cilentomania">
          <span class="cileo__online" aria-hidden="true"></span>
        </div>`;
      return root;
    }

    bind() {
      this.elements.launcher.addEventListener('click', () => this.toggle());
      this.elements.close.addEventListener('click', () => this.close());
      this.elements.clear.addEventListener('click', () => this.openConfirm());
      this.root.querySelectorAll('[data-cileo-confirm-cancel]').forEach(element => {
        element.addEventListener('click', () => this.closeConfirm(true));
      });
      this.elements.confirmDelete.addEventListener('click', () => {
        this.closeConfirm(false);
        this.options.onClearChat?.();
      });
      this.elements.suggestionsToggle.addEventListener('click', () => {
        const collapsedState = 'conversation';
        const nextState = this.suggestionState === 'suggestions-open' ? collapsedState : 'suggestions-open';
        if (nextState === 'suggestions-open') {
          const contextual = this.options.onSuggestionsRequest?.() || [];
          this.setActions(contextual);
        }
        this.setSuggestionState(nextState);
        this.scheduleContentScroll();
      });
      this.elements.actions.addEventListener('click', event => {
        const button = event.target.closest('[data-cileo-action]');
        if (!button) return;
        const index = Number(button.dataset.cileoAction);
        const action = this.currentActions?.[index];
        if (!action) return;
        this.setSuggestionState('conversation');
        this.options.onAction(action);
        this.elements.input.focus({ preventScroll: true });
      });
      this.elements.form.addEventListener('submit', event => {
        event.preventDefault();
        const value = this.elements.input.value.trim();
        if (!value) return;
        this.elements.input.value = '';
        this.options.onMessage(value);
      });
      this.root.addEventListener('keydown', event => {
        if (event.key !== 'Escape' || !this.isOpen) return;
        if (this.confirmOpen) {
          event.preventDefault();
          this.closeConfirm(true);
          return;
        }
        if (this.suggestionState === 'suggestions-open') {
          event.preventDefault();
          this.setSuggestionState('conversation');
          this.elements.suggestionsToggle.focus({ preventScroll: true });
          return;
        }
        this.close();
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
          this.setSuggestionState('conversation');
        }
        scheduleViewportUpdate();
      });
      this.elements.input.addEventListener('blur', scheduleViewportUpdate);
      this.elements.confirmOverlay.addEventListener('keydown', event => this.handleConfirmKeydown(event));
    }

    handleConfirmKeydown(event) {
      if (!this.confirmOpen || event.key !== 'Tab') return;
      const focusable = this.getConfirmFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    getConfirmFocusable() {
      return Array.from(this.elements.confirmOverlay.querySelectorAll('button:not([disabled])'));
    }

    openConfirm() {
      if (this.confirmOpen) return;
      this.confirmOpen = true;
      this.lastConfirmFocus = document.activeElement;
      this.elements.confirmOverlay.hidden = false;
      this.elements.confirmDelete.focus({ preventScroll: true });
    }

    closeConfirm(restoreFocus) {
      if (!this.confirmOpen) return;
      this.confirmOpen = false;
      this.elements.confirmOverlay.hidden = true;
      if (restoreFocus) {
        (this.lastConfirmFocus || this.elements.clear)?.focus?.({ preventScroll: true });
      }
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
      const isExpanded = this.suggestionState === 'suggestions-open';
      const availableActions = (this.currentActions || this.primaryActions || []).length;
      this.elements.suggestionsToggle.hidden = availableActions === 0;
      this.elements.suggestionsToggle.textContent = isExpanded ? 'Chiudi suggerimenti' : 'Suggerimenti';
      this.elements.suggestionsToggle.setAttribute('aria-label', isExpanded ? 'Chiudi suggerimenti' : 'Apri suggerimenti');
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
      const normalizedActions = Array.isArray(actions) ? actions : [];
      this.currentActions = normalizedActions;
      if (!this.primaryActions) this.primaryActions = normalizedActions;
      this.elements.actions.innerHTML = normalizedActions.map((action, index) =>
        `<button type="button" data-cileo-action="${index}">${action.icon ? `<span aria-hidden="true">${escapeHtml(action.icon)}</span>` : ''}${escapeHtml(action.label)}</button>`
      ).join('');
      this.syncSuggestionControls();
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

    clearMessages() {
      this.elements.messages.innerHTML = '';
      this.hasConversation = false;
    }

    restoreMessages(messages) {
      this.clearMessages();
      (Array.isArray(messages) ? messages : []).forEach(entry => {
        if (!entry || (entry.sender !== 'assistant' && entry.sender !== 'user')) return;
        this.addMessage(entry.text || '', entry.sender);
      });
    }

    showTyping() {
      const typing = document.createElement('div');
      typing.className = 'cileo__message cileo__message--assistant cileo__typing';
      typing.setAttribute('aria-label', 'Cilentino sta scrivendo');
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
      this.elements.launcher.setAttribute('aria-label', 'Cilentino aperto');
      this.root.classList.add('is-open');
      this.lockPageScroll();
      this.updateViewport();
      this.focusTimer = 0;
      this.options.onOpen();
    }

    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      window.clearTimeout(this.focusTimer);
      this.focusTimer = 0;
      this.closeConfirm(false);
      this.root.classList.remove('is-open');
      this.root.classList.remove('is-keyboard-open');
      if (this.suggestionState === 'suggestions-open') {
        this.setSuggestionState('conversation');
      }
      this.elements.panel.hidden = true;
      this.elements.launcher.setAttribute('aria-expanded', 'false');
      this.elements.launcher.setAttribute('aria-label', 'Apri Cilentino');
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
