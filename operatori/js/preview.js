import {connect} from './demo-repository.js';import {current,adminSession} from './demo-session.js';import {mediaUrl,release} from './media.js';
const root=document.querySelector('#preview');
async function start(){
 const params=new URLSearchParams(location.search),admin=params.get('admin')==='1',session=admin?adminSession():current();const {repo,records}=await connect();
 const p=await repo.get(session,params.get('scheda'));const revision=admin&&params.get('invio')?p.revisions.find(r=>r.id===params.get('invio')):p.workingRevision;if(!revision)throw Error('Invio non trovato.');
 const back=admin?'operatori/admin.html':'operatori/?scheda='+encodeURIComponent(p.id);document.querySelector('#preview-back').href=back;
 await CilentomaniaI18n.init();await CilentomaniaI18n.setLanguage('it',{persist:false});
 const normalized=OperatorProfileModel.normalize({territoryContent:records.find(r=>r.id===p.sourceId)?.territoryContent,...revision.content,id:p.id,demo:true,editorialStatus:'draft',photosIllustrative:true}).publicProfile;
 const media=[...revision.media].sort((a,b)=>a.order-b.order),cover=media.find(m=>m.kind==='cover'),photos=[...(cover?[cover]:[]),...media.filter(m=>m.kind==='gallery')];
 const urls=[];normalized.photos=photos.map(m=>{const u=mediaUrl(m);urls.push(u);return u;});const logo=media.find(m=>m.kind==='logo');if(logo){normalized.logo=mediaUrl(logo);urls.push(normalized.logo);}
 const data=await fetch('data/comuni.json').then(r=>r.json()),towns=Array.isArray(data.municipalities)?data.municipalities:data.municipalities.value;
 const slug=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');const municipality=towns.find(name=>slug(name)===normalized.municipalityId)||'Comune non specificato';
 root.innerHTML=OperatorProfile.render(normalized,{municipality,navigationState:{},catalog:[]});OperatorProfile.bind(root.querySelector('.operator-profile'),normalized,{municipality});root.querySelector('[data-action="back-to-module-list"]').onclick=()=>location.href=back;
 const large=root.querySelector('[data-op-large]');const applyAlt=()=>{const i=normalized.photos.indexOf(large.src);if(i>=0){large.alt=photos[i].alt||'';root.querySelector('[data-op-caption]').textContent=photos[i].caption||photos[i].alt||'';}};large.addEventListener('load',applyAlt);
 const hero=root.querySelector('.op-hero-background');if(hero&&cover)hero.alt=cover.alt||'';window.addEventListener('pagehide',()=>release(urls),{once:true});
}start().catch(err=>{root.textContent=err.message;});
