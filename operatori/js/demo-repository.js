import {OperatorRepository} from './repository.js';
import {actor,authorize,canSee} from './permissions.js';
import {validatePatch,validateMedia,upgradeDemo} from './model.js';
import {transition} from './workflow.js';
export function operation(state,session,action,args={},codes=[]) {
 const user=actor(state,session);
 if(action==='context')return {user:{id:user.id,name:user.name,role:user.role},organizations:state.organizations.filter(o=>user.role==='admin'||state.memberships.some(m=>m.userId===user.id&&m.organizationId===o.id)).map(o=>({id:o.id,name:o.name}))};
 if(action==='list')return state.profiles.filter(p=>canSee(state,session,p));
 if(action==='queue'){
  if(user.role!=='admin')throw Error('Accesso riservato a Cilentomania.');
  return state.profiles.flatMap(p=>p.revisions.map(r=>({...r,profileId:p.id,organization:state.organizations.find(o=>o.id===p.organizationId)?.name,name:r.content.nome,version:p.version})));
 }
 const p=state.profiles.find(p=>p.id===args.id);if(!p)throw Error('Scheda non trovata.');authorize(state,session,p,['review','simulate'].includes(action));
 if(action==='get')return p;
 if(p.version!==args.version)throw Error('La scheda è cambiata in un’altra finestra. Riaprila prima di salvare.');
 const now=new Date().toISOString();
 if(action==='save') {
  if(!['draft','changes_requested','approved','published'].includes(p.workingRevision.status))throw Error('Attendi la revisione di Cilentomania prima di modificare.');
  const content={...p.workingRevision.content,...validatePatch(args.patch,undefined,p.type)};
  const media=validateMedia(args.media);
  if(media.filter(m=>m.kind==='cover').length>1||media.filter(m=>m.kind==='logo').length>1)throw Error('Scegli una sola copertina e un solo logo.');
  const newId=p.workingRevision.status==='draft'?p.workingRevision.id:crypto.randomUUID();
  p.workingRevision={id:newId,status:'draft',content,media,updatedAt:now,feedback:'',modifiedBy:user.id};
 } else if(action==='submit') {
  if(!p.workingRevision.content.nome.trim()||!p.workingRevision.content.descrizione_breve.trim())throw Error('Completa nome e descrizione breve prima di inviare.');
  p.workingRevision.status=transition(p.workingRevision.status,'submitted',user.role);
  p.workingRevision.updatedAt=now;p.workingRevision.submittedBy=user.id;
  p.revisions.push(structuredClone(p.workingRevision));
 } else if(action==='review') {
  const r=p.revisions.find(r=>r.id===args.revisionId);if(!r)throw Error('Invio non trovato.');
  if(!['in_review','approved','changes_requested'].includes(args.target))throw Error('Azione non disponibile.');
  if(args.target==='changes_requested'&&!args.feedback?.trim())throw Error('Spiega quali modifiche sono necessarie.');
  r.status=transition(r.status,args.target,user.role);r.feedback=String(args.feedback||'');r.reviewedAt=now;r.reviewedBy=user.id;
  if(p.workingRevision.id===r.id)p.workingRevision=structuredClone(r);
 } else if(action==='simulate') {
  if(!['published','suspended'].includes(args.target))throw Error('Simulazione non valida.');
  if(args.target==='published'&&p.publicationStatus!=='suspended'){
   const r=p.revisions.find(r=>r.id===args.revisionId);if(!r)throw Error('Invio non trovato.');
   r.status=transition(r.status,'published',user.role);p.publishedVersion={content:structuredClone(r.content),media:structuredClone(r.media)};
   if(p.workingRevision.id===r.id)p.workingRevision.status='published';
  }else transition(p.publicationStatus,args.target,user.role);
  p.publicationStatus=args.target;
 }else throw Error('Operazione non disponibile.');
 p.version++;return p;
}
export class DemoRepository extends OperatorRepository {
 constructor(db,codes){super();this.db=db;this.codes=codes;}
 async run(session,action,args){return new Promise((resolve,reject)=>{
  const tx=this.db.transaction('workspace',['list','get','queue','context'].includes(action)?'readonly':'readwrite');const store=tx.objectStore('workspace');let result,error;
  tx.oncomplete=()=>resolve(structuredClone(result));tx.onerror=()=>reject(error||tx.error);tx.onabort=()=>reject(error||Error('Salvataggio non riuscito.'));
  store.get('state').onsuccess=e=>{try{const state=e.target.result;result=operation(state,session,action,args,this.codes);if(tx.mode==='readwrite')store.put(state,'state');}catch(err){error=err;tx.abort();}};
 });}
 context(s){return this.run(s,'context');}
 list(s){return this.run(s,'list');}get(s,id){return this.run(s,'get',{id});}save(s,args){return this.run(s,'save',args);}submit(s,args){return this.run(s,'submit',args);}review(s,args){return this.run(s,'review',args);}queue(s){return this.run(s,'queue');}simulate(s,args){return this.run(s,'simulate',args);}
}
export async function connect(){
 const [seed,records]=await Promise.all(['data/demo.json','../data/strutture-ricettive.json'].map(async url=>{const r=await fetch(new URL(url,new URL('../',import.meta.url)));if(!r.ok)throw Error('Impossibile caricare i dati demo.');return r.json();}));
 const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('cilentomania-operatori-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('workspace');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(Error('Il browser non consente il salvataggio locale.'));});
 await new Promise((resolve,reject)=>{const tx=db.transaction('workspace','readwrite'),store=tx.objectStore('workspace');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);store.get('state').onsuccess=e=>{store.put(upgradeDemo(e.target.result,seed,records),'state');};});
 return {repo:new DemoRepository(db,globalThis.OperatorProfileModel.SERVICE_CODES),seed,records};
}
