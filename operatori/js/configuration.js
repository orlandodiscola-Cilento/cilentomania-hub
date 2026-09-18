// This file accepts only public settings. Never put privileged credentials here.
export class BackendUnavailableError extends Error {
  constructor() {
    super('Il servizio selezionato non è disponibile o non è ancora configurato. Nessun dato è stato salvato localmente.');
    this.name = 'BackendUnavailableError';
  }
}

export function validateConfiguration(value) {
  const fail = () => { throw new BackendUnavailableError(); };
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail();
  if (Object.keys(value).some(key => !['backend', 'auth', 'supabase'].includes(key))) fail();
  if (!['demo', 'supabase'].includes(value.backend)) fail();
  const auth = value.auth ?? value.backend;
  if (!['demo', 'supabase'].includes(auth)) fail();
  if (value.backend === 'supabase' && auth !== 'supabase') fail();
  const settings = value.supabase;
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) fail();
  if (Object.keys(settings).some(key => !['url', 'publishableKey'].includes(key))) fail();
  if (typeof settings.url !== 'string' || typeof settings.publishableKey !== 'string') fail();
  // Empty settings are intentional in Step 3.1. No remote client is created.
  if (settings.url) {
    try {
      const url = new URL(settings.url);
      if (url.origin !== 'https://qgkwqzjapvjvzmvdfges.supabase.co' || url.pathname !== '/' || url.username || url.password || url.search || url.hash) fail();
    } catch { fail(); }
  }
  if (settings.publishableKey && !settings.publishableKey.startsWith('sb_publishable_')) fail();
  return Object.freeze({backend:value.backend, auth, supabase:Object.freeze({...settings})});
}

export async function loadConfiguration(fetcher = fetch) {
  try {
    // Local override is never versioned or deployed. A malformed/unavailable
    // override fails closed; only a genuine 404 allows the checked-in default.
    if (['127.0.0.1','localhost','[::1]'].includes(globalThis.location?.hostname)) {
      const local = await fetcher(new URL('../config.local.json', import.meta.url), {cache:'no-store'});
      if(local.ok) return validateConfiguration(await local.json());
      if(local.status!==404) throw new BackendUnavailableError();
    }
    const response = await fetcher(new URL('../config.json', import.meta.url), {cache:'no-store'});
    if (!response.ok) throw new BackendUnavailableError();
    return validateConfiguration(await response.json());
  } catch { throw new BackendUnavailableError(); }
}
