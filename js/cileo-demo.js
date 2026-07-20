(function (global) {
  'use strict';

  class CileoDemoProvider {
    constructor(dataUrl) {
      this.dataUrl = dataUrl;
      this.data = null;
    }

    async load() {
      const response = await fetch(this.dataUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error('Impossibile caricare la demo di Cileo (HTTP ' + response.status + ')');
      this.data = await response.json();
      return this.data;
    }

    getActions() {
      return this.data?.actions || [];
    }

    normalize(value) {
      return String(value || '').toLocaleLowerCase('it-IT').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    findRule(message) {
      const normalized = this.normalize(message);
      return (this.data?.responses || [])
        .filter(rule => (rule.keywords || []).every(keyword => normalized.includes(this.normalize(keyword))))
        .sort((first, second) => (second.priority || 0) - (first.priority || 0))[0];
    }

    async reply(message, actionId) {
      await new Promise(resolve => window.setTimeout(resolve, 650));
      const action = this.getActions().find(item => item.id === actionId);
      const rule = action ? null : this.findRule(message);
      return {
        text: action?.reply || rule?.reply || this.data?.fallback,
        pose: action?.pose || rule?.pose || 'idea',
        actions: rule?.actions || this.getActions()
      };
    }
  }

  global.CileoDemoProvider = CileoDemoProvider;
})(window);
