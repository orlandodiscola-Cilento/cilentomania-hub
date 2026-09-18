import {mountAuth} from './auth-ui.js';
import {openEditor} from './editor.js';
import {contentType} from './content-types.js';
import {labels} from './workflow.js';
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function mountOnline(root,{auth,repo}, {publicArea=false}={}) {
 let current;
 const dashboard=async session=>{
  current=session||current;
  const context=await repo.context(current),items=await repo.list(current);
  root.innerHTML=`<div class="row"><div><p class="eyebrow">Area Operatori</p><h1>Le mie schede</h1><p>${escape(context.organizations.map(o=>o.name).join(' · '))}</p></div><button id="logout">Esci</button></div><p><a href="../">← Torna a Cilentomania HUB</a></p>${['cilentomania_admin','cilentomania_editor'].includes(context.user.role)?'<button id="review-online">Revisioni Cilentomania</button>':''}<div class="cards">${items.map(p=>`<article class="panel"><p class="eyebrow">${escape(contentType(p.type).label)}</p><h2>${escape(p.workingRevision.content.nome||'Scheda da completare')}</h2><p>${escape(labels[p.workingRevision.status])}</p><button class="primary" data-edit="${escape(p.id)}">Modifica scheda</button></article>`).join('')||'<section class="panel"><h2>Nessuna scheda associata</h2><p>L’accesso è attivo. Le attività assegnate da Cilentomania compariranno qui.</p></section>'}</div><p role="status" class="status"></p>`;
  if(root.querySelector('#review-online'))root.querySelector('#review-online').onclick=async()=>{const {mountReview}=await import('./online-review.js');await mountReview(root,repo,current,()=>dashboard(current));};
  root.querySelector('#logout').onclick=async()=>{try{await auth.logout();}catch{root.querySelector('[role=status]').textContent='Uscita non riuscita. Riprova.';}};
  const edit=async id=>{try{await openEditor({root,repo,session:current,id,back:()=>dashboard(current)});}catch{root.replaceChildren();const p=document.createElement('p');p.textContent='Scheda non disponibile. Ricarica la pagina per riprovare.';root.append(p);}};
  root.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>edit(b.dataset.edit));
  const id=new URLSearchParams(location.search).get('scheda');if(id)await edit(id);
 };
 await mountAuth(root,auth,dashboard);
 document.querySelector('.demo-banner').textContent=publicArea?'Area riservata · Le modifiche restano private fino alla pubblicazione.':'Ambiente DEV · Dati online della propria organizzazione.';
}
