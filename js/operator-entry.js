// Preview only. This is a release gate, NOT an authentication/security control.
// Public activation requires completion and approval of real Auth + server permissions.
export const PUBLIC_OPERATOR_ENTRY_ENABLED = false;
export const PUBLIC_OPERATOR_URL = 'https://www.cilentomania.it/hub/operatori/';
export function entryUrl(location) {
  const local = ['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname);
  if (local) return new URL('operatori/', location.href).href;
  return PUBLIC_OPERATOR_ENTRY_ENABLED ? PUBLIC_OPERATOR_URL : null;
}

if (typeof document !== 'undefined') {
  const href = entryUrl(window.location);
  const header = document.querySelector('.topbar');
  const language = header?.querySelector('[data-language-selector]');
  if (href && header && language) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = new URL('../css/operator-entry.css', import.meta.url).href;
    document.head.append(css);
    const controls = document.createElement('div');
    controls.className = 'hub-account-controls';
    const link = document.createElement('a');
    link.className = 'hub-operator-entry';
    link.href = href;
    link.setAttribute('aria-label', 'Area Operatori');
    link.title = 'Area Operatori';
    link.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg><span>Area Operatori</span>';
    header.classList.add('has-operator-entry');
    controls.append(link, language);
    header.append(controls);
  }
}
