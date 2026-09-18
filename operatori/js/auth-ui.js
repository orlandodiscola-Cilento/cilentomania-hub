// Templates below are constant. User/server content is inserted with textContent.
const field=(name,label,type,autocomplete)=>`<label class="field">${label}<input name="${name}" type="${type}" autocomplete="${autocomplete}" required></label>`;
const back='<p><a href="../">← Torna a Cilentomania HUB</a></p>';
export function accessShell(root,title,fields,buttons) {
  root.innerHTML=`<section class="panel login"><div class="welcome"><h1>La tua attività,<br>al centro del Cilento.</h1><p>Uno spazio semplice per raccontare la tua attività e tenere aggiornate le tue schede su Cilentomania.</p></div><form><p class="eyebrow">Area Operatori</p><h2></h2>${back}${fields}${buttons}<p role="status" class="status" aria-live="polite"></p></form></section>`;
  root.querySelector('h2').textContent=title;
}
export const status=(root,text)=>{root.querySelector('[role=status]').textContent=text;};
export async function busy(root,action) {
  const controls=[...root.querySelectorAll('button')];
  controls.forEach(b=>b.disabled=true);
  try {await action();} catch(error) {if(root.querySelector('[role=status]')) status(root,error.message);}
  finally {controls.forEach(b=>b.disabled=false);}
}
export async function mountAuth(root,auth,onAuthenticated) {
  document.querySelector('.demo-banner').textContent='Ambiente di sviluppo · Accesso riservato agli operatori invitati. Gestione delle schede non ancora collegata.';
  let rendering=0;
  function login(message='') {
    accessShell(root,'Benvenuto',field('email','Email','email','username')+field('password','Password','password','current-password'),'<button class="primary" type="submit">Accedi</button><button class="text-button" type="button" id="recover">Recupera password</button>');
    status(root,message);
    root.querySelector('form').onsubmit=e=>{e.preventDefault();busy(root,async()=>{const f=new FormData(e.target);await auth.login(f.get('email'),f.get('password'));e.target.reset();await render();});};
    root.querySelector('#recover').onclick=()=>busy(root,async()=>status(root,await auth.recoverPassword(root.querySelector('[name=email]').value)));
  }
  async function render() {
    const turn=++rendering;
    try {
      const session=await auth.current();
      if(turn!==rendering)return;
      if(!session){login();return;}
      root.innerHTML='<section class="panel"><h1>Il tuo spazio Cilentomania</h1><p id="identity"></p><p role="status" class="status"></p><div class="actions"><a class="button" href="password.html">Cambia password</a><button id="logout">Esci</button></div>'+back+'</section>';
      root.querySelector('#identity').textContent=session.email;
      root.querySelector('#logout').onclick=()=>busy(root,async()=>{await auth.logout();login('Hai effettuato l’uscita.');});
      // Keep logout available if the API schema is not yet exposed/configured.
      try {
        const context=await auth.context();
        if(turn!==rendering)return;
        if(context&&onAuthenticated){await onAuthenticated(session);return;}
        status(root,context?'Accesso verificato. La gestione online delle tue schede sarà disponibile nel prossimo passaggio.':'L’account non è ancora abilitato all’Area Operatori oppure è stato sospeso. Contatta Cilentomania.');
      } catch {if(turn===rendering)status(root,'Non è possibile verificare l’abilitazione. Le schede rimangono inaccessibili. Puoi uscire e riprovare più tardi.');}
    } catch {if(turn===rendering)login('Impossibile verificare la sessione. Controlla la connessione e riprova.');}
  }
  const unsubscribe=auth.onChange(event=>{
    if(event==='SIGNED_OUT'){++rendering;login('La sessione è terminata. Accedi nuovamente.');}
    if(!onAuthenticated&&(event==='TOKEN_REFRESHED'||event==='SIGNED_IN'))void render();
  });
  window.addEventListener('pagehide',unsubscribe,{once:true});
  window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
  await render();
}
export function passwordForm(root,auth,fromLink) {
  const current=fromLink?'':field('current','Password attuale','password','current-password');
  accessShell(root,fromLink?'Imposta la tua password':'Cambia password',current+field('password','Nuova password (almeno 12 caratteri)','password','new-password')+field('confirm','Ripeti la nuova password','password','new-password'),'<button class="primary" type="submit">Salva password</button><a class="button" href="./">Torna all’accesso</a>');
  root.querySelector('[name=password]').minLength=12;
  root.querySelector('form').onsubmit=e=>{e.preventDefault();busy(root,async()=>{
    const f=new FormData(e.target);
    if(f.get('password')!==f.get('confirm'))throw Error('Le due password non coincidono.');
    await auth.changePassword(f.get('password'),f.get('current'));
    e.target.reset();
    // Password is already changed even if network logout fails. Never encourage
    // repeating the update when only the final sign-out encountered a problem.
    root.innerHTML='<section class="panel"><h1>Password aggiornata</h1><p role="status" class="status"></p><a class="button primary" href="./">Torna all’accesso</a></section>';
    try {await auth.logout();status(root,'La password è stata salvata. Accedi con la nuova password.');}
    catch {status(root,'La password è stata salvata, ma non è stato possibile completare l’uscita. Torna all’accesso e riprova a uscire.');}
  });};
}
