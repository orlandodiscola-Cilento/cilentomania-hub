import {contentType,emptyAdministration} from './content-types.js';
export const sections=contentType().sections;
export const editable=new Set(Object.values(sections).flat().map(f=>f[0]).concat('serviceCodes'));
export function validatePatch(patch,codes,type='accommodation') {
  const definition=contentType(type), sections=definition.sections;
  const editable=new Set(Object.values(sections).flat().map(f=>f[0]).concat('serviceCodes'));
  codes=Object.keys(definition.services).filter(code=>!codes||codes.includes(code));
  if(!patch||typeof patch!=='object'||Array.isArray(patch))throw Error('Dati non validi.');
  for(const [key,value] of Object.entries(patch)) {
    if(!editable.has(key))throw Error('Campo non modificabile: '+key);
    const field=Object.values(sections).flat().find(f=>f[0]===key),type=field?.[2];
    if(type==='tri'&&value!==null&&typeof value!=='boolean')throw Error('Scegli Sì, No o Non specificato.');
    if(['number','coordinate'].includes(type)&&value!==null&&(typeof value!=='number'||!Number.isFinite(value)||(type==='number'&&(!Number.isInteger(value)||value<0))))throw Error('Inserisci un numero valido.');
    if(type==='coordinate'&&value!==null&&Math.abs(value)>(key==='latitudine'?90:180))throw Error('Coordinate non valide.');
    if(type==='time'&&value&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(value))throw Error('Orario non valido.');
    if(key==='serviceCodes'&&(!Array.isArray(value)||value.some(v=>!codes.includes(v))))throw Error('Servizi non validi.');
    if(type==='list'&&(!Array.isArray(value)||value.some(v=>typeof v!=='string')))throw Error('Elenco non valido.');
    if(!['tri','number','coordinate','list'].includes(type)&&key!=='serviceCodes'&&typeof value!=='string')throw Error('Testo non valido.');
    if(type==='url'&&value){try{if(!['https:','http:'].includes(new URL(value).protocol))throw Error();}catch{throw Error('Usa un indirizzo web http o https.');}}
    if(type==='email'&&value&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))throw Error('Email non valida.');
  }
  return structuredClone(patch);
}
export function validateMedia(items) {
  if(!Array.isArray(items)||items.length>40)throw Error('Puoi inserire fino a 40 immagini.');
  const ids=new Set();
  return items.map((m,i)=>{
    if(!m||!m.id||ids.has(m.id)||!['logo','cover','gallery'].includes(m.kind))throw Error('Immagine non valida.');
    ids.add(m.id);
    for(const key of ['focalX','focalY'])if(m[key]!==undefined&&(typeof m[key]!=='number'||!Number.isFinite(m[key])||m[key]<0||m[key]>100))throw Error('Inquadratura non valida.');
    if(m.blob&&(!(m.blob instanceof Blob)||!['image/jpeg','image/png','image/webp'].includes(m.blob.type)||m.blob.size>5*1024*1024))throw Error('Usa JPG, PNG o WebP entro 5 MB.');
    if(m.source&&!/^(images|assets)\/[\w./-]+$/.test(m.source))throw Error('Percorso immagine non valido.');
    if(m.source?.includes('..'))throw Error('Percorso immagine non valido.');
    return {id:String(m.id),kind:m.kind,order:i,focalX:m.focalX??50,focalY:m.focalY??50,caption:String(m.caption||''),alt:String(m.alt||''),source:m.source||'',blob:m.blob||null};
  });
}
export function makeInitial(seed,records) {
  const state=structuredClone(seed);state.profiles=seed.profiles.map(p=>{
    const source=p.demoSource || records.find(r=>r.id===p.sourceId);if(!source)throw Error('Scheda demo non disponibile.');
    const fields=Object.values(contentType(p.type).sections).flat();
    const content=Object.fromEntries(fields.map(([key,,type])=>[key,source[key]??(['number','coordinate','tri'].includes(type)?null:type==='list'?[]:'')]));
    content.serviceCodes=source.serviceCodes||[];content.nome=p.name;
    const media=[...(source.logo?[{kind:'logo',source:source.logo}]:[]),{kind:'cover',source:source.immagine_copertina},...(source.galleria||[]).map(source=>({kind:'gallery',source}))].map((m,i)=>({...m,id:p.id+'-photo-'+i,order:i,caption:'Paesaggio illustrativo del Cilento',alt:'Paesaggio illustrativo del Cilento'}));
    const initial={content,media};
    return {...p,contentOwner:p.organizationId,publicPageId:p.publicPageId||null,version:0,administration:emptyAdministration(p.id),publishedVersion:p.publicationStatus==='published'?structuredClone(initial):null,workingRevision:{id:p.id+'-initial',status:'draft',...structuredClone(initial),updatedAt:null,feedback:''},revisions:[]};
  });return state;
}

// Add demo examples without overwriting any existing draft, review or photos.
export function upgradeDemo(state,seed,records) {
 if(!state)return makeInitial(seed,records);
 const result=structuredClone(state), initial=makeInitial(seed,records);
 for(const profile of initial.profiles)if(!result.profiles.some(p=>p.id===profile.id))result.profiles.push(profile);
 for(const profile of result.profiles)profile.administration={...emptyAdministration(profile.id),...profile.administration};
 result.schemaVersion=seed.schemaVersion;
 return result;
}
