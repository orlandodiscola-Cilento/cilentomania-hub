import {BackendUnavailableError} from './configuration.js';
export function passwordRedirect(location) {
  const url = new URL('password.html', new URL('./', location.href));
  const allowed = ['http://127.0.0.1:8765/operatori/password.html','http://localhost:8765/operatori/password.html'];
  // Production is deliberately not enabled in this DEV-only stage.
  if (!allowed.includes(url.href)) throw new BackendUnavailableError();
  return url.href;
}
