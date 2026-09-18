import {OperatorSession} from './session.js';
import {OperatorRepository} from './repository.js';
import {BackendUnavailableError} from './configuration.js';

export const messages = Object.freeze({
  unavailable:'Il servizio di accesso non è disponibile. Riprova tra poco.',
  expired:'La sessione è scaduta. Accedi nuovamente.',
  credentials:'Email o password non corrette, oppure accesso non abilitato.',
  link:'Il link non è valido o è scaduto. Richiedi un nuovo invito o recupera la password.',
  password:'Usa una password di almeno 12 caratteri.',
  recovery:'Se l’indirizzo è associato a un account abilitato, riceverai le istruzioni per recuperare la password.',
  update:'Non è stato possibile aggiornare la password. Accedi di nuovo oppure richiedi un nuovo link di recupero.'
});
const safeError = key => new Error(messages[key]);
const isExpired = error => [401,403].includes(error?.status) || ['session_not_found','refresh_token_not_found','refresh_token_already_used','user_banned'].includes(error?.code);

export {passwordRedirect} from './auth-urls.js';
import {passwordRedirect} from './auth-urls.js';
// Read once, then scrub the URL before loading the SDK or doing any network work.
// Callback credentials remain in memory only and are never logged or rendered.
export function consumeCallback(location, history) {
  const url = new URL(location.href), hash = new URLSearchParams(url.hash.slice(1));
  history.replaceState(null, '', url.pathname);
  if (url.searchParams.has('error') || hash.has('error')) return {kind:'invalid'};
  const code = url.searchParams.get('code');
  const access = hash.get('access_token'), refresh = hash.get('refresh_token'), type = hash.get('type');
  if (code && !access && !refresh) return {kind:'pkce',code};
  if (!code && access && refresh && ['invite','recovery'].includes(type)) return {kind:'implicit',access,refresh};
  if (url.search || url.hash) return {kind:'invalid'};
  return {kind:'none'};
}

export class SupabaseSession extends OperatorSession {
  constructor(client, redirect) { super(); this.client=client; this.redirect=redirect; }
  async current() {
    let result;
    try { result=await this.client.auth.getSession(); } catch { throw safeError('unavailable'); }
    if (result.error) {
      if (isExpired(result.error)) { await this.client.auth.signOut({scope:'local'}); return null; }
      throw safeError('unavailable');
    }
    if (!result.data?.session) return null;
    let verified;
    try { verified=await this.client.auth.getUser(); } catch { throw safeError('unavailable'); }
    if (verified.error) {
      if (isExpired(verified.error)) { await this.client.auth.signOut({scope:'local'}); return null; }
      throw safeError('unavailable');
    }
    if (!verified.data?.user) return null;
    return {userId:verified.data.user.id, email:verified.data.user.email || '', provider:'supabase'};
  }
  async context() {
    if (!await this.current()) throw safeError('expired');
    try {
      const {data,error}=await this.client.schema('hub_api').rpc('current_context');
      if (error) throw safeError('unavailable');
      // Null includes absent or disabled application profiles: never infer a role.
      return data;
    } catch { throw safeError('unavailable'); }
  }
  async login(email,password) {
    try {
      const {error}=await this.client.auth.signInWithPassword({email:email.trim(),password});
      if(error) throw safeError('credentials');
    } catch { throw safeError('credentials'); }
    const session=await this.current();
    if (!session) throw safeError('credentials');
    return session;
  }
  async logout() {
    // Revoke this device's refresh token; SDK also clears persistent storage.
    try { const {error}=await this.client.auth.signOut({scope:'local'}); if(error) throw error; }
    catch { throw safeError('unavailable'); }
  }
  async recoverPassword(email) {
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw Error('Inserisci un indirizzo email valido.');
    try {
      const {error}=await this.client.auth.resetPasswordForEmail(email.trim(),{redirectTo:this.redirect});
      if (error && (error.status===429 || error.status>=500)) throw safeError('unavailable');
      // Same response for nonexistent, disabled and eligible accounts.
      return messages.recovery;
    } catch { throw safeError('unavailable'); }
  }
  async acceptCallback(callback) {
    if(callback.kind==='none') return this.current();
    if(callback.kind==='invalid') throw safeError('link');
    try {
      let result;
      if(callback.kind==='pkce') result=await this.client.auth.exchangeCodeForSession(callback.code);
      else if(callback.kind==='implicit') result=await this.client.auth.setSession({access_token:callback.access,refresh_token:callback.refresh});
      else throw safeError('link');
      if(result.error) throw safeError('link');
      const session=await this.current();
      if(!session) throw safeError('link');
      return session;
    } catch {
      await this.client.auth.signOut({scope:'local'}).catch(()=>{});
      throw safeError('link');
    } finally {
      delete callback.code; delete callback.access; delete callback.refresh;
    }
  }
  async changePassword(password,currentPassword) {
    if(typeof password!=='string'||password.length<12) throw safeError('password');
    if(!await this.current()) throw safeError('expired');
    const fields={password};
    if(currentPassword) fields.current_password=currentPassword;
    try { const {error}=await this.client.auth.updateUser(fields); if(error) throw error; }
    catch { throw safeError('update'); }
  }
  onChange(listener) {
    // No awaited Supabase call inside SDK auth callbacks (avoids lock deadlocks).
    const {data}=this.client.auth.onAuthStateChange(event=>{setTimeout(()=>listener(event),0);});
    return ()=>data.subscription.unsubscribe();
  }
}

export async function createSupabaseSession(config, {location=globalThis.location, loadClient=()=>import('./vendor/supabase.js')}={}) {
  if(!config.supabase.url || !config.supabase.publishableKey) throw new BackendUnavailableError();
  const redirect=passwordRedirect(location);
  const {createClient}=await loadClient();
  const client=createClient(config.supabase.url,config.supabase.publishableKey,{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,flowType:'pkce',storageKey:'cilentomania-dev-auth-v1'},
    db:{schema:'hub_api'}
  });
  return new SupabaseSession(client,redirect);
}

export async function connectAuthStage(config) {
  const auth=await createSupabaseSession(config);
  // The real user has no implicit access to the demo's organizations. Leave the
  // content backend configured as demo, but do not initialize/map its identity.
  return Object.freeze({kind:'auth-only',auth,repo:new OperatorRepository(),capabilities:{authOnly:true,demoSimulation:false}});
}
