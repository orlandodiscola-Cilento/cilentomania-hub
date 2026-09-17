export const sections={
 informazioni:[['nome','Nome struttura'],['categoria','Tipologia'],['claim','Frase di presentazione'],['descrizione_breve','Descrizione breve','textarea'],['descrizione_completa','Descrizione completa','textarea']],
 contatti:[['telefono','Telefono'],['whatsapp','WhatsApp'],['email','Email','email'],['sito_web','Sito web','url'],['facebook','Facebook','url'],['instagram','Instagram','url'],['url_prenotazione','Link per prenotare','url']],
 caratteristiche:[['numero_camere','Camere','number'],['posti_letto','Posti letto','number'],['periodo_apertura','Periodo di apertura'],['check_in','Check-in','time'],['check_out','Check-out','time'],['tipologie_camere','Tipologie di camere (una per riga)','list'],['trattamenti_disponibili','Trattamenti (uno per riga)','list'],['ideale_per','Ideale per (uno per riga)','list'],['animali_ammessi','Animali ammessi','tri'],['accessibile','Accessibilità','tri'],['adatto_famiglie','Adatto alle famiglie','tri'],['aperto_tutto_anno','Aperta tutto l’anno','tri']],
 posizione:[['comune_id','Comune','municipality'],['localita','Località'],['indirizzo','Indirizzo'],['latitudine','Latitudine','coordinate'],['longitudine','Longitudine','coordinate']]
};
export const editable=new Set(Object.values(sections).flat().map(f=>f[0]).concat('serviceCodes'));
export function validatePatch(patch,codes) {
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
    if(m.blob&&(!(m.blob instanceof Blob)||!['image/jpeg','image/png','image/webp'].includes(m.blob.type)||m.blob.size>5*1024*1024))throw Error('Usa JPG, PNG o WebP entro 5 MB.');
    if(m.source&&!/^(images|assets)\/[\w./-]+$/.test(m.source))throw Error('Percorso immagine non valido.');
    if(m.source?.includes('..'))throw Error('Percorso immagine non valido.');
    return {id:String(m.id),kind:m.kind,order:i,caption:String(m.caption||''),alt:String(m.alt||''),source:m.source||'',blob:m.blob||null};
  });
}
export function makeInitial(seed,records) {
  const state=structuredClone(seed);state.profiles=seed.profiles.map(p=>{
    const source=records.find(r=>r.id===p.sourceId);if(!source)throw Error('Scheda demo non disponibile.');
    const content=Object.fromEntries([...editable].map(k=>[k,source[k]??(['numero_camere','posti_letto','latitudine','longitudine','animali_ammessi','accessibile','adatto_famiglie','aperto_tutto_anno'].includes(k)?null:['serviceCodes','tipologie_camere','trattamenti_disponibili','ideale_per'].includes(k)?[]:'')]));content.nome=p.name;
    const media=[...(source.logo?[{kind:'logo',source:source.logo}]:[]),{kind:'cover',source:source.immagine_copertina},...(source.galleria||[]).map(source=>({kind:'gallery',source}))].map((m,i)=>({...m,id:p.id+'-photo-'+i,order:i,caption:'Paesaggio illustrativo del Cilento',alt:'Paesaggio illustrativo del Cilento'}));
    const initial={content,media};
    return {...p,contentOwner:p.organizationId,publicPageId:p.publicPageId||null,version:0,administration:{planId:null,subscriptionId:null,status:null,startsAt:null,expiresAt:null,contract:null,payment:null},publishedVersion:p.publicationStatus==='published'?structuredClone(initial):null,workingRevision:{id:p.id+'-initial',status:'draft',...structuredClone(initial),updatedAt:null,feedback:''},revisions:[]};
  });return state;
}
