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
        messages: this.root.querySelector('[data-cileo-messages]'),
        actions: this.root.querySelector('[data-cileo-actions]'),
        form: this.root.querySelector('[data-cileo-form]'),
        input: this.root.querySelector('[data-cileo-input]')
      };
      this.bind();
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
          <div class="cileo__messages" data-cileo-messages aria-live="polite"></div>
          <div class="cileo__actions" data-cileo-actions aria-label="Azioni rapide"></div>
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
    }

    setActions(actions) {
      this.currentActions = actions;
      this.elements.actions.innerHTML = actions.map((action, index) =>
        `<button type="button" data-cileo-action="${index}">${action.icon ? `<span aria-hidden="true">${escapeHtml(action.icon)}</span>` : ''}${escapeHtml(action.label)}</button>`
      ).join('');
      this.elements.actions.querySelectorAll('[data-cileo-action]').forEach(button => {
        button.addEventListener('click', () => this.options.onAction(this.currentActions[Number(button.dataset.cileoAction)]));
      });
    }

    addMessage(text, sender) {
      const message = document.createElement('div');
      message.className = 'cileo__message cileo__message--' + sender;
      message.textContent = text;
      this.elements.messages.appendChild(message);
      this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
      return message;
    }

    showTyping() {
      const typing = document.createElement('div');
      typing.className = 'cileo__message cileo__message--assistant cileo__typing';
      typing.setAttribute('aria-label', 'Velio sta scrivendo');
      typing.innerHTML = '<i></i><i></i><i></i>';
      this.elements.messages.appendChild(typing);
      this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
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
      window.setTimeout(() => this.elements.input.focus(), 240);
      this.options.onOpen();
    }

    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.root.classList.remove('is-open');
      this.elements.panel.hidden = true;
      this.elements.launcher.setAttribute('aria-expanded', 'false');
      this.elements.launcher.setAttribute('aria-label', 'Apri Velio');
      this.options.onClose();
      this.lastFocus?.focus?.();
    }

    toggle() {
      this.isOpen ? this.close() : this.open();
    }
  }

  global.CileoUI = CileoUI;
})(window);
