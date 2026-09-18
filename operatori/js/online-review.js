import {ask} from './dialog.js';
import {labels} from './workflow.js';
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function mountReview(root,repo,session,back) {
 const context=await repo.context(session);
 if(!['cilentomania_admin','cilentomania_editor'].includes(context.user.role))throw Error('Accesso riservato a Cilentomania.');
 const rows=await repo.queue(session);
 root.innerHTML=`<h1>Revisioni delle schede</h1><button id="back-online">← Le mie schede</button><p role="status" class="status"></p><div class="queue">${rows.map(r=>`<article class="panel"><h2>${e(r.name)}</h2><p>${e(r.organizationName)} · ${e(labels[r.status])}</p><div class="actions"><button data-compare="${e(r.id)}">Confronta</button>${r.status==='submitted'?`<button data-target="in_review" data-id="${e(r.id)}">Avvia revisione</button>`:''}${r.status==='in_review'?`<button data-target="approved" data-id="${e(r.id)}">Approva</button><button data-target="changes_requested" data-id="${e(r.id)}">Richiedi modifiche</button>`:''}</div><div data-comparison="${e(r.id)}"></div></article>`).join('')||'<p>Nessuna revisione disponibile.</p>'}</div><p class="footnote">L’approvazione non pubblica automaticamente la scheda.</p>`;
 root.querySelector('#back-online').onclick=back;
 const error=()=>root.querySelector('[role=status]').textContent='Operazione non riuscita. Riapri la coda e riprova.';
 root.querySelectorAll('[data-target]').forEach(b=>b.onclick=async()=>{
  b.disabled=true;
  try{const r=rows.find(r=>r.id===b.dataset.id);let feedback='';if(b.dataset.target==='changes_requested'){feedback=await ask('Quali modifiche sono necessarie?',{feedback:true});if(!feedback)return;}
   await repo.review(session,{revisionId:r.id,revisionVersion:r.version,target:b.dataset.target,feedback});await mountReview(root,repo,session,back);
  }catch{error();}finally{b.disabled=false;}
 });
 root.querySelectorAll('[data-compare]').forEach(b=>b.onclick=async()=>{try{
  const r=rows.find(r=>r.id===b.dataset.compare),comparison=await repo.compare(session,r.listingId,r.id);
  const host=[...root.querySelectorAll('[data-comparison]')].find(el=>el.dataset.comparison===r.id);
  // Render data as text, never interpret operator-authored HTML.
  host.replaceChildren();for(const [key,label] of [['published','Versione pubblicata'],['proposed','Modifiche proposte']]){const h=document.createElement('h3');h.textContent=label;const pre=document.createElement('pre');pre.style.whiteSpace='pre-wrap';pre.style.overflowWrap='anywhere';pre.textContent=JSON.stringify(comparison[key],null,2)||'Nessuna versione pubblicata';host.append(h,pre);}
 }catch{error();}});
}
