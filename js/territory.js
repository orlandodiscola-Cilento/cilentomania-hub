let municipalities=[];
let featured=[];
let featuredDetails=[];
let territoryConfig={placeholderImage:'assets/placeholder-comune.svg',cards:[]};
let usefulContacts=[];
let usefulContactsPromise=null;
let territoryImages=[];
let territoryImagesPromise=null;
let territoryImageConfig={
 placeholder:{src:'assets/placeholder-comune.svg',width:800,height:500},
 gallery:{slots:6,placeholderMessage:'Archivio fotografico in aggiornamento'},
 formats:{card:{width:800,height:500,sizes:'(max-width: 560px) calc(100vw - 68px), (max-width: 900px) calc(50vw - 58px), 280px',loading:'lazy',fetchPriority:'low'},cover:{width:1280,height:800,sizes:'(max-width: 1020px) calc(100vw - 72px), 924px',loading:'lazy',fetchPriority:'low'},gallery:{width:800,height:500,sizes:'(max-width: 560px) calc(100vw - 68px), (max-width: 900px) calc(50vw - 58px), 280px',loading:'lazy',fetchPriority:'low'}},
 altTemplates:{card:'Veduta di {municipality}',cover:'Immagine di copertina di {municipality}'},responsiveSourcesField:'sources'
};
let territoryImageConfigPromise=null;
let lockedPageScrollY=0;
let pageScrollLocked=false;
let lockedBodyStyles=null;
let territoryListScrollY=0;
let territoryNavigationScrollTarget=null;
let territoryNavigationScrollHandler=null;
let modalReturnHtml='';
let municipalityModuleDataCache={eat:null,sleep:null};
let municipalityModuleNavigationState=null;
let municipalityModuleGeoPositionCache=null;
let municipalityModuleGeoPositionPromise=null;

function restoreMunicipalityModuleListFromBackButton(backButton){
 if(!backButton)return;
 const fallbackType=backButton.getAttribute('data-module-back-type')||'sleep';
 const fallbackMunicipality=backButton.getAttribute('data-module-back-municipality')||'';
 const fallbackComuneId=backButton.getAttribute('data-module-back-comune-id')||municipalitySlug(fallbackMunicipality);
 let state=null;
 const encodedState=backButton.getAttribute('data-module-back-state')||'';
 if(encodedState){
  try{
   state=JSON.parse(encodedState);
  }catch(error){
   state=null;
  }
 }
 state=state||municipalityModuleNavigationState||buildMunicipalityModuleNavigationState(fallbackType,fallbackMunicipality,fallbackComuneId,{search:'',locality:'',category:'',price:'',boolean:[]},0);
 const resolvedState=buildMunicipalityModuleNavigationState(
  state.type||fallbackType,
  state.municipalityName||fallbackMunicipality,
  state.comuneId||fallbackComuneId,
  state.filters||{search:'',locality:'',category:'',price:'',boolean:[]},
  state.scrollTop
 );
 openMunicipalityModule(resolvedState.type,resolvedState.municipalityName,resolvedState.comuneId,resolvedState);
}

function bindMunicipalityModuleBackDelegation(){
 if(!panelContent||panelContent.dataset.moduleBackDelegationBound==='true')return;
 panelContent.addEventListener('click',event=>{
  const backButton=event.target.closest('[data-action="back-to-module-list"]');
  if(!backButton||!panelContent.contains(backButton))return;
  event.preventDefault();
  restoreMunicipalityModuleListFromBackButton(backButton);
 });
 panelContent.dataset.moduleBackDelegationBound='true';
}

function buildMunicipalityModuleNavigationState(type,municipalityName,comuneId,filters,scrollTop){
 return {type:type||'sleep',municipalityName:municipalityName||'',comuneId:comuneId||'',filters:filters||{search:'',locality:'',category:'',price:'',boolean:[]},scrollTop:Number(scrollTop||0)};
}
function setMunicipalityModuleNavigationState(state){
 municipalityModuleNavigationState=state||null;
 return municipalityModuleNavigationState;
}
function validateMunicipalityDetailUrl(value){
 if(typeof value!=='string')return false;
 const trimmed=value.trim();
 if(!trimmed)return false;
 try{
  const url=new URL(trimmed.startsWith('http://')||trimmed.startsWith('https://')?trimmed:'https://'+trimmed);
  return (url.protocol==='http:'||url.protocol==='https:')&&!/^(www\.)?cilentomania\.it$/i.test(url.hostname)&&!/\.cilentomania\.it$/i.test(url.hostname);
 }catch(error){
  return false;
 }
}
function validateMunicipalityDetailEmail(value){
 if(typeof value!=='string')return false;
 const trimmed=value.trim();
 return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}
function validateMunicipalityDetailPhone(value){
 if(typeof value!=='string')return false;
 const trimmed=value.trim();
 return /^[+0-9\s().-]{4,20}$/.test(trimmed);
}
function sanitizeMunicipalityPhoneLink(value){
 const raw=String(value||'').trim();
 if(!raw)return '';
 const hasPlus=raw.startsWith('+');
 const digits=raw.replace(/\D/g,'');
 if(digits.length<4)return '';
 return (hasPlus?'+':'')+digits;
}
function validateMunicipalityDetailWhatsapp(value){
 const digits=String(value||'').replace(/\D/g,'');
 return digits.length>=8;
}
function resolveMunicipalityMapHref(item){
 const latNumber=Number(item?.latitudine);
 const lngNumber=Number(item?.longitudine);
 const hasCoordinates=Number.isFinite(latNumber)&&Number.isFinite(lngNumber)&&!(latNumber===0&&lngNumber===0);
 if(hasCoordinates)return 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(latNumber+','+lngNumber);
 const address=String(item?.indirizzo||'').trim();
 if(address)return 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(address);
 return '';
}
function formatMunicipalityDistanceMeters(meters){
 const value=Number(meters);
 if(!Number.isFinite(value)||value<0)return '';
 if(value<1000)return Math.max(1,Math.round(value))+' m';
 return (Math.round((value/1000)*10)/10).toFixed(1).replace('.',',')+' km';
}
function getMunicipalityModuleUserPosition(){
 if(municipalityModuleGeoPositionCache)return Promise.resolve(municipalityModuleGeoPositionCache);
 if(municipalityModuleGeoPositionPromise)return municipalityModuleGeoPositionPromise;
 if(!navigator.geolocation){
  municipalityModuleGeoPositionCache={status:'unsupported'};
  return Promise.resolve(null);
 }
 municipalityModuleGeoPositionPromise=new Promise(resolve=>{
  navigator.geolocation.getCurrentPosition(position=>{
   municipalityModuleGeoPositionCache={status:'ok',coords:position.coords};
   municipalityModuleGeoPositionPromise=null;
   resolve(municipalityModuleGeoPositionCache);
  },error=>{
   municipalityModuleGeoPositionCache={status:error?.code===error.PERMISSION_DENIED?'denied':'unavailable'};
   municipalityModuleGeoPositionPromise=null;
   resolve(null);
  },{maximumAge:600000,timeout:6000,enableHighAccuracy:false});
 });
 return municipalityModuleGeoPositionPromise;
}
function computeMunicipalityDistanceMeters(item,position){
 const latNumber=Number(item?.latitudine);
 const lngNumber=Number(item?.longitudine);
 const hasCoordinates=Number.isFinite(latNumber)&&Number.isFinite(lngNumber)&&!(latNumber===0&&lngNumber===0);
 const userLat=Number(position?.coords?.latitude);
 const userLng=Number(position?.coords?.longitude);
 if(!hasCoordinates||!Number.isFinite(userLat)||!Number.isFinite(userLng))return '';
 const earthRadius=6371000;
 const toRadians=value=>value*Math.PI/180;
 const deltaLat=toRadians(latNumber-userLat);
 const deltaLng=toRadians(lngNumber-userLng);
 const a=Math.sin(deltaLat/2)**2+Math.cos(toRadians(userLat))*Math.cos(toRadians(latNumber))*Math.sin(deltaLng/2)**2;
 return 2*earthRadius*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function municipalityModuleHeroMarkup(heroImage,itemName){
 if(heroImage){
  return '<img class="module-detail__cover" src="'+safeTerritoryText(heroImage)+'" alt="'+safeTerritoryText(itemName||'Immagine principale')+'" loading="lazy" onerror="this.style.display=\'none\'">';
 }
 return '<div class="module-detail__hero-placeholder" aria-hidden="true"><span aria-hidden="true">◌</span></div>';
}
function municipalityModuleGalleryMarkup(images,itemName){
 const cells=Array.from({length:9},(_,index)=>{
  const image=images[index];
  if(image){
   return '<button class="module-detail__gallery-item" type="button" data-module-gallery-open="'+index+'" aria-label="Apri foto '+(index+1)+' di 9"><img src="'+safeTerritoryText(image)+'" alt="'+safeTerritoryText(itemName||'Galleria')+' - Foto '+(index+1)+'" loading="lazy"></button>';
  }
  return '<div class="module-detail__gallery-placeholder" aria-hidden="true"><span aria-hidden="true">◌</span></div>';
 });
 return '<div class="module-detail__gallery-grid" data-module-gallery>'+cells.join('')+'</div>';
}
function municipalityModuleDetailDistanceMarkup(item){
 const latNumber=Number(item?.latitudine);
 const lngNumber=Number(item?.longitudine);
 const hasCoordinates=Number.isFinite(latNumber)&&Number.isFinite(lngNumber)&&!(latNumber===0&&lngNumber===0);
 if(!hasCoordinates)return '';
 return '<p class="module-detail__practical-item" data-module-distance-field><strong>Distanza da te</strong><br><span data-module-distance-value>Attiva la posizione per conoscere la distanza</span></p>';
}
function updateMunicipalityModuleDistance(root,item){
 const valueNode=root?.querySelector('[data-module-distance-value]');
 if(!valueNode)return;
 getMunicipalityModuleUserPosition().then(position=>{
  if(!root.isConnected)return;
  const distanceMeters=computeMunicipalityDistanceMeters(item,position);
  if(distanceMeters){
   valueNode.textContent=formatMunicipalityDistanceMeters(distanceMeters);
   return;
  }
  const status=municipalityModuleGeoPositionCache?.status;
  valueNode.textContent=status==='unsupported'?'La posizione non è supportata dal browser':'Attiva la posizione per conoscere la distanza';
 }).catch(()=>{});
}
function buildMunicipalityDetailActions(item){
 const actions=[];
 const rawPhone=item.telefono?String(item.telefono).trim():'';
 const phone=sanitizeMunicipalityPhoneLink(rawPhone);
 const email=item.email?String(item.email).trim():'';
 const mapHref=resolveMunicipalityMapHref(item);
 const entityName=safeTerritoryText(item.nome||'struttura');
 if(rawPhone&&validateMunicipalityDetailPhone(rawPhone)&&phone)actions.push('<a class="module-action" href="tel:'+safeTerritoryText(phone)+'" aria-label="Chiama '+entityName+'">Chiama</a>');
 if(email&&validateMunicipalityDetailEmail(email))actions.push('<a class="module-action" href="mailto:'+safeTerritoryText(email)+'" aria-label="Invia email a '+entityName+'">Invia email</a>');
 if(mapHref)actions.push('<a class="module-action" href="'+safeTerritoryText(mapHref)+'" target="_blank" rel="noopener noreferrer" aria-label="Apri indicazioni stradali per '+entityName+'">Raggiungerci</a>');
 return actions;
}

function initTerritoryData(data){
 municipalities=Array.isArray(data.municipalities)?data.municipalities:data.municipalities.value;
 featured=data.featured.map(x=>[x.title,x.municipality,x.image,x.description]);
 featuredDetails=data.featured.map(x=>x.detailHtml);
 territoryConfig={...territoryConfig,...(data.territory||{})};
 usefulContactsPromise=loadUsefulContacts();
 territoryImagesPromise=loadTerritoryImages();
 territoryImageConfigPromise=loadTerritoryImageConfig();
}
async function loadTerritoryImageConfig(){
 try{
  const response=await fetch('data/immagini-comuni.config.json',{cache:'no-store'});
  if(!response.ok)throw new Error('HTTP '+response.status);
  const data=await response.json();
  territoryImageConfig={...territoryImageConfig,...data,placeholder:{...territoryImageConfig.placeholder,...(data.placeholder||{})},gallery:{...territoryImageConfig.gallery,...(data.gallery||{})},formats:{...territoryImageConfig.formats,...(data.formats||{})},altTemplates:{...territoryImageConfig.altTemplates,...(data.altTemplates||{})}};
 }catch(error){console.warn('Configurazione immagini dei Comuni non disponibile:',error);}
 return territoryImageConfig;
}
async function loadTerritoryImages(){
 if(territoryImages.length)return territoryImages;
 try{
  const response=await fetch('data/crediti-immagini-comuni.json',{cache:'no-store'});
  if(!response.ok)throw new Error('HTTP '+response.status);
  const data=await response.json();territoryImages=Array.isArray(data)?data:(data.images||[]);
 }catch(error){console.warn('Archivio immagini dei Comuni non disponibile:',error);territoryImages=[];}
 return territoryImages;
}
async function loadUsefulContacts(){
 if(usefulContacts.length)return usefulContacts;
 try{
  const response=await fetch('data/contatti-utili-comuni.json',{cache:'no-store'});
  if(!response.ok)throw new Error('HTTP '+response.status);
  const data=await response.json();usefulContacts=Array.isArray(data)?data:(data.contacts||[]);
 }catch(error){console.warn('Archivio contatti utili non disponibile:',error);usefulContacts=[];}
 return usefulContacts;
}
function townSelector(note,mode='explore',moduleType=''){
 if(note==='Cerca e seleziona un Comune.')return territoryExplorer(note);
 const listAttributes=mode==='home-module'?' data-town-selector-context="home-module" data-module-type="'+safeTerritoryText(moduleType)+'"':' data-town-selector-context="explore"';
 return '<div class="notice">'+note+'</div><input class="town-search" id="townFilter" placeholder="Cerca un Comune..."><div class="towns" id="townList"'+listAttributes+'>'+municipalities.map(m=>'<button class="town" data-name="'+m.toLowerCase()+'">'+m+'</button>').join('')+'</div>';
}
function safeTerritoryText(value){
 return String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function territoryCardData(name){
 const configured=(territoryConfig.cards||[]).find(card=>card.municipality===name)||{};
 const defaults=territoryConfig.contentDefaults||{};
 const card={...defaults,...configured,municipality:name};
 const cardCredit=territoryImageById(card.immagine_card_id)||territoryImageByType(name,'card');
 const coverCredit=territoryImageById(card.immagine_copertina_id)||territoryImageByType(name,'cover');
 card.imageCardRecord=cardCredit||legacyTerritoryImage(card.immagine_card||card.image,'card');
 card.imageCoverRecord=coverCredit||legacyTerritoryImage(card.immagine_copertina||card.image,'cover')||card.imageCardRecord;
 card.imageCard=card.imageCardRecord?.file||territoryPlaceholderSource();
 card.imageCardAlt=card.imageCardRecord?.alt||territoryImageAlt(name,'card');
 card.imageCover=card.imageCoverRecord?.file||card.imageCard||territoryPlaceholderSource();
 card.imageCoverAlt=card.imageCoverRecord?.alt||territoryImageAlt(name,'cover');
 // galleria_fotografica è il campo ufficiale; galleria resta leggibile durante la migrazione.
 const galleryIds=Object.prototype.hasOwnProperty.call(configured,'galleria_fotografica')?configured.galleria_fotografica:configured.galleria;
 card.galleria_fotografica=Array.isArray(galleryIds)?galleryIds:[];
 card.galleria=card.galleria_fotografica;
 card.image=card.imageCard;
 card.localita=card.localita?.length?card.localita:(card.locations||[]);card.locations=card.localita;
 card.infopoint_ids=card.infopoint_ids||[];card.useful_contact_ids=card.useful_contact_ids||[];
 return card;
}
function territoryImageById(id){
 return id?territoryImages.find(image=>image.id===id):null;
}
function territoryImageByType(municipality,type){return territoryImages.find(image=>image.municipality===municipality&&image.type===type)||null}
function legacyTerritoryImage(file,type){return file?{file,type}:null}
function territoryPlaceholderSource(){return territoryImageConfig.placeholder?.src||territoryConfig.placeholderImage||'assets/placeholder-comune.svg'}
function territoryImageAlt(municipality,type){return String(territoryImageConfig.altTemplates?.[type]||'{municipality}').replace('{municipality}',municipality||'Cilento')}
function territoryResponsiveSources(image){
 const field=territoryImageConfig.responsiveSourcesField||'sources';
 const sources=Array.isArray(image?.[field])?image[field]:[];
 return sources.filter(source=>source?.src&&Number(source.width)>0).sort((a,b)=>a.width-b.width).map(source=>safeTerritoryText(source.src)+' '+Number(source.width)+'w').join(',');
}
function territoryImageAttributes(image,municipality,type){
 const format=territoryImageConfig.formats?.[type]||{};
 const source=image?.file||territoryPlaceholderSource();
 const suppliedAlt=image?.alt;
 const generatedAlt=territoryImageAlt(municipality,type);
 const srcset=territoryResponsiveSources(image);
 return 'src="'+safeTerritoryText(source)+'"'+(srcset?' srcset="'+srcset+'"':'')+(format.sizes?' sizes="'+safeTerritoryText(format.sizes)+'"':'')+' width="'+Number(format.width||800)+'" height="'+Number(format.height||500)+'" loading="'+safeTerritoryText(format.loading||'lazy')+'" decoding="async" fetchpriority="'+safeTerritoryText(format.fetchPriority||'low')+'" '+(suppliedAlt?'alt="'+safeTerritoryText(suppliedAlt)+'"':'data-seo-alt="'+safeTerritoryText(generatedAlt)+'"')+' data-territory-image data-territory-fallback="'+safeTerritoryText(territoryPlaceholderSource())+'"';
}
function bindTerritoryImages(root=document){
 root.querySelectorAll('img[data-territory-image]').forEach(image=>{
  if(image.dataset.territoryImageBound)return;
  image.dataset.territoryImageBound='true';
  image.addEventListener('error',()=>{
   if(image.dataset.territoryFallbackApplied)return;
   image.dataset.territoryFallbackApplied='true';image.removeAttribute('srcset');image.removeAttribute('sizes');image.src=image.dataset.territoryFallback;image.classList.add('territory-image-fallback');
  });
 });
 globalThis.CilentomaniaSEO?.SeoManager.applyImageAlts(root);
}
function territoryGallery(card){
 const slotCount=Math.max(1,Number(territoryImageConfig.gallery?.slots)||6);
 const seen=new Set();
 const images=card.galleria_fotografica.map(territoryImageById).filter(image=>{
  if(!image?.file||!image.alt)return false;
  const key=image.file;if(seen.has(key))return false;seen.add(key);return true;
 }).slice(0,slotCount);
 const realItems=images.map(image=>'<figure class="territory-gallery-item territory-gallery-item-real"><button class="territory-gallery-open" type="button" data-gallery-image="'+safeTerritoryText(image.id)+'" aria-label="Ingrandisci '+safeTerritoryText(image.title||image.alt)+'"><img src="'+safeTerritoryText(image.file)+'" width="800" height="500" loading="lazy" decoding="async" alt="'+safeTerritoryText(image.alt)+'" data-gallery-real-image></button><figcaption>'+(image.title?'<h3>'+safeTerritoryText(image.title)+'</h3>':'')+(image.description?'<p>'+safeTerritoryText(image.description)+'</p>':'')+'</figcaption></figure>').join('');
 const placeholderCount=slotCount-images.length;
 const placeholderMessage=safeTerritoryText(territoryImageConfig.gallery?.placeholderMessage||'Archivio fotografico in aggiornamento');
 const placeholderItems=Array.from({length:placeholderCount},()=>'<figure class="territory-gallery-item territory-gallery-placeholder" data-gallery-placeholder><div class="territory-gallery-placeholder-visual" aria-hidden="true"><img src="'+safeTerritoryText(territoryPlaceholderSource())+'" width="800" height="500" loading="lazy" decoding="async" alt=""><span>'+placeholderMessage+'</span></div></figure>').join('');
 const items=realItems+placeholderItems;
 return '<section class="territory-gallery" aria-labelledby="territory-gallery-title"><h2 id="territory-gallery-title">Galleria fotografica</h2><div class="territory-gallery-grid">'+items+'</div><div class="territory-lightbox hidden" data-territory-lightbox role="dialog" aria-modal="true" aria-label="Immagine ingrandita"><button class="territory-lightbox-close" type="button" data-gallery-close aria-label="Chiudi immagine ingrandita">×</button><div class="territory-lightbox-content"><img data-gallery-large src="" alt=""><div class="territory-lightbox-copy"><h3 data-gallery-title></h3><p data-gallery-description></p></div></div></div></section>';
}
function municipalityHasInfopoint(card){
 return territoryInfopoints(card).length>0;
}
function territoryInfopoints(card){
 if(typeof infopoints==='undefined')return [];
 return card.infopoint_ids.map(id=>infopoints.find(point=>point.id===id)).filter(Boolean);
}
function infopointActions(point){
 const actions=[];
 if(point.coordinates)actions.push('<a href="https://www.google.com/maps/dir/?api=1&amp;destination='+encodeURIComponent(point.coordinates)+'" target="_blank" rel="noopener">Come raggiungerci</a>');
 const writeLink=point.whatsapp?(String(point.whatsapp).startsWith('http')?point.whatsapp:'https://wa.me/'+String(point.whatsapp).replace(/\D/g,'')):(point.email?'mailto:'+point.email:'');
 if(writeLink)actions.push('<a href="'+safeTerritoryText(writeLink)+'"'+(point.whatsapp?' target="_blank" rel="noopener"':'')+'>Scrivi</a>');
 if(point.phone)actions.push('<a href="tel:'+safeTerritoryText(point.phone)+'">Chiama</a>');
 return actions.length?'<div class="territory-infopoint-actions">'+actions.join('')+'</div>':'';
}
function infopointPanel(card){
 const points=territoryInfopoints(card);
 if(!points.length)return '';
 const content=points.map(point=>{
  const openingDays=point.openingDays||point.days;
  const fields=[
   ['Indirizzo',point.address],['Località',point.locality],['Comune',point.municipality],
   ['Giorni',openingDays],['Orari',point.hours],['Telefono',point.phone],
   ['Email',point.email],['WhatsApp',point.whatsapp],['Coordinate',point.coordinates],['Note',point.notes]
  ].filter(field=>field[1]).map(field=>'<p><strong>'+field[0]+'</strong><br>'+safeTerritoryText(field[1])+'</p>').join('');
  return '<article class="territory-infopoint-card"><h4>'+safeTerritoryText(point.name)+'</h4><div class="territory-infopoint-fields">'+fields+'</div>'+infopointActions(point)+'</article>';
 }).join('');
 return '<section class="territory-infopoint"><button class="territory-infopoint-toggle" type="button" data-infopoint-toggle aria-expanded="false">Infopoint Cilentomania</button><div class="territory-infopoint-panel hidden" data-infopoint-panel><div class="territory-infopoint-head"><h3>Infopoint Cilentomania</h3><button type="button" class="territory-infopoint-close" data-infopoint-close aria-label="Chiudi pannello Infopoint">×</button></div>'+content+'</div></section>';
}
function narrativeSection(title,value,isList=false){
 const hasValue=Array.isArray(value)?value.length>0:Boolean(value);
 const content=Array.isArray(value)?value.map(item=>(isList?'<li>':'<p>')+safeTerritoryText(item)+(isList?'</li>':'</p>')).join(''):safeTerritoryText(value);
 const body=hasValue?(Array.isArray(value)?(isList?'<ul>'+content+'</ul>':content):'<p>'+content+'</p>'):'<p class="territory-content-pending">Contenuto da completare con fonti verificate.</p>';
 return '<section class="territory-narrative-section"><h3>'+title+'</h3>'+body+'</section>';
}
function usefulContactActions(contact){
 const actions=[];
 if(contact.phone)actions.push('<a href="tel:'+safeTerritoryText(contact.phone)+'">Chiama</a>');
 const write=contact.email||contact.pec;if(write)actions.push('<a href="mailto:'+safeTerritoryText(write)+'">Scrivi</a>');
 if(contact.coordinates)actions.push('<a href="https://www.google.com/maps/dir/?api=1&amp;destination='+encodeURIComponent(contact.coordinates)+'" target="_blank" rel="noopener">Come raggiungerci</a>');
 if(contact.website)actions.push('<a href="'+safeTerritoryText(contact.website)+'" target="_blank" rel="noopener">Visita il sito</a>');
 return actions.length?'<div class="territory-useful-actions">'+actions.join('')+'</div>':'';
}
function usefulContactsPanel(card){
 const contacts=card.useful_contact_ids.map(id=>usefulContacts.find(contact=>contact.id===id)).filter(contact=>contact&&contact.status==='verificato');
 if(!contacts.length)return '';
 const items=contacts.map(contact=>{
  const fields=[['Indirizzo',contact.address],['Località',contact.locality],['Telefono',contact.phone],['Telefono secondario',contact.secondary_phone],['Email',contact.email],['PEC',contact.pec],['Giorni di apertura',contact.opening_days],['Orari',contact.hours],['Note',contact.notes]].filter(field=>field[1]).map(field=>'<p><strong>'+field[0]+'</strong><br>'+safeTerritoryText(field[1])+'</p>').join('');
  return '<article class="territory-useful-card"><h3>'+safeTerritoryText(contact.official_name)+'</h3><div class="territory-useful-fields">'+fields+'</div>'+usefulContactActions(contact)+'</article>';
 }).join('');
 return '<section class="territory-useful"><h2>Contatti utili</h2><div class="territory-useful-grid">'+items+'</div></section>';
}
function practicalInformationPanel(card){
 const labels={come_arrivare:'Come arrivare',parcheggi:'Parcheggi',mobilita_locale:'Mobilità locale',accessibilita:'Accessibilità',servizi_turistici:'Servizi turistici',periodo_consigliato:'Periodo consigliato',consigli_famiglie:'Consigli per famiglie',consigli_mobilita_ridotta:'Consigli per persone con mobilità ridotta',emergenze:'Emergenze'};
 const data=card.informazioni_pratiche||{};
 const unavailable=/(?:non (?:sono|risultano|risulta|esiste|è presente)|non (?:è|sono) disponibil|non verificat|non reperit|informazion\w* non disponibil|collegament\w* pubblic\w* possono essere limitat|verificare (?:preventivamente|gli orari|il percorso|le possibilità|accessi|pendenze)|contattare (?:il comune|preventivamente|in anticipo)|chiedere (?:al comune|conferma)|seguire la segnaletica)/i;
 const validValue=value=>typeof value==='string'&&value.trim().length>0&&!unavailable.test(value.trim());
 const items=Object.entries(labels).filter(([key])=>validValue(data[key])).map(([key,label])=>'<section class="territory-practical-item"><h3>'+label+'</h3><p>'+safeTerritoryText(data[key].trim())+'</p></section>').join('');
 return items?'<section class="territory-practical"><h2>Informazioni pratiche</h2><div class="territory-practical-grid">'+items+'</div></section>':'';
}
function municipalityFinalActions(name){
 const comuneId=municipalitySlug(name);
 return '<nav class="territory-final-actions" aria-label="Approfondimenti su '+safeTerritoryText(name)+'"><button type="button" data-municipality-action="sights" data-municipality="'+safeTerritoryText(name)+'" data-comune-id="'+safeTerritoryText(comuneId)+'">Cosa vedere</button><button type="button" data-municipality-action="events" data-municipality="'+safeTerritoryText(name)+'" data-comune-id="'+safeTerritoryText(comuneId)+'">Eventi ed esperienze</button><button type="button" data-municipality-action="eat" data-municipality="'+safeTerritoryText(name)+'" data-comune-id="'+safeTerritoryText(comuneId)+'">Dove mangiare</button><button type="button" data-municipality-action="sleep" data-municipality="'+safeTerritoryText(name)+'" data-comune-id="'+safeTerritoryText(comuneId)+'">Dove dormire</button></nav>';
}
function municipalitySheet(name,includeInfopoints){
 const card=territoryCardData(name);
 if(!includeInfopoints)return '<span data-modal-return hidden></span><div class="notice">Scheda territoriale predisposta per essere popolata con cosa vedere, dove dormire, dove mangiare, eventi, esperienze e servizi.</div>';
 const narrative=narrativeSection('Presentazione generale',card.presentazione)+narrativeSection('Storia',card.storia)+narrativeSection('Identità e tradizioni',card.tradizioni)+narrativeSection('Curiosità',card.curiosita)+narrativeSection('Paesaggio e territorio',card.territorio)+narrativeSection('Borghi, frazioni e località principali',card.localita,true)+narrativeSection('Enogastronomia tipica',card.enogastronomia)+narrativeSection('Informazioni utili per il visitatore',card.informazioni_utili);
 return '<div class="territory-sticky-bar" data-municipality-toolbar><button class="territory-back" type="button" data-territory-back>← Torna ai Comuni</button><button class="territory-sheet-close" type="button" data-territory-close aria-label="Chiudi scheda Comune">×</button></div><article class="territory-municipality"><img class="territory-cover" '+territoryImageAttributes(card.imageCoverRecord,name,'cover')+'><header class="territory-municipality-head"><h2>'+safeTerritoryText(name)+'</h2>'+(card.introduzione?'<p>'+safeTerritoryText(card.introduzione)+'</p>':'<p class="territory-content-pending">Introduzione da completare con fonti verificate.</p>')+'</header><div class="territory-narrative">'+narrative+'</div>'+territoryGallery(card)+(includeInfopoints?infopointPanel(card):'')+usefulContactsPanel(card)+practicalInformationPanel(card)+municipalityFinalActions(name)+'</article>';
}
function territoryExplorer(note){
 const cards=municipalities.map(name=>{
  const card=territoryCardData(name);
  const search=[card.municipality,...card.locations].join(' ').toLowerCase();
  const badge=municipalityHasInfopoint(card)?'<span class="territory-badge">Infopoint Cilentomania</span>':'';
  return '<article class="territory-card" data-search="'+safeTerritoryText(search)+'"><div class="territory-image"><img '+territoryImageAttributes(card.imageCardRecord,name,'card')+'>'+badge+'</div><div class="territory-card-copy"><h3>'+safeTerritoryText(card.municipality)+'</h3><button class="territory-discover" type="button" data-territory="'+safeTerritoryText(card.municipality)+'">Scopri</button></div></article>';
 }).join('');
 return '<div class="notice">'+note+'</div><label class="territory-search-label" for="townFilter">Cerca per Comune o località</label><input class="town-search" id="townFilter" placeholder="Cerca un Comune o una località..."><div class="territory-grid" id="townList">'+cards+'</div><p class="territory-empty hidden" id="territoryEmpty">Nessun Comune trovato.</p>';
}
function municipalitySlug(value){
 return String(value||'').toLowerCase().normalize('NFD').replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').replace(/-+/g,'-');
}
function municipalityModuleConfig(type){
 const configs={
  eat:{
   titlePrefix:'Dove mangiare a',
   intro:'Scopri luoghi, servizi e orari per organizzare una giornata in città o in spiaggia.',
   entityType:'restaurant',
  placeholder:'Cerca un locale o una località…',
   empty:'Nessuna attività disponibile con i filtri selezionati.',
   categories:['Ristorante','Pizzeria','Trattoria','Agriturismo con ristorazione','Ristorante sul mare e beach club','Bar e caffetterie','Gelateria','Gastronomia e prodotti tipici'],
   localities:['Castellabate centro storico','Santa Maria di Castellabate','San Marco di Castellabate','Lago','Ogliastro Marina','Licosa','Alano'],
  resultNoun:{singular:'attività trovata',plural:'attività trovate'},
   booleanFilters:[
    {key:'cucina_cilentana',label:'Cucina cilentana',type:'cuisine'},
    {key:'pesce',label:'Pesce',type:'cuisine'},
    {key:'carne',label:'Carne',type:'cuisine'},
    {key:'pizza',label:'Pizza',type:'cuisine'},
    {key:'vegetariano',label:'Vegetariano',type:'flag'},
    {key:'senza_glutine',label:'Senza glutine',type:'flag'},
    {key:'aperto_pranzo',label:'Aperto a pranzo',type:'flag'},
    {key:'aperto_cena',label:'Aperto a cena',type:'flag'}
   ]
  },
  sleep:{
   titlePrefix:'Dove dormire a',
   intro:'Trova strutture ricettive, servizi e caratteristiche utili per scegliere il soggiorno più adatto.',
   entityType:'accommodation',
    placeholder:'Cerca una struttura o una località…',
   empty:'Nessuna struttura ricettiva disponibile con i filtri selezionati.',
   categories:['Hotel','Resort','Bed and Breakfast','Case vacanza','Agriturismo','Residence','Campeggi e villaggi','Ospitalità nel borgo'],
   localities:['Castellabate centro storico','Santa Maria di Castellabate','San Marco di Castellabate','Lago','Ogliastro Marina','Licosa','Alano'],
  resultNoun:{singular:'struttura trovata',plural:'strutture trovate'},
   booleanFilters:[
    {key:'vicino_mare',label:'Vicino al mare',type:'flag'},
    {key:'piscina',label:'Piscina',type:'flag'},
    {key:'parcheggio',label:'Parcheggio',type:'flag'},
    {key:'animali_ammessi',label:'Animali ammessi',type:'flag'},
    {key:'accessibile',label:'Accessibile',type:'flag'},
    {key:'adatto_famiglie',label:'Adatto alle famiglie',type:'flag'},
   {key:'aperto_tutto_anno',label:'Aperto tutto l’anno',type:'flag'},
   {key:'wifi',label:'Wi-Fi',type:'service',optional:true},
   {key:'colazione_inclusa',label:'Colazione inclusa',type:'service',optional:true},
   {key:'aria_condizionata',label:'Aria condizionata',type:'service',optional:true},
   {key:'spa_benessere',label:'Spa / Benessere',type:'service',optional:true}
   ]
  }
 };
 return configs[type]||configs.sleep;
}
function normalizeMunicipalityModuleText(value){
 return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[‐‑‒–—−]/g,'-').replace(/\s+/g,' ').trim();
}
function municipalityModuleAsArray(value){
 if(Array.isArray(value))return value.filter(Boolean).map(entry=>String(entry));
 if(typeof value==='string')return value?value.split(',').map(entry=>entry.trim()).filter(Boolean):[];
 return [];
}
function municipalityModuleContainsPattern(value,patterns){
 const haystack=normalizeMunicipalityModuleText(value);
 return patterns.some(pattern=>haystack.includes(pattern));
}
function municipalityModuleHasService(item,patterns){
 const services=municipalityModuleAsArray(item.servizi);
 return services.some(service=>municipalityModuleContainsPattern(service,patterns));
}
function municipalityModuleHasCuisine(item,patterns){
 const cuisines=municipalityModuleAsArray(item.tipologie_cucina);
 return cuisines.some(cuisine=>municipalityModuleContainsPattern(cuisine,patterns));
}
function municipalityModuleBooleanPredicate(flag,item){
 if(flag==='cucina_cilentana')return municipalityModuleHasCuisine(item,['cucina cilentana']);
 if(flag==='pesce')return municipalityModuleHasCuisine(item,['pesce']);
 if(flag==='carne')return municipalityModuleHasCuisine(item,['carne']);
 if(flag==='pizza')return municipalityModuleHasCuisine(item,['pizza']);
 if(flag==='vegetariano')return Boolean(item.opzioni_vegetariane)||municipalityModuleHasCuisine(item,['vegetar']);
 if(flag==='senza_glutine')return Boolean(item.opzioni_senza_glutine)||municipalityModuleHasService(item,['senza glutine','gluten free']);
 if(flag==='aperto_pranzo')return Boolean(item.aperto_pranzo);
 if(flag==='aperto_cena')return Boolean(item.aperto_cena);
 if(flag==='vicino_mare')return Number(item.distanza_mare_metri||0)>0&&Number(item.distanza_mare_metri)<=1000;
 if(flag==='piscina')return municipalityModuleHasService(item,['piscina']);
 if(flag==='parcheggio')return municipalityModuleHasService(item,['parcheggio','parking']);
 if(flag==='animali_ammessi')return Boolean(item.animali_ammessi);
 if(flag==='accessibile')return Boolean(item.accessibile);
 if(flag==='adatto_famiglie')return Boolean(item.adatto_famiglie);
 if(flag==='aperto_tutto_anno')return Boolean(item.aperto_tutto_anno);
 if(flag==='wifi')return municipalityModuleHasService(item,['wifi','wi-fi','internet']);
 if(flag==='colazione_inclusa')return municipalityModuleHasService(item,['colazione inclusa','colazione','breakfast']);
 if(flag==='aria_condizionata')return municipalityModuleHasService(item,['aria condizionata','climatizz','air condition']);
 if(flag==='spa_benessere')return municipalityModuleHasService(item,['spa','benessere','wellness','thalasso']);
 return true;
}
function municipalityModuleResolveQuickFilters(config,records){
 return config.booleanFilters.filter(filter=>!filter.optional||records.some(record=>municipalityModuleBooleanPredicate(filter.key,record)));
}
function municipalityModuleHasActiveFilters(filters){
 const selected=Array.isArray(filters.boolean)?filters.boolean:[];
 return Boolean(String(filters.search||'').trim())||selected.length>0;
}
function municipalityModuleCountLabel(count,config){
 const nouns=config.resultNoun||{singular:'risultato trovato',plural:'risultati trovati'};
 return count===1?('1 '+nouns.singular):(count+' '+nouns.plural);
}
function normalizeMunicipalityFilterValue(value){
 return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
}
function municipalityModuleMatches(item,municipalityName,comuneId){
 const comparableValues=[item.comune_id,item.comune,item.municipality,item.comune].filter(Boolean).map(normalizeMunicipalityFilterValue);
 const normalizedMunicipality=normalizeMunicipalityFilterValue(municipalityName);
 const normalizedComuneId=normalizeMunicipalityFilterValue(comuneId);
 return comparableValues.includes(normalizedComuneId)||comparableValues.includes(normalizedMunicipality)||normalizeMunicipalityFilterValue(item.localita||'').includes(normalizedMunicipality)||normalizeMunicipalityFilterValue(item.localita||'').includes(normalizedComuneId);
}
async function loadMunicipalityModuleData(type){
 if(municipalityModuleDataCache[type])return municipalityModuleDataCache[type];
 const file=type==='eat'?'data/ristorazione.json':'data/strutture-ricettive.json';
 try{
  const response=await fetch(file,{cache:'no-store'});
  if(!response.ok)throw new Error('HTTP '+response.status+' caricando '+file);
  const data=await response.json();
  municipalityModuleDataCache[type]=Array.isArray(data)?data:[];
 }catch(error){
  console.warn('Dati del modulo non disponibili:',error);
  municipalityModuleDataCache[type]=[];
 }
 return municipalityModuleDataCache[type];
}
function municipalityModuleChipIcon(value){
 const normalized=String(value||'').toLowerCase();
 if(/mare|spiaggia|vista|lido/.test(normalized))return '🏖';
 if(/cucina|ristor|menu|pizza|pesce|carne|vegetariano|gluten/.test(normalized))return '🍝';
 if(/parche|auto|transit|mobil/.test(normalized))return '🚗';
 if(/animali|pet|cani|dog/.test(normalized))return '🐶';
 if(/accessib|disabil|wheelchair/.test(normalized))return '♿';
 if(/famiglia|bambin|famili/.test(normalized))return '🧒';
 if(/wifi|connessione|internet/.test(normalized))return '📶';
 if(/piscina|spa|trattamen|benessere/.test(normalized))return '🛀';
 if(/colazione|caff|breakfast/.test(normalized))return '☕';
 return '•';
}
function municipalityModuleCardContent(item,config){
 const badge=item.partner_cilentomania?'<span class="module-card__badge">Partner Cilentomania</span>':'';
 const typeLabel=safeTerritoryText(item.categoria||'');
 return '<article class="module-card" data-entity-type="'+safeTerritoryText(config.entityType)+'" data-entity-id="'+safeTerritoryText(item.id||'')+'" data-comune-id="'+safeTerritoryText(item.comune_id||'')+'" data-category="'+safeTerritoryText(item.categoria||'')+'" data-localita="'+safeTerritoryText(item.localita||'')+'"><div class="module-card__media"><img src="'+safeTerritoryText(item.immagine_copertina||item.image||'assets/placeholder-comune.svg')+'" alt="'+safeTerritoryText(item.nome||'Attività')+'" loading="lazy" onerror="this.style.display=\'none\'"></div><div class="module-card__copy"><h3>'+safeTerritoryText(item.nome||'')+'</h3><div class="module-card__meta-row"><span class="module-card__type">'+typeLabel+'</span>'+badge+'</div><p class="module-card__location">'+safeTerritoryText(item.localita||'')+'</p><button class="module-card__cta" type="button" data-module-discover="'+safeTerritoryText(item.id||'')+'">Scopri</button></div></article>';
}
function municipalityModuleResultsHtml(records,config,municipalityName,comuneId,showReset=false){
 const cards=records.map(item=>municipalityModuleCardContent(item,config)).join('');
 const emptyActions=showReset?'<button class="module-reset" type="button" data-module-reset-filters data-module-reset-empty>Azzera filtri</button>':'';
 return '<div class="module-experience__results-grid" data-module-results-grid>'+(cards||'<div class="module-empty" role="status"><h3>Nessun risultato</h3><p>Prova a rimuovere uno o più filtri per ampliare la ricerca.</p>'+emptyActions+'</div>')+'</div>';
}
function municipalityModuleFilterHtml(config,records,filters={}){
 const searchValue=String(filters.search||'');
 const booleanSelection=Array.isArray(filters.boolean)?filters.boolean:[];
 const quickFilters=municipalityModuleResolveQuickFilters(config,records);
 const hasActiveFilters=municipalityModuleHasActiveFilters(filters);
 const quickFilterMarkup=quickFilters.map(filter=>'<button class="module-filter-pill" type="button" data-module-boolean="'+safeTerritoryText(filter.key)+'" aria-pressed="'+String(booleanSelection.includes(filter.key))+'">'+safeTerritoryText(filter.label)+'</button>').join('');
 return '<div class="module-experience__filters" data-module-filters><div class="module-filter-search"><label class="sr-only" for="moduleSearch">Ricerca</label><input id="moduleSearch" type="search" data-module-search value="'+safeTerritoryText(searchValue)+'" placeholder="'+safeTerritoryText(config.placeholder)+'" aria-label="Ricerca libera"></div><div class="module-filter-quick"><p class="module-filter-quick-title">Filtri rapidi</p><div class="module-filter-quick-list">'+quickFilterMarkup+'</div></div><button class="module-reset'+(hasActiveFilters?'':' hidden')+'" type="button" data-module-reset-filters>Azzera filtri</button></div>';
}
function municipalityModuleViewHtml(type,municipalityName,comuneId,records,filters={}){
 const config=municipalityModuleConfig(type);
 const title=config.titlePrefix+' '+municipalityName;
 const count=records.length;
 const resolvedComuneId=String(comuneId || municipalitySlug(municipalityName));
 return '<section class="module-experience" data-module-experience data-module-type="'+safeTerritoryText(type)+'" data-municipality-name="'+safeTerritoryText(municipalityName)+'" data-comune-id="'+safeTerritoryText(resolvedComuneId)+'" data-entity-type="'+safeTerritoryText(config.entityType)+'" data-module-view-root><div class="module-experience__header"><p class="module-experience__kicker">Sezione dedicata</p><h2>'+safeTerritoryText(title)+'</h2><p class="module-experience__intro">'+safeTerritoryText(config.intro)+'</p><div class="module-experience__meta"><span class="module-experience__count" data-module-count>'+safeTerritoryText(municipalityModuleCountLabel(count,config))+'</span></div></div>'+municipalityModuleFilterHtml(config,records,filters)+municipalityModuleResultsHtml(records,config,municipalityName,comuneId,municipalityModuleHasActiveFilters(filters))+'</section>';
}
function municipalityModuleFilterRecords(records,filters,config){
 const searchValue=normalizeMunicipalityModuleText(filters.search||'');
 const localityValue=String(filters.locality||'').trim();
 const categoryValue=String(filters.category||'').trim();
 const priceValue=String(filters.price||'').trim();
 const booleanFilters=filters.boolean||[];
 return records.filter(item=>{
  const haystack=normalizeMunicipalityModuleText([
   item.nome,
   item.localita,
   item.categoria,
   item.descrizione_breve,
   item.descrizione_completa,
   municipalityModuleAsArray(item.servizi).join(' '),
   municipalityModuleAsArray(item.tipologie_cucina).join(' ')
  ].filter(Boolean).join(' '));
  const matchesSearch=!searchValue||haystack.includes(searchValue);
  const matchesLocality=!localityValue||String(item.localita||'').trim()===localityValue;
  const matchesCategory=!categoryValue||String(item.categoria||'').trim()===categoryValue;
  const matchesPrice=!priceValue||String(item.fascia_prezzo||'').trim()===priceValue;
  const matchesBoolean=booleanFilters.every(flag=>municipalityModuleBooleanPredicate(flag,item));
  return matchesSearch&&matchesLocality&&matchesCategory&&matchesPrice&&matchesBoolean;
 });
}
function municipalityModuleDetailHtml(item,config,municipalityName,comuneId){
 const defServices=(Array.isArray(item.servizi)?item.servizi:[]).filter(Boolean);
 const defServicesHighlight=(Array.isArray(item.servizi_in_evidenza)?item.servizi_in_evidenza:[]).filter(Boolean);
 const defRawGallery=(Array.isArray(item.galleria)?item.galleria:[]).filter(Boolean);
 const defAccessibility=(Array.isArray(item.accessibilita_dettagli)?item.accessibilita_dettagli:[]).filter(Boolean);
 const defPractical=[['Indirizzo',item.indirizzo],['Periodo di apertura',item.periodo_apertura],['Fascia di prezzo',item.fascia_prezzo],['Animali ammessi',item.animali_ammessi? 'Sì':''],['Accessibilità',defAccessibility.length?defAccessibility.join(' · '):''],['Aperto tutto l’anno',item.aperto_tutto_anno? 'Sì':'']].filter(([,value])=>Boolean(value)).map(([label,value])=>'<p class="module-detail__practical-item"><strong>'+safeTerritoryText(label)+'</strong><br>'+safeTerritoryText(value)+'</p>').join('');
 const defHeroImage=item.immagine_copertina||item.image||'';
 const defBadge=item.partner_cilentomania?'<span class="module-card__badge">Partner Cilentomania</span>':'';
 const defLocation=item.localita?'<p class="module-detail__meta">'+safeTerritoryText(item.localita)+'</p>':'';
 const defName=safeTerritoryText(item.nome||'');
 const defType=safeTerritoryText(item.categoria||'');
 const defActionLinks=buildMunicipalityDetailActions(item);
 const defActionsMarkup=defActionLinks.length?defActionLinks.join(''):'<span class="module-detail__empty">Contatti e indicazioni non disponibili al momento.</span>';
 const defBackState=safeTerritoryText(JSON.stringify(municipalityModuleNavigationState||buildMunicipalityModuleNavigationState(config.entityType==='restaurant'?'eat':'sleep',municipalityName||'',comuneId||municipalitySlug(municipalityName),{search:'',locality:'',category:'',price:'',boolean:[]},0)));
 const defDetailServices=[...defServicesHighlight,...defServices].filter(Boolean);
 const defServicesMarkup=defDetailServices.length?'<div class="module-detail__service-badges">'+defDetailServices.map(service=>'<span class="module-detail__service-badge">'+safeTerritoryText(service)+'</span>').join('')+'</div>':'<div class="module-detail__service-empty">Nessun servizio disponibile.</div>';
 const defGallerySources=[];
 const defGallerySeen=new Set();
 defRawGallery.forEach(source=>{
  const normalized=String(source||'').trim();
  if(!normalized||defGallerySeen.has(normalized)||normalized===defHeroImage)return;
  defGallerySeen.add(normalized);
  defGallerySources.push(normalized);
 });
 const defGalleryMarkup=municipalityModuleGalleryMarkup(defGallerySources.slice(0,9),item.nome||'Galleria')+'<div class="module-detail-lightbox hidden" data-module-lightbox role="dialog" aria-modal="true" aria-label="Immagine ingrandita"><button class="module-detail-lightbox__close" type="button" data-module-lightbox-close aria-label="Chiudi immagine">×</button><div class="module-detail-lightbox__content"><img src="" alt="" data-module-lightbox-image></div></div>';
 const defDistanceMarkup=municipalityModuleDetailDistanceMarkup(item);
 return '<div class="module-detail" data-module-detail-root data-entity-type="'+safeTerritoryText(config.entityType)+'" data-entity-id="'+safeTerritoryText(item.id||'')+'" data-comune-id="'+safeTerritoryText(comuneId||municipalitySlug(municipalityName))+'" data-localita="'+safeTerritoryText(item.localita||'')+'" data-category="'+safeTerritoryText(item.categoria||'')+'" data-latitude="'+safeTerritoryText(item.latitudine||'')+'" data-longitude="'+safeTerritoryText(item.longitudine||'')+'"><div class="module-detail__topbar module-detail__sticky"><button class="territory-back" type="button" data-action="back-to-module-list" data-module-back-results data-module-back-type="'+safeTerritoryText(config.entityType==='restaurant'?'eat':'sleep')+'" data-module-back-municipality="'+safeTerritoryText(municipalityName||'')+'" data-module-back-comune-id="'+safeTerritoryText(comuneId||municipalitySlug(municipalityName))+'" data-module-back-state="'+defBackState+'">← '+safeTerritoryText(config.entityType==='restaurant'?'Torna a Dove mangiare':'Torna a Dove dormire')+'</button></div><header class="module-detail__head"><h2>'+defName+'</h2><p class="module-detail__type">'+defType+'</p>'+defLocation+defBadge+'</header><div class="module-detail__hero-media">'+municipalityModuleHeroMarkup(defHeroImage,item.nome||'')+'</div>'+defGalleryMarkup+(defDetailServices.length?'<section class="module-detail__section"><h3>Servizi</h3>'+defServicesMarkup+'</section>':'')+'<section class="module-detail__section"><h3>Presentazione</h3><p class="module-detail__description">'+safeTerritoryText(item.descrizione_completa||item.descrizione_breve||'')+'</p></section><section class="module-detail__section"><h3>Informazioni pratiche</h3><div class="module-detail__info">'+defPractical+defDistanceMarkup+'</div></section><div class="module-detail__actions module-detail__actions--final" aria-label="Azioni finali">'+defActionsMarkup+'</div></div>';
 const services=(Array.isArray(item.servizi)?item.servizi:[]).filter(Boolean);
 const servicesHighlight=(Array.isArray(item.servizi_in_evidenza)?item.servizi_in_evidenza:[]).filter(Boolean);
 const rawGallery=(Array.isArray(item.galleria)?item.galleria:[]).filter(Boolean);
 const idealFor=(Array.isArray(item.ideale_per)?item.ideale_per:[]).filter(Boolean);
 const roomTypes=(Array.isArray(item.tipologie_camere)?item.tipologie_camere:[]).filter(Boolean);
 const treatments=(Array.isArray(item.trattamenti_disponibili)?item.trattamenti_disponibili:[]).filter(Boolean);
 const experiences=(Array.isArray(item.esperienze_interne)?item.esperienze_interne:[]).filter(Boolean);
 const accessibility=(Array.isArray(item.accessibilita_dettagli)?item.accessibilita_dettagli:[]).filter(Boolean);
 const distances=(Array.isArray(item.distanze_utili)?item.distanze_utili:[]).filter(Boolean);
 const practical=[['Indirizzo',item.indirizzo],['Località',item.localita],['Periodo di apertura',item.periodo_apertura],['Fascia di prezzo',item.fascia_prezzo],['Accessibilità',accessibility.length?accessibility.join(' · '):''],['Animali ammessi',item.animali_ammessi? 'Sì':''],['Aperto tutto l’anno',item.aperto_tutto_anno? 'Sì':''],['Distanza dal mare',item.distanza_mare_metri?String(item.distanza_mare_metri)+' m':''],['Altre distanze',distances.length?distances.join(' · '):'']].filter(([,value])=>Boolean(value)).map(([label,value])=>'<p><strong>'+safeTerritoryText(label)+'</strong><br>'+safeTerritoryText(value)+'</p>').join('');
 const heroImage=item.immagine_copertina||item.image||'assets/placeholder-comune.svg';
 const claim=item.claim?'<p class="module-detail__claim">'+safeTerritoryText(item.claim)+'</p>':'';
 const badge=item.partner_cilentomania?'<span class="module-card__badge">Partner Cilentomania</span>':'';
 const locationMeta=item.localita?'<p class="module-detail__meta">'+safeTerritoryText(item.localita)+'</p>':'';
 const actionLinks=buildMunicipalityDetailActions(item);
 const actionsMarkup=actionLinks.length?actionLinks.join(''):'<span class="module-detail__empty">Contatti e indicazioni non disponibili al momento.</span>';
 const detailServices=[...servicesHighlight,...services].filter(Boolean);
 const servicesMarkup=detailServices.length?'<div class="module-detail__service-badges">'+detailServices.map(service=>'<span class="module-detail__service-badge">'+safeTerritoryText(service)+'</span>').join('')+'</div>':'<div class="module-detail__service-empty">Nessun servizio disponibile.</div>';
 const galleryItems=[];
 const seenGallerySources=new Set();
 rawGallery.forEach(source=>{
  const normalized=String(source||'').trim();
  if(!normalized||seenGallerySources.has(normalized))return;
  seenGallerySources.add(normalized);
  galleryItems.push(normalized);
 });
 const filteredGallery=galleryItems.filter(source=>source!==heroImage).slice(0,9);
 const galleryMarkup=filteredGallery.length?'<div class="module-detail__gallery-grid" data-module-gallery>'+filteredGallery.map((image,index)=>'<button class="module-detail__gallery-item" type="button" data-module-gallery-open="'+index+'" aria-label="Apri immagine '+(index+1)+' di '+filteredGallery.length+'"><img src="'+safeTerritoryText(image)+'" alt="'+safeTerritoryText(item.nome||'Galleria')+' - Foto '+(index+1)+'" loading="lazy"></button>').join('')+'</div><div class="module-detail-lightbox hidden" data-module-lightbox role="dialog" aria-modal="true" aria-label="Immagine ingrandita"><button class="module-detail-lightbox__close" type="button" data-module-lightbox-close aria-label="Chiudi immagine">×</button><div class="module-detail-lightbox__content"><img src="" alt="" data-module-lightbox-image></div></div>':'';
 const linkedSections=[
  ['Cosa vedere nei dintorni', Array.isArray(item.luoghi_vicini_ids)&&item.luoghi_vicini_ids.length?'<div class="module-linked-list"><p>Collegamenti territoriali disponibili.</p></div>':'' ],
  ['Esperienze consigliate', Array.isArray(item.esperienze_collegate_ids)&&item.esperienze_collegate_ids.length?'<div class="module-linked-list"><p>Collegamenti esperienziali disponibili.</p></div>':'' ],
  ['Eventi vicino a te', Array.isArray(item.eventi_collegati_ids)&&item.eventi_collegati_ids.length?'<div class="module-linked-list"><p>Eventi collegati disponibili.</p></div>':'' ],
  ['Dove mangiare nei dintorni', Array.isArray(item.ristoranti_collegati_ids)&&item.ristoranti_collegati_ids.length?'<div class="module-linked-list"><p>Ristoranti collegati disponibili.</p></div>':'' ],
  ['Itinerari consigliati', Array.isArray(item.itinerari_collegati_ids)&&item.itinerari_collegati_ids.length?'<div class="module-linked-list"><p>Itinerari collegati disponibili.</p></div>':'' ],
  ['Infopoint più vicino', Array.isArray(item.infopoint_collegati_ids)&&item.infopoint_collegati_ids.length?'<div class="module-linked-list"><p>Infopoint collegati disponibili.</p></div>':'' ]
 ].filter(([,content])=>Boolean(content)).map(([title,content])=>'<section class="module-detail__section"><h3>'+safeTerritoryText(title)+'</h3>'+content+'</section>').join('');
 return '<div class="module-detail" data-entity-type="'+safeTerritoryText(config.entityType)+'" data-entity-id="'+safeTerritoryText(item.id||'')+'" data-comune-id="'+safeTerritoryText(comuneId||municipalitySlug(municipalityName))+'" data-localita="'+safeTerritoryText(item.localita||'')+'" data-category="'+safeTerritoryText(item.categoria||'')+'" data-view="accommodation-detail"><div class="module-detail__topbar"><button class="territory-back" type="button" data-action="back-to-module-list" data-module-back-results data-module-back-type="'+safeTerritoryText(config.entityType==='restaurant'?'eat':'sleep')+'" data-module-back-municipality="'+safeTerritoryText(municipalityName||'')+'" data-module-back-comune-id="'+safeTerritoryText(comuneId||municipalitySlug(municipalityName))+'">← '+safeTerritoryText(config.entityType==='restaurant'?'Torna a Dove mangiare':'Torna a Dove dormire')+'</button></div><header class="module-detail__head"><h2>'+safeTerritoryText(item.nome||'')+'</h2><p class="module-detail__type">'+safeTerritoryText(item.categoria||'')+'</p>'+locationMeta+badge+claim+'</header><div class="module-detail__hero-media"><img class="module-detail__cover" src="'+safeTerritoryText(heroImage)+'" alt="'+safeTerritoryText(item.nome||'Struttura')+'" loading="lazy" onerror="this.style.display=\'none\'"></div>'+galleryMarkup+'<section class="module-detail__contact" aria-label="Contatti e indicazioni"><h3 class="module-detail__actions-title">Contatti e indicazioni</h3><div class="module-detail__actions module-detail__actions--hero">'+actionsMarkup+'</div></section><div class="module-detail__body"><section class="module-detail__section"><h3>Presentazione</h3><p class="module-detail__description">'+safeTerritoryText(item.descrizione_completa||item.descrizione_breve||'')+'</p></section>'+(detailServices.length?'<section class="module-detail__section"><h3>Servizi</h3>'+servicesMarkup+'</section>':'')+(idealFor.length?'<section class="module-detail__section"><h3>Ideale per</h3><div class="module-detail__chips">'+idealFor.map(value=>'<span class="module-chip">'+safeTerritoryText(value)+'</span>').join('')+'</div></section>':'')+(roomTypes.length||treatments.length||experiences.length?'<section class="module-detail__section"><h3>Camere e trattamenti</h3><div class="module-detail__stack">'+(roomTypes.length?'<div><strong>Tipologie camere</strong><ul class="module-card__services">'+roomTypes.map(value=>'<li>'+safeTerritoryText(value)+'</li>').join('')+'</ul></div>':'')+(treatments.length?'<div><strong>Trattamenti disponibili</strong><ul class="module-card__services">'+treatments.map(value=>'<li>'+safeTerritoryText(value)+'</li>').join('')+'</ul></div>':'')+(experiences.length?'<div><strong>Esperienze interne</strong><ul class="module-card__services">'+experiences.map(value=>'<li>'+safeTerritoryText(value)+'</li>').join('')+'</ul></div>':'')+'</div></section>':'')+'<section class="module-detail__section"><h3>Informazioni pratiche</h3><div class="module-detail__info">'+practical+'</div></section>'+(linkedSections?'<section class="module-detail__section"><h3>Collegamenti al territorio</h3>'+linkedSections+'</section>':'')+'</div></div>';
}

function bindMunicipalityDetailGalleryLightbox(){
 const detailPanel=panelContent||document.documentElement;
 if(detailPanel.dataset.moduleDetailLightboxBound==='true')return;
 const closeCurrentLightbox=()=>{
  const currentLightbox=detailPanel.querySelector('[data-module-lightbox]:not(.hidden)');
  if(!currentLightbox)return;
  const currentImage=currentLightbox.querySelector('[data-module-lightbox-image]');
  currentLightbox.classList.add('hidden');
  if(currentImage){
   currentImage.src='';
   currentImage.alt='';
  }
  document.removeEventListener('keydown',onDetailKeyDown);
 };
 const onDetailKeyDown=event=>{
  if(event.key==='Escape'){
   event.preventDefault();
   closeCurrentLightbox();
  }
 };
 detailPanel.addEventListener('click',event=>{
  const galleryButton=event.target.closest('[data-module-gallery-open]');
  const currentLightbox=detailPanel.querySelector('[data-module-lightbox]');
  if(galleryButton&&currentLightbox){
   const source=galleryButton.querySelector('img');
   if(!source)return;
   const currentImage=currentLightbox.querySelector('[data-module-lightbox-image]');
   const closeButton=currentLightbox.querySelector('[data-module-lightbox-close]');
   if(!currentImage||!closeButton)return;
   currentImage.src=source.getAttribute('src')||'';
   currentImage.alt=source.getAttribute('alt')||'';
   currentLightbox.classList.remove('hidden');
   document.addEventListener('keydown',onDetailKeyDown);
   closeButton.focus({preventScroll:true});
   return;
  }
  if(currentLightbox&&event.target===currentLightbox)closeCurrentLightbox();
 });
 detailPanel.addEventListener('click',event=>{
  const closeButton=event.target.closest('[data-module-lightbox-close]');
  if(closeButton)closeCurrentLightbox();
 });
 detailPanel.dataset.moduleDetailLightboxBound='true';
}
async function openMunicipalityModule(type,municipalityName,comuneId,state={}){
 const records=await loadMunicipalityModuleData(type);
 const config=municipalityModuleConfig(type);
 const initialFilters=state.filters||{search:'',locality:'',category:'',price:'',boolean:[]};
 const filteredRecords=municipalityModuleFilterRecords(records,initialFilters,config).filter(item=>municipalityModuleMatches(item,municipalityName,comuneId));
 const title=type==='eat'?'Dove mangiare a '+municipalityName:'Dove dormire a '+municipalityName;
 openPanel(title,municipalityModuleViewHtml(type,municipalityName,comuneId,filteredRecords,initialFilters));
 const container=panelContent.querySelector('[data-module-experience]');
 if(container){
  container.setAttribute('data-module-records',JSON.stringify(records.filter(item=>municipalityModuleMatches(item,municipalityName,comuneId))));
  container.setAttribute('data-module-filters',JSON.stringify(initialFilters));
  bindMunicipalityModuleInteractions(container);
  const scrollTop=Number(state.scrollTop||0);
  setTimeout(()=>{
   requestAnimationFrame(()=>{
     overlay.scrollTo({top:scrollTop,left:0,behavior:'auto'});
   });
  },50);
 }
}
function municipalityModuleCollectFilters(root){
 const search=root.querySelector('[data-module-search]');
 const booleans=root.querySelectorAll('[data-module-boolean]');
 return {search:search?.value||'',locality:'',category:'',price:'',boolean:Array.from(booleans).filter(button=>button.getAttribute('aria-pressed')==='true').map(button=>button.getAttribute('data-module-boolean'))};
}
function bindMunicipalityModuleInteractions(root){
 if(!root)return;
 const search=root.querySelector('[data-module-search]');
 const booleans=root.querySelectorAll('[data-module-boolean]');
 const resetButtons=root.querySelectorAll('[data-module-reset-filters]');
 const bindDiscoverButtons=()=>{
  root.querySelectorAll('[data-module-discover]').forEach(button=>{
   button.addEventListener('pointerdown',()=>{
    const navigationState=buildMunicipalityModuleNavigationState(root.getAttribute('data-module-type')||'sleep',root.dataset.municipalityName||'',root.dataset.comuneId||'',municipalityModuleCollectFilters(root),overlay.scrollTop);
    button.dataset.moduleBackState=JSON.stringify(navigationState);
   });
   button.addEventListener('click',()=>{
   const itemId=button.getAttribute('data-module-discover');
   const records=JSON.parse(root.getAttribute('data-module-records')||'[]');
   const config=municipalityModuleConfig(root.getAttribute('data-module-type')||'sleep');
   const item=records.find(record=>String(record.id)===String(itemId));
   if(item){
    let navigationState=null;
    if(button.dataset.moduleBackState){
     try{navigationState=JSON.parse(button.dataset.moduleBackState);}catch(error){navigationState=null;}
    }
    navigationState=navigationState||buildMunicipalityModuleNavigationState(root.getAttribute('data-module-type')||'sleep',root.dataset.municipalityName||'',root.dataset.comuneId||'',municipalityModuleCollectFilters(root),overlay.scrollTop);
    setMunicipalityModuleNavigationState(navigationState);
    openPanel('',municipalityModuleDetailHtml(item,config,root.dataset.municipalityName||'',root.dataset.comuneId||''));
    bindMunicipalityDetailGalleryLightbox();
    requestAnimationFrame(()=>{
     overlay.scrollTo({top:0,left:0,behavior:'auto'});
     panelContent.closest('.panel')?.scrollTo({top:0,left:0,behavior:'auto'});
     const detailRoot=panelContent.querySelector('[data-module-detail-root]');
     if(detailRoot)updateMunicipalityModuleDistance(detailRoot,item);
    });
   }
   });
  });
 };
 const updateResults=()=>{
  const records=JSON.parse(root.getAttribute('data-module-records')||'[]');
  const filters=municipalityModuleCollectFilters(root);
  root.setAttribute('data-module-filters',JSON.stringify(filters));
  const config=municipalityModuleConfig(root.getAttribute('data-module-type')||'sleep');
  const filtered=municipalityModuleFilterRecords(records,filters,config);
  const hasActiveFilters=municipalityModuleHasActiveFilters(filters);
  const results=root.querySelector('[data-module-results-grid]');
  if(results){
   results.outerHTML=municipalityModuleResultsHtml(filtered,config,root.dataset.municipalityName||'',root.dataset.comuneId||'',hasActiveFilters);
  }
  const count=root.querySelector('[data-module-count]');
  if(count)count.textContent=municipalityModuleCountLabel(filtered.length,config);
  root.querySelectorAll('[data-module-reset-filters]').forEach(button=>button.classList.toggle('hidden',!hasActiveFilters));
  bindDiscoverButtons();
 };
 [search].filter(Boolean).forEach(control=>control.oninput=null);
 [search].filter(Boolean).forEach(control=>control.addEventListener('input',updateResults));
 booleans.forEach(control=>{
  control.onclick=null;
  control.addEventListener('click',()=>{
   const isPressed=control.getAttribute('aria-pressed')==='true';
   control.setAttribute('aria-pressed',String(!isPressed));
   updateResults();
  });
 });
 resetButtons.forEach(button=>{
  button.onclick=null;
  button.addEventListener('click',()=>{
   if(search)search.value='';
   root.querySelectorAll('[data-module-boolean]').forEach(control=>control.setAttribute('aria-pressed','false'));
   updateResults();
   if(search)search.focus({preventScroll:true});
  });
 });
 bindDiscoverButtons();
 root.querySelectorAll('[data-module-back-results]').forEach(button=>{button.onclick=null;button.addEventListener('click',()=>{
  const state=municipalityModuleNavigationState||buildMunicipalityModuleNavigationState(root.getAttribute('data-module-type')||'sleep',root.dataset.municipalityName||'',root.dataset.comuneId||'',municipalityModuleCollectFilters(root),overlay.scrollTop);
  openMunicipalityModule(state.type||'sleep',state.municipalityName||'',state.comuneId||'',state);
 });});
}
function municipalitySectionHtml(type,name){
 const labels={sights:'Cosa vedere',events:'Eventi ed esperienze',eat:'Dove mangiare',sleep:'Dove dormire'};
 let content='';
 if(type==='sights'){
  const matches=featured.filter(item=>item[1]===name);
  content=matches.length?'<div class="panel-grid">'+matches.map(item=>'<article class="item"><h3>'+safeTerritoryText(item[0])+'</h3><p>'+safeTerritoryText(item[3])+'</p></article>').join('')+'</div>':'<div class="notice">Nessun contenuto verificato disponibile per questo Comune.</div>';
 }
 if(type==='events'){
  if(typeof eventsArchive!=='undefined'&&!eventsArchive.length&&typeof embeddedEvents!=='undefined')eventsArchive=[...embeddedEvents];
  const events=typeof activeEvents==='function'?activeEvents().filter(event=>event.municipality===name):[];
    const experiences=typeof seasonalEventProjects!=='undefined'?seasonalEventProjects.filter(item=>item.municipality===name||String(item.place||'').includes(name)):[];
  const eventHtml=events.length?'<div class="events-grid">'+events.map(eventCard).join('')+'</div>':'';
  const experienceHtml=experiences.length?'<div class="panel-grid">'+experiences.map(item=>'<article class="item"><h3>'+safeTerritoryText(item.title)+'</h3><p>'+safeTerritoryText(item.description)+'</p></article>').join('')+'</div>':'';
  content=eventHtml+experienceHtml||'<div class="notice">Nessun evento o esperienza verificata disponibile per questo Comune.</div>';
 }
 if(type==='eat'||type==='sleep'){
  const records=municipalityModuleRecords(type,name);
  const cards=municipalityModuleCards(records);
  content=cards?'<div class="panel-grid">'+cards+'</div>':'<div class="notice">Nessun contenuto verificato disponibile per questo Comune.</div>';
 }
 return '<button class="territory-back" type="button" data-municipality-back="'+safeTerritoryText(name)+'">← Torna alla scheda</button><section class="territory-filtered" data-hub-section="'+safeTerritoryText(type==='sights'?'territory':type==='events'?'events':type)+'" data-municipality-name="'+safeTerritoryText(name)+'"><p class="territory-filter-label">Risultati esclusivi per '+safeTerritoryText(name)+'</p><h2>'+labels[type]+'</h2>'+content+'</section>';
}
function bindTerritoryInteractions(){
 bindTerritoryGallery();
 bindMunicipalityDetailGalleryLightbox();
 const municipalityBack=document.querySelector('[data-municipality-back]');if(municipalityBack)municipalityBack.addEventListener('click',()=>openTerritoryMunicipality(municipalityBack.dataset.municipalityBack));
 document.querySelectorAll('[data-municipality-action]').forEach(button=>button.addEventListener('click',()=>{
  const action=button.dataset.municipalityAction;
  const municipality=button.dataset.municipality||'';
  const comuneId=button.dataset.comuneId||municipalitySlug(municipality);
  if(action==='eat'||action==='sleep'){
   openMunicipalityModule(action,municipality,comuneId);
  }else{
   openPanel('',municipalitySectionHtml(action,municipality));
  }
 }));
 const toggle=document.querySelector('[data-infopoint-toggle]');
 const panel=document.querySelector('[data-infopoint-panel]');
 if(!toggle||!panel)return;
 const setOpen=open=>{panel.classList.toggle('hidden',!open);toggle.setAttribute('aria-expanded',String(open));if(open)panel.scrollIntoView({behavior:'smooth',block:'nearest'});};
 toggle.addEventListener('click',()=>setOpen(toggle.getAttribute('aria-expanded')!=='true'));
 const close=document.querySelector('[data-infopoint-close]');if(close)close.addEventListener('click',()=>setOpen(false));
}
function scrollNavigationDockToTop(){
 if(!territoryNavigationScrollTarget)return;
 const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 territoryNavigationScrollTarget.scrollTo({top:0,left:0,behavior:reducedMotion?'auto':'smooth'});
}
function updateNavigationDockPosition(){
 const navigation=overlay.querySelector('[data-territory-fixed-nav]');
 const panel=panelContent.closest('.panel');
 if(!navigation||navigation.hidden||!panel)return;
 const panelRight=panel.getBoundingClientRect().right;
 const navigationWidth=Math.max(navigation.offsetWidth||44,44);
 const viewportGutter=8;
 const safeLeft=Math.max(viewportGutter,Math.min(panelRight+6,window.innerWidth-navigationWidth-viewportGutter));
 navigation.style.setProperty('--territory-nav-left',safeLeft+'px');
}
function ensureNavigationDock(){
 let navigation=overlay.querySelector('[data-territory-fixed-nav]');
 if(navigation)return navigation;
 overlay.insertAdjacentHTML('beforeend','<nav class="navigation-dock territory-fixed-nav" data-navigation-dock data-territory-fixed-nav data-scroll-container="active" aria-label="Navigazione Esplora il Territorio" hidden><button class="scroll-navigation-button territory-fixed-button hidden" type="button" data-territory-fixed-back data-navigation-action="back" aria-label="Torna ai Comuni" title="Torna ai Comuni"><span aria-hidden="true">←</span></button><button class="scroll-navigation-button territory-fixed-button territory-fixed-top hidden" type="button" data-territory-fixed-top data-navigation-action="top" aria-label="Torna su" title="Torna su"><span aria-hidden="true">↑</span></button><button class="scroll-navigation-button territory-fixed-button" type="button" data-territory-fixed-close data-navigation-action="close" aria-label="Chiudi" title="Chiudi"><span aria-hidden="true">✕</span></button></nav>');
 navigation=overlay.querySelector('[data-territory-fixed-nav]');
 navigation.querySelector('[data-territory-fixed-back]').addEventListener('click',()=>{
 const municipality=navigation.dataset.backMunicipality;
  if(navigation.dataset.returnToModal==='true'&&modalReturnHtml)openPanel('',modalReturnHtml);
  else if(municipality)openTerritoryMunicipality(municipality);
  else openTerritoryList();
 });
 navigation.querySelector('[data-territory-fixed-top]').addEventListener('click',scrollNavigationDockToTop);
 navigation.querySelector('[data-territory-fixed-close]').addEventListener('click',()=>{
  closePanel();
 });
 window.addEventListener('resize',updateNavigationDockPosition,{passive:true});
 return navigation;
}
function configureNavigationDock(level,backMunicipality=''){
 if(territoryNavigationScrollTarget&&territoryNavigationScrollHandler)territoryNavigationScrollTarget.removeEventListener('scroll',territoryNavigationScrollHandler);
 territoryNavigationScrollTarget=null;territoryNavigationScrollHandler=null;
 const existingNavigation=overlay.querySelector('[data-territory-fixed-nav]');
 if(existingNavigation)existingNavigation.hidden=true;
 overlay.classList.remove('territory-fixed-nav-open');
 if(!level)return;
 const isMunicipality=level==='municipality';
 const isFiltered=level==='filtered';
 const isModalReturn=level==='modal-return';
 const navigation=ensureNavigationDock();
 const backButton=navigation.querySelector('[data-territory-fixed-back]');
 const topButton=navigation.querySelector('[data-territory-fixed-top]');
 territoryNavigationScrollTarget=isMunicipality?panelContent.closest('.panel'):overlay;
 navigation.dataset.level=level;
 navigation.dataset.backMunicipality=isFiltered?backMunicipality:'';
 navigation.dataset.returnToModal=String(isModalReturn);
 backButton.classList.toggle('hidden',!isMunicipality&&!isFiltered&&!isModalReturn);
 topButton.classList.remove('hidden');
 navigation.hidden=false;
 overlay.classList.add('territory-fixed-nav-open');
 updateNavigationDockPosition();
 territoryNavigationScrollHandler=()=>{
  const nearTop=territoryNavigationScrollTarget.scrollTop<300;
  topButton.classList.toggle('hidden',nearTop);
  updateNavigationDockPosition();
 };
 territoryNavigationScrollTarget.addEventListener('scroll',territoryNavigationScrollHandler,{passive:true});
 territoryNavigationScrollHandler();
}
function openPanel(title,html){
 const wasOpen=overlay.classList.contains('open');
 panelContent.innerHTML=(title?'<h2>'+title+'</h2>':'')+html;
 bindTerritoryImages(panelContent);
 bindMunicipalityModuleBackDelegation();
 const municipalityToolbar=panelContent.querySelector('[data-municipality-toolbar]');
 const isMunicipalitySheet=Boolean(municipalityToolbar);
 const isTerritoryList=Boolean(panelContent.querySelector('.territory-grid'));
 const filteredBack=panelContent.querySelector('[data-municipality-back]');
 const modalReturn=panelContent.querySelector('[data-modal-return]');
 if(municipalityToolbar)municipalityToolbar.remove();
 overlay.classList.toggle('territory-sheet-open',isMunicipalitySheet);
 if(!wasOpen)lockPageScroll();
 overlay.classList.add('open');
 if(isMunicipalitySheet){
  overlay.scrollTop=0;panelContent.closest('.panel')?.scrollTo({top:0,left:0,behavior:'auto'});
  requestAnimationFrame(()=>document.querySelector('[data-territory-fixed-back]')?.focus({preventScroll:true}));
 }
 configureNavigationDock(isMunicipalitySheet?'municipality':(isTerritoryList?'list':(filteredBack?'filtered':(modalReturn?'modal-return':'generic'))),filteredBack?.dataset.municipalityBack||'');
 setTimeout(()=>{bindTownFilter();bindTerritoryInteractions();},0);
}
function lockPageScroll(){
 if(pageScrollLocked)return;
 lockedPageScrollY=window.scrollY||document.documentElement.scrollTop||0;
 const scrollbarWidth=Math.max(0,window.innerWidth-document.documentElement.clientWidth);
 lockedBodyStyles={position:document.body.style.position,top:document.body.style.top,left:document.body.style.left,right:document.body.style.right,width:document.body.style.width,overflow:document.body.style.overflow,paddingRight:document.body.style.paddingRight};
 document.body.style.position='fixed';document.body.style.top='-'+lockedPageScrollY+'px';
 document.body.style.left='0';document.body.style.right='0';document.body.style.width='100%';document.body.style.overflow='hidden';
 if(scrollbarWidth)document.body.style.paddingRight=scrollbarWidth+'px';
 pageScrollLocked=true;
}
function unlockPageScroll(){
 if(!pageScrollLocked)return;
 const styles=lockedBodyStyles||{};
 Object.keys(styles).forEach(property=>{document.body.style[property]=styles[property]||'';});
 const previousBehavior=document.documentElement.style.scrollBehavior;
 document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,lockedPageScrollY);document.documentElement.style.scrollBehavior=previousBehavior;
 pageScrollLocked=false;lockedBodyStyles=null;
}
function closePanel(){configureNavigationDock(null);overlay.classList.remove('open','territory-sheet-open');overlay.scrollTop=0;unlockPageScroll();}
function bindTownFilter(){
 const f=document.getElementById('townFilter'); if(!f)return;
 const selector=document.getElementById('townList');
 const selectorContext=selector?.dataset.townSelectorContext||'explore';
 const selectorModuleType=selector?.dataset.moduleType||'';
 f.addEventListener('input',()=>{
  const q=f.value.trim().toLowerCase();
  const options=document.querySelectorAll('#townList .town,#townList .territory-card');
  let visible=0;
  options.forEach(option=>{const match=(option.dataset.name||option.dataset.search||'').includes(q);option.classList.toggle('hidden',!match);if(match)visible++;});
  const empty=document.getElementById('territoryEmpty');if(empty)empty.classList.toggle('hidden',visible>0);
 });
 document.querySelectorAll('#townList .town').forEach(button=>button.addEventListener('click',()=>{
  const municipality=button.textContent.trim();
  modalReturnHtml=panelContent.innerHTML;
  if(selectorContext==='home-module'&&selectorModuleType){
   const resolvedComuneId=municipalitySlug(municipality);
   openMunicipalityModule(selectorModuleType,municipality,resolvedComuneId);
   return;
  }
  openPanel(municipality,municipalitySheet(municipality,false));
 }));
 document.querySelectorAll('#townList [data-territory]').forEach(button=>button.addEventListener('click',async()=>{territoryListScrollY=overlay.scrollTop;await Promise.all([usefulContactsPromise||loadUsefulContacts(),territoryImagesPromise||loadTerritoryImages(),territoryImageConfigPromise||loadTerritoryImageConfig()]);openPanel('',municipalitySheet(button.dataset.territory,true));}));
}
function openTerritoryList(){
 const restoreScroll=territoryListScrollY;
 openPanel('Esplora il Territorio',territoryExplorer('Cerca e seleziona un Comune.'));
 requestAnimationFrame(()=>overlay.scrollTo({top:restoreScroll,left:0,behavior:'auto'}));
}
function openTerritoryMunicipality(name){openPanel('',municipalitySheet(name,true));}
// Adattatore non invasivo: usa soltanto archivi globali già esistenti che espongono
// un campo municipality o comune; in assenza di dati compatibili non produce risultati.
function municipalityModuleRecords(type,name){
 const candidates=type==='eat'
  ?[globalThis.restaurantsArchive,globalThis.restaurantArchive,globalThis.diningArchive]
  :[globalThis.accommodationsArchive,globalThis.hospitalityArchive,globalThis.sleepArchive];
 return candidates.filter(Array.isArray).flat().filter(item=>(item.municipality||item.comune)===name);
}
function municipalityModuleCards(records){
 return records.map(item=>{
  const title=item.title||item.name||item.nome||item.official_name;
  if(!title)return '';
  const description=item.description||item.address||item.indirizzo||'';
  return '<article class="item"><h3>'+safeTerritoryText(title)+'</h3>'+(description?'<p>'+safeTerritoryText(description)+'</p>':'')+'</article>';
 }).filter(Boolean).join('');
}
function bindTerritoryGallery(){
 document.querySelectorAll('[data-gallery-real-image]').forEach(image=>image.addEventListener('error',()=>{
  const figure=image.closest('.territory-gallery-item');if(!figure)return;
  figure.className='territory-gallery-item territory-gallery-placeholder';
  figure.dataset.galleryPlaceholder='';
  figure.innerHTML='<div class="territory-gallery-placeholder-visual" aria-hidden="true"><img src="'+safeTerritoryText(territoryPlaceholderSource())+'" width="800" height="500" loading="lazy" decoding="async" alt=""><span>'+safeTerritoryText(territoryImageConfig.gallery?.placeholderMessage||'Archivio fotografico in aggiornamento')+'</span></div>';
 }));
 const lightbox=document.querySelector('[data-territory-lightbox]');if(!lightbox)return;
 const largeImage=lightbox.querySelector('[data-gallery-large]');
 const title=lightbox.querySelector('[data-gallery-title]');
 const description=lightbox.querySelector('[data-gallery-description]');
 const closeButton=lightbox.querySelector('[data-gallery-close]');
 const closeLightbox=()=>{lightbox.classList.add('hidden');largeImage.src='';};
 document.querySelectorAll('[data-gallery-image]').forEach(button=>button.addEventListener('click',()=>{
  const image=territoryImageById(button.dataset.galleryImage);if(!image||!image.file||!image.alt)return;
  largeImage.src=image.file;largeImage.alt=image.alt;
  title.textContent=image.title||'';title.hidden=!image.title;
  description.textContent=image.description||'';description.hidden=!image.description;
  lightbox.classList.remove('hidden');closeButton.focus({preventScroll:true});
 }));
 closeButton.addEventListener('click',closeLightbox);
 lightbox.addEventListener('click',event=>{if(event.target===lightbox)closeLightbox();});
}
