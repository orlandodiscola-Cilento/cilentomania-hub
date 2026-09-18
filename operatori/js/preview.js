import {renderRestaurant} from './restaurant-preview.js';
import {getBackend,showBackendError} from './backend.js';import {mediaUrl,release} from './media.js';
const root=document.querySelector('#preview');
async function start(){
 const params=new URLSearchParams(location.search),admin=params.get('admin')==='1';const {repo,auth}=await getBackend();if(repo.online)document.querySelector('.preview-bar strong').textContent='Anteprima della bozza · Non pubblicata';const session=await auth.current({area:admin?'admin':'operator'});
 const p=await repo.get(session,params.get('scheda'));const revision=admin&&params.get('invio')?p.revisions.find(r=>r.id===params.get('invio')):p.workingRevision;if(!revision)throw Error('Invio non trovato.');
 const back=admin?'operatori/admin.html':'operatori/?scheda='+encodeURIComponent(p.id)+'&sezione='+encodeURIComponent(params.get('sezione')||'informazioni');document.querySelector('#preview-back').href=back;
 await CilentomaniaI18n.init();await CilentomaniaI18n.setLanguage('it',{persist:false});
 const context=await repo.previewContext(session,p.id);
 if(p.type==='restaurant') {
  const media=[...revision.media].sort((a,b)=>a.order-b.order).map(m=>({...m,url:mediaUrl(m)}));
  const data=await fetch('data/comuni.json').then(r=>r.json()),towns=Array.isArray(data.municipalities)?data.municipalities:data.municipalities.value;
  const slug=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  renderRestaurant(root,revision.content,media,towns.find(t=>slug(t)===revision.content.comune_id)||'Comune non specificato',back,{demo:context.isDemo===true});
  window.addEventListener('pagehide',()=>release(media.map(m=>m.url)),{once:true});return;
 }
 const normalized=OperatorProfileModel.normalize({territoryContent:context.territoryContent,...revision.content,id:p.id,demo:context.isDemo,editorialStatus:'draft',photosIllustrative:context.photosIllustrative}).publicProfile;
 const media=[...revision.media].sort((a,b)=>a.order-b.order),cover=media.find(m=>m.kind==='cover'),photos=[...(cover?[cover]:[]),...media.filter(m=>m.kind==='gallery')];
 const urls=[];normalized.photos=photos.map(m=>{const u=mediaUrl(m);urls.push(u);return u;});const logo=media.find(m=>m.kind==='logo');if(logo){normalized.logo=mediaUrl(logo);urls.push(normalized.logo);}
 const data=await fetch('data/comuni.json').then(r=>r.json()),towns=Array.isArray(data.municipalities)?data.municipalities:data.municipalities.value;
 const slug=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');const municipality=towns.find(name=>slug(name)===normalized.municipalityId)||'Comune non specificato';
 root.innerHTML=OperatorProfile.render(normalized,{municipality,navigationState:{},catalog:[]});OperatorProfile.bind(root.querySelector('.operator-profile'),normalized,{municipality});root.querySelector('[data-action="back-to-module-list"]').onclick=()=>location.href=back;
 const large=root.querySelector('[data-op-large]');const applyAlt=()=>{const i=normalized.photos.indexOf(large.src);if(i>=0){large.alt=photos[i].alt||'';root.querySelector('[data-op-caption]').textContent=photos[i].caption||photos[i].alt||'';}};large.addEventListener('load',applyAlt);
 const hero=root.querySelector('.op-hero-background');if(hero&&cover){hero.alt=cover.alt||'';hero.style.objectPosition=`${cover.focalX??50}% ${cover.focalY??50}%`;}window.addEventListener('pagehide',()=>release(urls),{once:true});
}start().catch(()=>showBackendError(root));
