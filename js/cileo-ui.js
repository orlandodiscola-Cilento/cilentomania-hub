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
      root.setAttribute('aria-label', 'Assistente di viaggio Cileo');
      root.innerHTML = `
        <div class="cileo__bubble" data-cileo-bubble role="status">
          <strong>Benvenuto nel Cilento! <span aria-hidden="true">👋</span></strong>
          <span>Sono Cileo, il tuo assistente di viaggio.</span>
          <span>Posso aiutarti a scoprire borghi, spiagge, eventi, esperienze e molto altro.</span>
        </div>
        <section class="cileo__panel" data-cileo-panel role="dialog" aria-modal="false" aria-labelledby="cileo-title" hidden>
          <header class="cileo__header">
            <div><h2 id="cileo-title">Cileo</h2><p>Il tuo assistente di viaggio nel Cilento</p></div>
            <button class="cileo__close" data-cileo-close type="button" aria-label="Chiudi Cileo">&times;</button>
          </header>
          <div class="cileo__messages" data-cileo-messages aria-live="polite"></div>
          <div class="cileo__actions" data-cileo-actions aria-label="Azioni rapide"></div>
          <form class="cileo__form" data-cileo-form>
            <label class="cileo__sr-only" for="cileo-input">Scrivi a Cileo</label>
            <input id="cileo-input" data-cileo-input autocomplete="off" placeholder="Chiedi a Cileo..." maxlength="300">
            <button type="submit" aria-label="Invia messaggio"><span aria-hidden="true">&#8593;</span></button>
          </form>
        </section>
        <button class="cileo__launcher" data-cileo-launcher type="button" aria-label="Apri Cileo" aria-expanded="false">
          <img data-cileo-avatar alt="Cileo, assistente di viaggio nel Cilento">
          <span class="cileo__online" aria-hidden="true"></span>
        </button>`;
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
      typing.setAttribute('aria-label', 'Cileo sta scrivendo');
      typing.innerHTML = '<i></i><i></i><i></i>';
      this.elements.messages.appendChild(typing);
      this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
      return () => typing.remove();
    }

    showBubble() {
      this.elements.bubble.classList.add('is-visible');
    }

    hideBubble() {
      this.elements.bubble.classList.remove('is-visible');
    }

    open() {
      if (this.isOpen) return;
      this.lastFocus = document.activeElement;
      this.isOpen = true;
      this.hideBubble();
      this.elements.panel.hidden = false;
      this.elements.launcher.setAttribute('aria-expanded', 'true');
      this.elements.launcher.setAttribute('aria-label', 'Cileo aperto');
      requestAnimationFrame(() => this.root.classList.add('is-open'));
      window.setTimeout(() => this.elements.input.focus(), 240);
      this.options.onOpen();
    }

    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.root.classList.remove('is-open');
      this.elements.launcher.setAttribute('aria-expanded', 'false');
      this.elements.launcher.setAttribute('aria-label', 'Apri Cileo');
      window.setTimeout(() => { this.elements.panel.hidden = true; }, 220);
      this.options.onClose();
      this.lastFocus?.focus?.();
    }

    toggle() {
      this.isOpen ? this.close() : this.open();
    }
  }

  global.CileoUI = CileoUI;
})(window);
