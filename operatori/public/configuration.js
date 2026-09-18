export class BackendUnavailableError extends Error {
  constructor(){super('Il servizio di accesso non è disponibile. Riprova più tardi.');}
}
export function validateConfiguration(value){
  if(!value || Object.keys(value).some(k=>!['auth','supabase'].includes(k)) || value.auth!=='supabase')throw new BackendUnavailableError();
  const settings=value.supabase;
  if(!settings || Object.keys(settings).some(k=>!['url','publishableKey'].includes(k)) || settings.url!=='https://qgkwqzjapvjvzmvdfges.supabase.co' || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(settings.publishableKey))throw new BackendUnavailableError();
  return value;
}
export async function loadConfiguration(fetcher=fetch){
  try {
    const response=await fetcher(new URL('../config.json',import.meta.url),{cache:'no-store'});
    if(!response.ok)throw new BackendUnavailableError();
    return validateConfiguration(await response.json());
  }catch{throw new BackendUnavailableError();}
}
