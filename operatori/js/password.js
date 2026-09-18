import {consumeCallback,createSupabaseSession,messages} from './supabase-auth.js';
import {loadConfiguration} from './configuration.js';
import {accessShell,busy,status,passwordForm} from './auth-ui.js';

const callback=consumeCallback(window.location,window.history);
const root=document.querySelector('#app');
async function start() {
  const config=await loadConfiguration();
  if(config.auth!=='supabase') {
    root.innerHTML='<section class="panel"><h1>Imposta la tua password</h1><p>La gestione delle password reali non è ancora attiva. La demo non richiede né salva password reali.</p><a class="button" href="./">Torna all’Area Operatori</a><p><a href="../">← Torna a Cilentomania HUB</a></p></section>';
    return;
  }
  document.querySelector('.demo-banner').textContent='Ambiente di sviluppo · Accesso riservato';
  if(callback.kind==='invalid')throw Error(messages.link);
  const auth=await createSupabaseSession(config);
  if(callback.kind==='none') {
    if(!await auth.current())throw Error('Accedi oppure apri il link ricevuto via email per impostare la password.');
    passwordForm(root,auth,false);
    return;
  }
  // Explicit confirmation avoids consuming invitation/recovery on page preload.
  accessShell(root,'Imposta la tua password','<p>Continua per verificare il link di invito o recupero. Non inserire la password di un altro servizio.</p>','<button class="primary" type="submit">Continua</button>');
  root.querySelector('form').onsubmit=e=>{e.preventDefault();busy(root,async()=>{
    try {await auth.acceptCallback(callback);passwordForm(root,auth,true);}
    catch {root.querySelector('form').onsubmit=event=>event.preventDefault();root.querySelector('button').remove();status(root,messages.link);}
  });};
}
start().catch(error=>{
  root.innerHTML='<section class="panel"><h1>Accesso non disponibile</h1><p role="status" class="status"></p><a class="button" href="./">Torna all’accesso</a></section>';
  status(root,error.message);
}).finally(()=>{
  // Demo/error paths must not retain unused callback credentials in memory.
  if(!root.querySelector('form')){delete callback.code;delete callback.access;delete callback.refresh;}
});
