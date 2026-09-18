import {validatePhoto,preparePhoto} from './media.js';
import {OperatorRepository} from './repository.js';
import {contentType} from './content-types.js';
import {validatePatch} from './model.js';
const common={nome:'name',categoria:'category',claim:'claim',descrizione_breve:'short_description',descrizione_completa:'description',localita:'locality',indirizzo:'address',latitudine:'latitude',longitudine:'longitude',telefono:'phone',whatsapp:'whatsapp',email:'email',sito_web:'website',facebook:'facebook',instagram:'instagram',url_prenotazione:'booking_url'};
const shared={periodo_apertura:'opening_period',animali_ammessi:'pets',accessibile:'accessible',adatto_famiglie:'family_friendly',aperto_tutto_anno:'open_all_year'};
const features={accommodation:{...shared,numero_camere:'rooms',posti_letto:'beds',check_in:'check_in',check_out:'check_out',tipologie_camere:'room_types',trattamenti_disponibili:'board_options',ideale_per:'ideal_for'},restaurant:{...shared,tipo_cucina:'cuisine',specialita:'specialties',coperti_interni:'indoor_seats',coperti_esterni:'outdoor_seats',orari_apertura:'opening_hours',giorni_chiusura:'closed_days',menu_url:'menu_url',prenotazione_consigliata:'reservation_recommended'}};
const unavailable=()=>new Error('Non è possibile completare l’operazione online. Nessun salvataggio locale è stato effettuato.');
function failure(error){
 if(/version_conflict/.test(error?.message||''))return new Error('La scheda è cambiata. Riaprila prima di salvare.');
 if(/not_authorized|permission denied/.test(error?.message||''))return new Error('Non hai accesso a questa scheda oppure l’account è stato disabilitato.');
 if(/not_current_draft|revision_pending/.test(error?.message||''))return new Error('La scheda è in revisione. Attendi l’esito di Cilentomania.');
 return unavailable();
}
export function mapRevision(row,type,towns=[]) {
 if(!row)return null;
 const content={};
 for(const [key,,kind] of Object.values(contentType(type).sections).flat()) {
  const value=common[key]?row[common[key]]:features[type][key]?row[type]?.[features[type][key]]:null;
  content[key]=value??(['number','coordinate','tri'].includes(kind)?null:kind==='list'?[]:'');
  if(kind==='time'&&content[key])content[key]=content[key].slice(0,5);
 }
 if(row.municipality_id&&!towns.some(t=>t.id===row.municipality_id))throw Error('Comune non disponibile: ricarica il catalogo prima di modificare la scheda.');
 content.comune_id=towns.find(t=>t.id===row.municipality_id)?.slug||'';
 content.serviceCodes=(row.amenities||[]).filter(a=>a.available===true).map(a=>a.code);
 return {id:row.id,status:row.status,version:row.version,updatedAt:row.updated_at,content,media:(row.media||[]).map(m=>({id:m.id,kind:m.role,order:m.position,caption:m.caption||'',alt:m.alt||'',storagePath:m.storagePath,focalX:m.focalX??50,focalY:m.focalY??50,source:'',blob:null})),feedback:row.feedback||'',isDemo:row.is_demo===true};
}
export function draftPatch(content,type,towns,previous) {
 validatePatch(content,undefined,type);
 const patch={content:{},[type]:{}};
 for(const [key,value] of Object.entries(content)) {
  const target=common[key];if(target)patch.content[target]=value===''?null:value;
  if(features[type][key])patch[type][features[type][key]]=value===''?null:value;
 }
 if('nome' in content)patch.content.name=content.nome;
 if('comune_id' in content){const town=towns.find(t=>t.slug===content.comune_id);if(content.comune_id&&!town)throw Error('Il Comune non è ancora disponibile nel catalogo online.');patch.content.municipality_id=town?.id||null;}
 if('serviceCodes' in content)patch.amenities=[...content.serviceCodes.map(code=>({code,available:true})),...(previous?.amenities||[]).filter(a=>a.available!==true&&!content.serviceCodes.includes(a.code))];
 for(const key of ['website','facebook','instagram','booking_url'])if(patch.content[key]&&!patch.content[key].startsWith('https://'))throw Error('Per i collegamenti online usa un indirizzo https.');
 return patch;
}
export class SupabaseRepository extends OperatorRepository {
 constructor(auth){super();this.auth=auth;this.client=auth.client;this.online=true;this.uploads=new Map();}
 async rpc(name,args={}){let result;try{result=await this.client.schema('hub_api').rpc(name,args);}catch{throw unavailable();}if(result.error)throw failure(result.error);return result.data;}
 async context(){const c=await this.rpc('current_context');if(!c)throw Error('Account non abilitato. Contatta Cilentomania.');return {user:{id:c.user.id,name:c.user.displayName,role:c.staffRole||'operator'},organizations:c.organizations};}
 async photoCapabilities(){try{return await this.rpc('media_capabilities');}catch{return {upload:false,focal:false};}}
 async municipalities(){return this.rpc('list_municipalities');}
 async map(row,towns){
  const p={id:row.id,type:row.type,organizationId:row.organization_id,version:row.version,publicationStatus:row.publication_status==='unpublished'?'draft':row.publication_status,publicPageId:null,workingRevision:mapRevision(row.workingRevision,row.type,towns),publishedVersion:mapRevision(row.publishedVersion,row.type,towns),revisions:[]};
  p.workingRevision ||= {id:null,status:'draft',version:null,content:Object.fromEntries(Object.values(contentType(row.type).sections).flat().map(([key,,kind])=>[key,['number','coordinate','tri'].includes(kind)?null:kind==='list'?[]:''])),media:[],updatedAt:null};
  p.workingRevision.content.serviceCodes ||= [];
  for(const revision of [p.workingRevision,p.publishedVersion].filter(Boolean))for(const media of revision.media){
   const {data,error}=await this.client.storage.from('listing-drafts').createSignedUrl(media.storagePath,300);
   if(error||!data?.signedUrl)throw unavailable();media.remoteUrl=data.signedUrl;
  }
  return p;
 }
 async get(session,id){await this.context();const row=await this.rpc('get_listing',{lid:id});return this.map(row,await this.municipalities());}
 async list(session){await this.context();const result=[];let offset=0;for(;;){const rows=await this.rpc('list_listings',{page_size:30,page_offset:offset});for(const r of rows)result.push(await this.get(session,r.id));if(rows.length<30)return result;offset+=rows.length;}}
 async save(session,args){
  await this.context();let row=await this.rpc('get_listing',{lid:args.id});
  if(row.version!==args.version||(row.workingRevision?.id??null)!==(args.revisionId??null)||(row.workingRevision?.version??null)!==(args.revisionVersion??null))throw Error('La scheda è cambiata. Riaprila prima di salvare.');
  if(args.media.length>40||args.media.filter(m=>m.kind==='cover').length>1||args.media.filter(m=>m.kind==='logo').length>1)throw Error('Usa fino a 40 foto, una copertina e un logo.');
  const capabilities=await this.photoCapabilities();
  const pending=args.media.filter(m=>m.blob);
  if(pending.length&&!capabilities.upload)throw Error('Il caricamento foto online è in attesa dell’attivazione sul DEV.');
  for(const m of args.media){
   if(m.source)throw Error('Le immagini demo non possono essere importate automaticamente.');
   if(!['logo','cover','gallery'].includes(m.kind))throw Error('Utilizzo foto non valido.');
   for(const k of ['focalX','focalY'])if(m[k]!==undefined&&(!Number.isFinite(m[k])||m[k]<0||m[k]>100))throw Error('Inquadratura non valida.');
  }
  for(const m of pending)await validatePhoto(m.blob);
  const towns=await this.municipalities();
  const patch=draftPatch(args.patch,row.type,towns,row.workingRevision);
  const mediaPatch=m=>({id:m.id,role:m.kind,caption:m.caption,alt:m.alt,...(capabilities.focal?{focal_x:m.focalX??50,focal_y:m.focalY??50}:{})});
  const save=patch=>this.rpc('save_listing_draft',{lid:args.id,expected_listing_version:row.version,expected_revision_id:row.workingRevision?.id??null,expected_revision_version:row.workingRevision?.version??null,patch});
  patch.media=args.media.filter(m=>!m.blob).map(mediaPatch);
  row=await save(patch);
  if(pending.length){
   try{
    const uploaded=[];
    for(const m of args.media){
     if(!m.blob){uploaded.push(mediaPatch(m));continue;}
     const key=args.id+':'+row.workingRevision.id+':'+m.id;
     let upload=this.uploads.get(key);
     if(!upload){const registered=await this.rpc('register_media',{rid:row.workingRevision.id,expected_version:row.workingRevision.version,mime_type:m.blob.type,file_bytes:m.blob.size});upload={...registered,blob:m.blob,done:false};this.uploads.set(key,upload);}
     if(upload.blob!==m.blob)throw Error('La foto è cambiata. Aggiungila nuovamente.');
     if(!upload.done){const {error}=await this.client.storage.from(upload.bucket).upload(upload.path,m.blob,{contentType:m.blob.type,upsert:false});if(error&&String(error.statusCode)!=='409')throw unavailable();upload.done=true;}
     if(!upload.candidateDone){upload.candidate ||= await preparePhoto(m.blob);const {error}=await this.client.storage.from(upload.bucket).upload(upload.path.replace('/original','/candidate'),upload.candidate,{contentType:'image/webp',upsert:false});if(error&&String(error.statusCode)!=='409')throw unavailable();upload.candidateDone=true;}
     uploaded.push(mediaPatch({...m,id:upload.id}));
    }
    row=await save({media:uploaded});
   }catch{
    const error=new Error('I testi sono salvati online, ma le foto non sono tutte salvate. Mantieni aperta la pagina e premi di nuovo Salva bozza.');
    error.updatedProfile=await this.map(row,towns);throw error;
   }
  }
  return this.map(row,towns);
 }
 async submit(session,args){await this.context();await this.rpc('submit_revision',{rid:args.revisionId,expected_version:args.revisionVersion});return this.get(session,args.id);}
 async previewContext(session,id){const p=await this.get(session,id);return {territoryContent:[],isDemo:p.workingRevision.isDemo,photosIllustrative:false};}
 async prepareMedia(session,id){
  const p=await this.get(session,id);for(const media of p.workingRevision.media){
   const {data,error}=await this.client.functions.invoke('process-listing-photo',{body:{mediaId:media.id}});
   if(error||data?.status!=='ready')throw Error('Una foto non è pronta per la pubblicazione. Riprova; se è troppo grande, richiedi la sostituzione della foto.');
  }return this.get(session,id);
 }
 async publish(session,{id,revisionId}){const p=await this.get(session,id);if(p.workingRevision.id!==revisionId)throw Error('La scheda è cambiata. Riapri il riepilogo.');await this.prepareMedia(session,id);return this.rpc('publish_revision',{lid:id,rid:revisionId,expected_version:p.version});}
 async suspend(session,{id}){const p=await this.get(session,id);return this.rpc('suspend_listing',{lid:id,expected_version:p.version});}
 async queue(){await this.context();const rows=await this.rpc('review_queue');for(const r of rows){const l=await this.rpc('get_listing',{lid:r.listingId});r.isCurrent=l.working_revision_id===r.id;r.isPublished=l.published_revision_id===r.id&&l.publication_status==='published';}return rows;}
 async compare(session,lid,rid){await this.context();return this.rpc('compare_revision',{lid,rid});}
 async review(session,args){await this.context();return this.rpc('review_revision',{rid:args.revisionId,expected_version:args.revisionVersion,target:args.target,feedback:args.feedback||null});}
}
