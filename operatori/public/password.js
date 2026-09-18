import {consumeCallback,createSupabaseSession,messages} from '../js/supabase-auth.js';
import {loadConfiguration} from './configuration.js';
import {accessShell,busy,status,passwordForm} from '../js/auth-ui.js';
const callback=consumeCallback(location,history),root=document.querySelector('#app');
async function start(){
 if(callback.kind==='invalid')throw Error(messages.link);
 const auth=await createSupabaseSession(await loadConfiguration());
 if(callback.kind==='none'){
   if(!await auth.current())throw Error('Accedi oppure apri il link ricevuto via email per impostare la password.');
   passwordForm(root,auth,false);return;
 }
 accessShell(root,'Imposta la tua password','<p>Continua per verificare il link di invito o recupero.</p>','<button class="primary" type="submit">Continua</button>');
 root.querySelector('form').onsubmit=e=>{e.preventDefault();busy(root,async()=>{
   try{await auth.acceptCallback(callback);passwordForm(root,auth,true);}
   catch{root.querySelector('form').onsubmit=event=>event.preventDefault();root.querySelector('button').remove();status(root,messages.link);}
 });};
}
start().catch(error=>{root.innerHTML='<section class="panel"><h1>Accesso non disponibile</h1><p role="status" class="status"></p><a class="button" href="./">Torna all’accesso</a><p><a href="../">← Torna a Cilentomania HUB</a></p></section>';status(root,error.message);})
.finally(()=>{if(!root.querySelector('form')){delete callback.code;delete callback.access;delete callback.refresh;}});
