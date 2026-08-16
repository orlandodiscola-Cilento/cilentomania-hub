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
  return '<img class="module-detail__cover" src="'+safeTerritoryText(heroImage)+'" alt="'+safeTerritoryText(itemName||territoryTranslate('hospitality.imageUnavailable','Immagine non disponibile'))+'" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><div class="module-detail__hero-placeholder" hidden aria-hidden="true"><span aria-hidden="true">◌</span></div>';
 }
 return '<div class="module-detail__hero-placeholder" aria-hidden="true"><span aria-hidden="true">◌</span></div>';
}
function municipalityModuleGalleryMarkup(images,itemName){
 if(!Array.isArray(images)||!images.length)return '';
 const label=territoryTranslate('hospitality.photoGallery','Galleria fotografica');
 const openImageLabel=territoryTranslate('hospitality.openImage','Apri immagine');
 return '<section class="module-detail__section"><h3>'+safeTerritoryText(label)+' <span class="module-detail__gallery-count">('+images.length+')</span></h3><div class="module-detail__gallery-grid" data-module-gallery>'+images.map((image,index)=>'<button class="module-detail__gallery-item" type="button" data-module-gallery-open="'+index+'" aria-label="'+safeTerritoryText(openImageLabel)+' '+(index+1)+'"><img src="'+safeTerritoryText(image)+'" alt="'+safeTerritoryText(itemName||label)+' - '+(index+1)+'" loading="lazy" onerror="this.closest(\'.module-detail__gallery-item\').classList.add(\'is-broken\')"></button>').join('')+'</div></section>';
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
 const whatsappDigits=String(item.whatsapp||'').replace(/\D/g,'');
 const mapHref=resolveMunicipalityMapHref(item);
 const websiteHref=municipalityNormalizedExternalUrl(item.sito_web);
 const bookingHref=municipalityNormalizedExternalUrl(item.url_prenotazione);
 if(bookingHref)actions.push('<a class="module-action" href="'+safeTerritoryText(bookingHref)+'" target="_blank" rel="noopener noreferrer">'+safeTerritoryText(territoryTranslate('hospitality.book','Prenota'))+'</a>');
 if(mapHref)actions.push('<a class="module-action" href="'+safeTerritoryText(mapHref)+'" target="_blank" rel="noopener noreferrer">'+safeTerritoryText(territoryTranslate('hospitality.directions','Come arrivare'))+'</a>');
 if(rawPhone&&validateMunicipalityDetailPhone(rawPhone)&&phone)actions.push('<a class="module-action" href="tel:'+safeTerritoryText(phone)+'">'+safeTerritoryText(territoryTranslate('hospitality.call','Chiama'))+'</a>');
 if(validateMunicipalityDetailWhatsapp(whatsappDigits))actions.push('<a class="module-action" href="https://wa.me/'+safeTerritoryText(whatsappDigits)+'" target="_blank" rel="noopener noreferrer">'+safeTerritoryText(territoryTranslate('hospitality.whatsapp','WhatsApp'))+'</a>');
 if(websiteHref&&websiteHref!==bookingHref)actions.push('<a class="module-action" href="'+safeTerritoryText(websiteHref)+'" target="_blank" rel="noopener noreferrer">'+safeTerritoryText(territoryTranslate('hospitality.website','Sito web'))+'</a>');
 if(email&&validateMunicipalityDetailEmail(email))actions.push('<a class="module-action" href="mailto:'+safeTerritoryText(email)+'">'+safeTerritoryText(territoryTranslate('hospitality.email','Email'))+'</a>');
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
function territoryTranslate(key,fallback,params){
 const i18n=globalThis.CilentomaniaI18n;
 return i18n?.t?i18n.t(key,fallback,params):fallback;
}
function territoryText(value){
 return String(value||'').trim();
}
function getTerritoryContentLanguage(){
 const language=globalThis.CilentomaniaI18n?.getCurrentLanguage?.();
 const normalized=String(language||'it').trim().toLowerCase();
 return ['it','en','de','fr','es'].includes(normalized)?normalized:'it';
}
function getRecordTranslationBucket(item,language){
 const translated=item?.translations?.[language];
 return translated&&typeof translated==='object'?translated:null;
}
function territoryLocalizedText(item,field,options={}){
 const language=getTerritoryContentLanguage();
 const neutralFallback=options.neutralFallback===true;
 const explicitFallback=Object.prototype.hasOwnProperty.call(options,'fallback')?options.fallback:'';
 if(language!=='it'){
  const translatedBucket=getRecordTranslationBucket(item,language);
  const translatedValue=territoryText(translatedBucket?.[field]);
  if(translatedValue)return translatedValue;
 }
 const italianValue=territoryText(item?.[field]);
 if(italianValue)return italianValue;
 if(neutralFallback)return territoryTranslate('common.noContent','Contenuto non disponibile');
 return explicitFallback;
}
function territoryLocalizedList(item,field){
 const language=getTerritoryContentLanguage();
 if(language!=='it'){
  const translatedBucket=getRecordTranslationBucket(item,language);
  if(Array.isArray(translatedBucket?.[field])){
   return translatedBucket[field].map(entry=>territoryText(entry)).filter(Boolean);
  }
 }
 if(Array.isArray(item?.[field]))return item[field].map(entry=>territoryText(entry)).filter(Boolean);
 return [];
}
function territoryUniqueList(values){
 const list=Array.isArray(values)?values:[];
 const seen=new Set();
 return list.map(item=>territoryText(item)).filter(item=>{
  if(!item||seen.has(item.toLowerCase()))return false;
  seen.add(item.toLowerCase());
  return true;
 });
}
function municipalityNormalizedExternalUrl(value){
 if(!validateMunicipalityDetailUrl(value))return '';
 const trimmed=territoryText(value);
 if(!trimmed)return '';
 if(trimmed.startsWith('http://')||trimmed.startsWith('https://'))return trimmed;
 return 'https://'+trimmed;
}
function municipalityBooleanLabel(value){
 return value?territoryTranslate('hospitality.yes','Si'):'';
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
  titlePrefix:territoryTranslate('modules.eat','Dove mangiare')+' '+territoryTranslate('hospitality.inMunicipality','a'),
  intro:territoryTranslate('hospitality.eatIntro','Scopri locali, cucine e contatti utili per scegliere dove mangiare.'),
   entityType:'restaurant',
  placeholder:territoryTranslate('hospitality.searchEatPlaceholder','Cerca un locale o una localita...'),
  empty:territoryTranslate('hospitality.noResults','Nessun risultato'),
   categories:['Ristorante','Pizzeria','Trattoria','Agriturismo con ristorazione','Ristorante sul mare e beach club','Bar e caffetterie','Gelateria','Gastronomia e prodotti tipici'],
   localities:['Castellabate centro storico','Santa Maria di Castellabate','San Marco di Castellabate','Lago','Ogliastro Marina','Licosa','Alano'],
  resultNoun:{singular:territoryTranslate('hospitality.resultsEatSingular','attivita trovata'),plural:territoryTranslate('hospitality.resultsEatPlural','attivita trovate')},
   booleanFilters:[
    {key:'cucina_cilentana',label:territoryTranslate('hospitality.filters.cucinaCilentana','Cucina cilentana'),type:'cuisine'},
    {key:'pesce',label:territoryTranslate('hospitality.filters.pesce','Pesce'),type:'cuisine'},
    {key:'carne',label:territoryTranslate('hospitality.filters.carne','Carne'),type:'cuisine'},
    {key:'pizza',label:territoryTranslate('hospitality.filters.pizza','Pizza'),type:'cuisine'},
    {key:'vegetariano',label:territoryTranslate('hospitality.filters.vegetariano','Vegetariano'),type:'flag'},
    {key:'senza_glutine',label:territoryTranslate('hospitality.filters.senzaGlutine','Senza glutine'),type:'flag'},
    {key:'aperto_pranzo',label:territoryTranslate('hospitality.filters.apertoPranzo','Aperto a pranzo'),type:'flag'},
    {key:'aperto_cena',label:territoryTranslate('hospitality.filters.apertoCena','Aperto a cena'),type:'flag'}
   ]
  },
  sleep:{
   titlePrefix:territoryTranslate('modules.sleep','Dove dormire')+' '+territoryTranslate('hospitality.inMunicipality','a'),
   intro:territoryTranslate('hospitality.sleepIntro','Trova strutture ricettive, servizi e informazioni pratiche per il soggiorno.'),
   entityType:'accommodation',
    placeholder:territoryTranslate('hospitality.searchSleepPlaceholder','Cerca una struttura o una localita...'),
   empty:territoryTranslate('hospitality.noResults','Nessun risultato'),
  categories:['Hotel','Resort','Bed and Breakfast','Case vacanza','Agriturismo','Residence','Campeggi e villaggi','Ospitalità nel borgo'],
  categoryOrder:['Bed and Breakfast','Hotel','Casa vacanza','Agriturismo','Resort'],
   localities:['Castellabate centro storico','Santa Maria di Castellabate','San Marco di Castellabate','Lago','Ogliastro Marina','Licosa','Alano'],
  resultNoun:{singular:territoryTranslate('hospitality.resultsSleepSingular','struttura trovata'),plural:territoryTranslate('hospitality.resultsSleepPlural','strutture trovate')},
   booleanFilters:[
    {key:'vicino_mare',label:territoryTranslate('hospitality.filters.vicinoMare','Vicino al mare'),type:'flag'},
    {key:'piscina',label:territoryTranslate('hospitality.filters.piscina','Piscina'),type:'flag'},
    {key:'parcheggio',label:territoryTranslate('hospitality.filters.parcheggio','Parcheggio'),type:'flag'},
    {key:'animali_ammessi',label:territoryTranslate('hospitality.filters.animaliAmmessi','Animali ammessi'),type:'flag'},
    {key:'accessibile',label:territoryTranslate('hospitality.filters.accessibile','Accessibile'),type:'flag'},
    {key:'adatto_famiglie',label:territoryTranslate('hospitality.filters.adattoFamiglie','Adatto alle famiglie'),type:'flag'},
   {key:'aperto_tutto_anno',label:territoryTranslate('hospitality.filters.apertoTuttoAnno','Aperto tutto l anno'),type:'flag'},
   {key:'wifi',label:territoryTranslate('hospitality.filters.wifi','Wi-Fi'),type:'service',optional:true},
   {key:'colazione_inclusa',label:territoryTranslate('hospitality.filters.colazioneInclusa','Colazione inclusa'),type:'service',optional:true},
   {key:'aria_condizionata',label:territoryTranslate('hospitality.filters.ariaCondizionata','Aria condizionata'),type:'service',optional:true},
   {key:'spa_benessere',label:territoryTranslate('hospitality.filters.spaBenessere','Spa / Benessere'),type:'service',optional:true}
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
function municipalityModuleCategoryValues(records,config){
 const values=Array.isArray(records)?records.map(item=>territoryLocalizedText(item,'categoria')).filter(Boolean):[];
 const uniqueValues=territoryUniqueList(values);
 if(config?.entityType!=='accommodation')return uniqueValues;
 const ordered=(config.categoryOrder||[]).map(category=>{
  const match=uniqueValues.find(value=>normalizeMunicipalityModuleText(value)===normalizeMunicipalityModuleText(category));
  return match||category;
 });
 return territoryUniqueList([...ordered,...uniqueValues]);
}
function municipalityModuleCategoryLabel(category){
 if(/^bed(?:\s+and\s+|\s*&\s*)breakfast$/i.test(String(category||'').trim())){
  return territoryTranslate('hospitality.categories.bedAndBreakfast','B&B');
 }
 return String(category||'');
}
function municipalityModuleHasActiveFilters(filters){
 const selected=Array.isArray(filters.boolean)?filters.boolean:[];
 const categories=Array.isArray(filters.categories)?filters.categories:[];
 return Boolean(String(filters.search||'').trim())||selected.length>0||categories.length>0;
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
 const isSleep=config.entityType==='accommodation';
 const badge=item.partner_cilentomania?'<span class="module-card__badge">Partner Cilentomania</span>':'';
 const typeLabel=safeTerritoryText(municipalityModuleCategoryLabel(territoryLocalizedText(item,'categoria',{neutralFallback:true})));
 const locality=territoryLocalizedText(item,'localita');
 const summary=territoryLocalizedText(item,'descrizione_breve');
 const localizedCuisines=territoryLocalizedList(item,'tipologie_cucina');
 const localizedServicesHighlight=territoryLocalizedList(item,'servizi_in_evidenza');
 const localizedServices=territoryLocalizedList(item,'servizi');
 const cuisine=localizedCuisines[0]||municipalityModuleAsArray(item.tipologie_cucina)[0]||'';
 const service=localizedServicesHighlight[0]||localizedServices[0]||municipalityModuleAsArray(item.servizi_in_evidenza)[0]||municipalityModuleAsArray(item.servizi)[0]||'';
 const sleepServices=territoryUniqueList([...localizedServicesHighlight,...localizedServices,...municipalityModuleAsArray(item.servizi_in_evidenza),...municipalityModuleAsArray(item.servizi)]).slice(0,3);
 const highlight=territoryText(config.entityType==='restaurant'?cuisine:service);
 const displayName=territoryLocalizedText(item,'nome',{neutralFallback:true});
 const cardLabel=territoryTranslate('hospitality.openSheet','Apri scheda')+': '+displayName;
 const heroTitle=safeTerritoryText(displayName||territoryTranslate('hospitality.imageUnavailable','Immagine non disponibile'));
 const heroImage=safeTerritoryText(item.immagine_copertina||item.image||'assets/placeholder-comune.svg');
 if(isSleep){
  const serviceMarkup=sleepServices.length
   ?'<div class="module-card__service-list">'+sleepServices.map(value=>'<span class="module-card__service-chip">'+safeTerritoryText(value)+'</span>').join('')+'</div>'
   :'';
   return '<article class="module-card module-card--sleep" role="button" tabindex="0" aria-label="'+safeTerritoryText(cardLabel)+'" data-module-discover-card="'+safeTerritoryText(item.id||'')+'" data-entity-type="'+safeTerritoryText(config.entityType)+'" data-entity-id="'+safeTerritoryText(item.id||'')+'" data-comune-id="'+safeTerritoryText(item.comune_id||'')+'" data-category="'+safeTerritoryText(item.categoria||'')+'" data-localita="'+safeTerritoryText(item.localita||'')+'"><div class="module-card__media"><img src="'+heroImage+'" alt="'+heroTitle+'" loading="lazy" onerror="this.hidden=true;this.parentElement.classList.add(\'has-image-fallback\');this.nextElementSibling.hidden=false"><div class="module-card__media-fallback" hidden aria-hidden="true"><span>'+safeTerritoryText(territoryTranslate('hospitality.imageUnavailable','Immagine non disponibile'))+'</span></div><div class="module-card__media-shade" aria-hidden="true"></div>'+(typeLabel?'<span class="module-card__media-badge">'+typeLabel+'</span>':'')+'<div class="module-card__media-caption"><h3>'+heroTitle+'</h3>'+(locality?'<p class="module-card__location"><span class="module-card__location-icon" aria-hidden="true">⌖</span><span>'+safeTerritoryText(locality)+'</span></p>':'')+'</div></div><div class="module-card__copy">'+badge+(summary?'<p class="module-card__description">'+safeTerritoryText(summary)+'</p>':'')+serviceMarkup+'<button class="module-card__cta" type="button" data-module-discover="'+safeTerritoryText(item.id||'')+'">'+safeTerritoryText(territoryTranslate('hospitality.discoverAccommodation','Scopri la struttura'))+' <span aria-hidden="true">→</span></button></div></article>';
 }
 return '<article class="module-card" role="button" tabindex="0" aria-label="'+safeTerritoryText(cardLabel)+'" data-module-discover-card="'+safeTerritoryText(item.id||'')+'" data-entity-type="'+safeTerritoryText(config.entityType)+'" data-entity-id="'+safeTerritoryText(item.id||'')+'" data-comune-id="'+safeTerritoryText(item.comune_id||'')+'" data-category="'+safeTerritoryText(item.categoria||'')+'" data-localita="'+safeTerritoryText(item.localita||'')+'"><div class="module-card__media"><img src="'+heroImage+'" alt="'+heroTitle+'" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><div class="module-card__media-fallback" hidden aria-hidden="true"><span>'+safeTerritoryText(territoryTranslate('hospitality.imageUnavailable','Immagine non disponibile'))+'</span></div></div><div class="module-card__copy"><h3>'+safeTerritoryText(displayName)+'</h3><div class="module-card__meta-row"><span class="module-card__type">'+typeLabel+'</span>'+badge+'</div>'+(locality?'<p class="module-card__location"><span class="module-card__location-icon" aria-hidden="true">⌖</span><span>'+safeTerritoryText(locality)+'</span></p>':'')+(highlight?'<p class="module-card__highlight">'+safeTerritoryText(highlight)+'</p>':'')+(summary?'<p class="module-card__description">'+safeTerritoryText(summary)+'</p>':'')+'<button class="module-card__cta" type="button" data-module-discover="'+safeTerritoryText(item.id||'')+'">'+safeTerritoryText(territoryTranslate('common.discover','Scopri'))+' <span aria-hidden="true">→</span></button></div></article>';
}
function municipalityModuleResultsHtml(records,config,municipalityName,comuneId,showReset=false){
 const cards=records.map(item=>municipalityModuleCardContent(item,config)).join('');
 const emptyActions=showReset?'<button class="module-reset" type="button" data-module-reset-filters data-module-reset-empty>'+safeTerritoryText(territoryTranslate('hospitality.resetFilters','Azzera filtri'))+'</button>':'';
 return '<div class="module-experience__results-grid" data-module-results-grid>'+(cards||'<div class="module-empty" role="status"><h3>'+safeTerritoryText(territoryTranslate('hospitality.noResults','Nessun risultato'))+'</h3><p>'+safeTerritoryText(territoryTranslate('hospitality.noResultsHint','Prova a rimuovere uno o piu filtri per ampliare la ricerca.'))+'</p>'+emptyActions+'</div>')+'</div>';
}
function municipalityModuleFilterHtml(config,records,filters={}){
 const isSleep=config.entityType==='accommodation';
 const searchValue=String(filters.search||'');
 const booleanSelection=Array.isArray(filters.boolean)?filters.boolean:[];
 const categorySelection=Array.isArray(filters.categories)?filters.categories:[];
 const quickFilters=municipalityModuleResolveQuickFilters(config,records);
 const categories=municipalityModuleCategoryValues(records,config);
 const hasActiveFilters=municipalityModuleHasActiveFilters(filters);
 const categoryMarkup=isSleep&&categories.length
  ?'<div class="module-filter-quick"><p class="module-filter-quick-title">'+safeTerritoryText(territoryTranslate('hospitality.filterByCategory','Filtra per categoria'))+'</p><div class="module-filter-quick-list module-filter-quick-list--scroll">'+categories.map(category=>'<button class="module-filter-pill module-filter-pill--category" type="button" data-module-category="'+safeTerritoryText(category)+'" aria-pressed="'+String(categorySelection.includes(category))+'">'+safeTerritoryText(municipalityModuleCategoryLabel(category))+'</button>').join('')+'</div></div>'
  :'';
 const quickFilterMarkup=quickFilters.map(filter=>'<button class="module-filter-pill" type="button" data-module-boolean="'+safeTerritoryText(filter.key)+'" aria-pressed="'+String(booleanSelection.includes(filter.key))+'">'+safeTerritoryText(filter.label)+'</button>').join('');
 return '<div class="module-experience__filters" data-module-filters><div class="module-filter-search"><label class="sr-only" for="moduleSearch">'+safeTerritoryText(territoryTranslate('common.search','Cerca'))+'</label><input id="moduleSearch" type="search" data-module-search value="'+safeTerritoryText(searchValue)+'" placeholder="'+safeTerritoryText(config.placeholder)+'" aria-label="'+safeTerritoryText(territoryTranslate('common.search','Cerca'))+'"></div>'+categoryMarkup+'<div class="module-filter-quick"><p class="module-filter-quick-title">'+safeTerritoryText(territoryTranslate('hospitality.quickFilters','Filtri rapidi'))+'</p><div class="module-filter-quick-list module-filter-quick-list--scroll">'+quickFilterMarkup+'</div></div><button class="module-reset'+(hasActiveFilters?'':' hidden')+'" type="button" data-module-reset-filters>'+safeTerritoryText(territoryTranslate('hospitality.resetFilters','Azzera filtri'))+'</button></div>';
}
function municipalityModuleSleepHeroHtml(municipalityName,config){
 const municipalityCard=territoryCardData(municipalityName);
 const coverRecord=municipalityCard.imageCoverRecord||municipalityCard.imageCardRecord;
 const intro=territoryText(municipalityCard.introduzione);
 const imageMarkup=coverRecord
  ?'<img class="module-sleep-hero__image" '+territoryImageAttributes(coverRecord,municipalityName,'cover')+'>'
  :'';
 return '<header class="module-sleep-hero"><h1 class="module-sleep-hero__title">'+safeTerritoryText(territoryTranslate('modules.sleep','Dove dormire')+' '+territoryTranslate('hospitality.inMunicipality','a')+' '+municipalityName)+'</h1><div class="module-sleep-hero__media">'+imageMarkup+'<div class="module-sleep-hero__fallback" aria-hidden="true"></div><div class="module-sleep-hero__shade" aria-hidden="true"></div>'+(intro?'<div class="module-sleep-hero__content"><p>'+safeTerritoryText(intro)+'</p></div>':'')+'</div></header>';
}
function municipalityModuleSleepConciergeHtml(){
 return '<section class="module-sleep-concierge" aria-label="Cilentino Concierge"><img class="module-sleep-concierge__avatar" src="assets/cileo/avatar/cilentino-concierge.png" alt="Cilentino Concierge" loading="lazy"><p>'+safeTerritoryText(territoryTranslate('hospitality.sleepConciergeIntro','Ti aiuto a trovare la struttura piu adatta al tuo soggiorno.'))+'</p></section>';
}
function municipalityModuleViewHtml(type,municipalityName,comuneId,records,filters={}){
 const config=municipalityModuleConfig(type);
 const isSleep=config.entityType==='accommodation';
 const title=config.titlePrefix+' '+municipalityName;
 const count=records.length;
 const resolvedComuneId=String(comuneId || municipalitySlug(municipalityName));
 const header=isSleep
  ?municipalityModuleSleepHeroHtml(municipalityName,config)
  :'<div class="module-experience__header"><p class="module-experience__kicker">'+safeTerritoryText(territoryTranslate('hospitality.sectionLabel','Sezione dedicata'))+'</p><h2>'+safeTerritoryText(title)+'</h2><p class="module-experience__intro">'+safeTerritoryText(config.intro)+'</p><div class="module-experience__meta"><span class="module-experience__count" data-module-count>'+safeTerritoryText(municipalityModuleCountLabel(count,config))+'</span></div></div>';
 const concierge=isSleep?municipalityModuleSleepConciergeHtml():'';
 const countMarkup='<div class="module-experience__meta module-experience__meta--results"><span class="module-experience__count" data-module-count>'+safeTerritoryText(municipalityModuleCountLabel(count,config))+'</span></div>';
 return '<section class="module-experience" data-module-experience data-module-type="'+safeTerritoryText(type)+'" data-municipality-name="'+safeTerritoryText(municipalityName)+'" data-comune-id="'+safeTerritoryText(resolvedComuneId)+'" data-entity-type="'+safeTerritoryText(config.entityType)+'" data-module-view-root>'+header+concierge+municipalityModuleFilterHtml(config,records,filters)+(isSleep?countMarkup:'')+municipalityModuleResultsHtml(records,config,municipalityName,comuneId,municipalityModuleHasActiveFilters(filters))+'</section>';
}
function municipalityModuleFilterRecords(records,filters,config){
 const searchValue=normalizeMunicipalityModuleText(filters.search||'');
 const localityValue=String(filters.locality||'').trim();
 const categoryValue=String(filters.category||'').trim();
 const categorySelection=Array.isArray(filters.categories)?filters.categories:[];
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
  const matchesCategory=(!categoryValue||String(item.categoria||'').trim()===categoryValue)&&(!categorySelection.length||categorySelection.includes(territoryLocalizedText(item,'categoria')));
  const matchesPrice=!priceValue||String(item.fascia_prezzo||'').trim()===priceValue;
  const matchesBoolean=booleanFilters.every(flag=>municipalityModuleBooleanPredicate(flag,item));
  return matchesSearch&&matchesLocality&&matchesCategory&&matchesPrice&&matchesBoolean;
 });
}
function municipalityModuleDetailHtml(item,config,municipalityName,comuneId){
 const isEat=config.entityType==='restaurant';
 const name=territoryLocalizedText(item,'nome',{neutralFallback:true});
 const type=territoryLocalizedText(item,'categoria',{neutralFallback:true});
 const location=territoryLocalizedText(item,'localita');
 const description=territoryLocalizedText(item,'descrizione_completa')||territoryLocalizedText(item,'descrizione_breve',{neutralFallback:true});
 const heroImage=territoryText(item.immagine_copertina||item.image);
 const services=territoryUniqueList([...territoryLocalizedList(item,'servizi_in_evidenza'),...territoryLocalizedList(item,'servizi')]);
 const cuisines=territoryUniqueList(territoryLocalizedList(item,'tipologie_cucina'));
 const accessibility=territoryUniqueList(territoryLocalizedList(item,'accessibilita_dettagli'));
 const gallery=territoryUniqueList(Array.isArray(item.galleria)?item.galleria:[]).filter(image=>image!==heroImage).slice(0,9);
 const actionLinks=buildMunicipalityDetailActions(item);
 const backState=safeTerritoryText(JSON.stringify(municipalityModuleNavigationState||buildMunicipalityModuleNavigationState(isEat?'eat':'sleep',municipalityName||'',comuneId||municipalitySlug(municipalityName),{search:'',locality:'',category:'',price:'',boolean:[]},0)));
 const practicalRows=[];
 const pushPractical=(label,value)=>{
  const text=territoryText(value);
  if(!text)return;
  practicalRows.push('<p class="module-detail__practical-item"><strong>'+safeTerritoryText(label)+'</strong><br>'+safeTerritoryText(text)+'</p>');
 };
 pushPractical(territoryTranslate('infopoints.address','Indirizzo'),item.indirizzo);
 pushPractical(territoryTranslate('hospitality.locality','Localita'),location);
 pushPractical(territoryTranslate('hospitality.openingPeriod','Periodo di apertura'),territoryLocalizedText(item,'periodo_apertura'));
 pushPractical(territoryTranslate('hospitality.priceRange','Fascia prezzo'),territoryLocalizedText(item,'fascia_prezzo'));
 if(isEat&&cuisines.length)pushPractical(territoryTranslate('hospitality.cuisine','Tipologia cucina'),cuisines.join(' · '));
 if(!isEat&&accessibility.length)pushPractical(territoryTranslate('hospitality.accessibility','Accessibilita'),accessibility.join(' · '));
 if(!isEat)pushPractical(territoryTranslate('hospitality.petsAllowed','Animali ammessi'),municipalityBooleanLabel(Boolean(item.animali_ammessi)));
 if(!isEat)pushPractical(territoryTranslate('hospitality.openAllYear','Aperto tutto l anno'),municipalityBooleanLabel(Boolean(item.aperto_tutto_anno)));
 if(isEat)pushPractical(territoryTranslate('hospitality.openAtLunch','Aperto a pranzo'),municipalityBooleanLabel(Boolean(item.aperto_pranzo)));
 if(isEat)pushPractical(territoryTranslate('hospitality.openAtDinner','Aperto a cena'),municipalityBooleanLabel(Boolean(item.aperto_cena)));
 const contactRows=[];
 const pushContact=(label,value)=>{
  const text=territoryText(value);
  if(!text)return;
  contactRows.push('<p class="module-detail__practical-item"><strong>'+safeTerritoryText(label)+'</strong><br>'+safeTerritoryText(text)+'</p>');
 };
 pushContact(territoryTranslate('infopoints.phone','Telefono'),item.telefono);
 pushContact(territoryTranslate('hospitality.whatsapp','WhatsApp'),item.whatsapp);
 pushContact(territoryTranslate('hospitality.email','Email'),item.email);
 pushContact(territoryTranslate('hospitality.website','Sito web'),item.sito_web);
 const descriptionLimited=description.length>320;
 const descriptionMarkup=description?'<section class="module-detail__section"><h3>'+safeTerritoryText(territoryTranslate('hospitality.description','Descrizione'))+'</h3><p class="module-detail__description'+(descriptionLimited?' is-collapsed':'')+'" data-module-description>'+safeTerritoryText(description)+'</p>'+(descriptionLimited?'<button class="module-detail__toggle" type="button" data-module-toggle-description aria-expanded="false">'+safeTerritoryText(territoryTranslate('common.showMore','Mostra altro'))+'</button>':'')+'</section>':'';
 const servicesMarkup=services.length?'<section class="module-detail__section"><h3>'+safeTerritoryText(territoryTranslate('hospitality.services','Servizi'))+'</h3><div class="module-detail__service-badges">'+services.map(service=>'<span class="module-detail__service-badge">'+safeTerritoryText(service)+'</span>').join('')+'</div></section>':'';
 const practicalMarkup=practicalRows.length?'<section class="module-detail__section"><h3>'+safeTerritoryText(territoryTranslate('hospitality.usefulInfo','Informazioni utili'))+'</h3><div class="module-detail__practical">'+practicalRows.join('')+'</div></section>':'';
 const contactsMarkup=contactRows.length?'<section class="module-detail__section"><h3>'+safeTerritoryText(territoryTranslate('modules.contacts','Contatti'))+'</h3><div class="module-detail__practical">'+contactRows.join('')+'</div></section>':'';
 const locationAction=resolveMunicipalityMapHref(item);
 const lat=Number(item.latitudine);
 const lng=Number(item.longitudine);
 const positionValue=Number.isFinite(lat)&&Number.isFinite(lng)&&!(lat===0&&lng===0)
  ?lat.toFixed(5)+', '+lng.toFixed(5)
  :territoryText(item.indirizzo);
 const positionMarkup=locationAction&&positionValue?'<section class="module-detail__section"><h3>'+safeTerritoryText(territoryTranslate('hospitality.position','Posizione'))+'</h3><div class="module-detail__practical"><p class="module-detail__practical-item"><strong>'+safeTerritoryText(territoryTranslate('hospitality.position','Posizione'))+'</strong><br>'+safeTerritoryText(positionValue)+'</p></div></section>':'';
 const actionMarkup=actionLinks.length?'<section class="module-detail__section"><h3>'+safeTerritoryText(territoryTranslate('hospitality.mainActions','Azioni principali'))+'</h3><div class="module-detail__actions module-detail__actions--final">'+actionLinks.join('')+'</div></section>':'';
 const galleryMarkup=municipalityModuleGalleryMarkup(gallery,name);
 const lightbox=galleryMarkup?'<div class="module-detail-lightbox hidden" data-module-lightbox role="dialog" aria-modal="true" aria-label="'+safeTerritoryText(territoryTranslate('hospitality.photoGallery','Galleria fotografica'))+'"><button class="module-detail-lightbox__close" type="button" data-module-lightbox-close aria-label="'+safeTerritoryText(territoryTranslate('common.close','Chiudi'))+'">×</button><div class="module-detail-lightbox__content"><img src="" alt="" data-module-lightbox-image></div></div>':'';
 const badge=item.partner_cilentomania?'<span class="module-card__badge">Partner Cilentomania</span>':'';
 const locationMeta=location?'<p class="module-detail__meta">'+safeTerritoryText(location)+'</p>':'';
 return '<div class="module-detail" data-module-detail-root data-entity-type="'+safeTerritoryText(config.entityType)+'" data-entity-id="'+safeTerritoryText(item.id||'')+'" data-comune-id="'+safeTerritoryText(comuneId||municipalitySlug(municipalityName))+'" data-localita="'+safeTerritoryText(item.localita||'')+'" data-category="'+safeTerritoryText(item.categoria||'')+'" data-latitude="'+safeTerritoryText(item.latitudine||'')+'" data-longitude="'+safeTerritoryText(item.longitudine||'')+'"><div class="module-detail__topbar module-detail__sticky"><button class="territory-back" type="button" data-action="back-to-module-list" data-module-back-results data-module-back-type="'+safeTerritoryText(isEat?'eat':'sleep')+'" data-module-back-municipality="'+safeTerritoryText(municipalityName||'')+'" data-module-back-comune-id="'+safeTerritoryText(comuneId||municipalitySlug(municipalityName))+'" data-module-back-state="'+backState+'">← '+safeTerritoryText(territoryTranslate('common.back','Indietro'))+'</button></div><header class="module-detail__head"><h2>'+safeTerritoryText(name)+'</h2>'+(type?'<p class="module-detail__type">'+safeTerritoryText(type)+'</p>':'')+locationMeta+badge+'</header><div class="module-detail__hero-media">'+municipalityModuleHeroMarkup(heroImage,name)+'</div>'+galleryMarkup+lightbox+actionMarkup+descriptionMarkup+servicesMarkup+practicalMarkup+positionMarkup+contactsMarkup+'</div>';
}

function bindMunicipalityDetailContentInteractions(){
 const detailRoot=panelContent?.querySelector('[data-module-detail-root]');
 if(!detailRoot)return;
 detailRoot.querySelectorAll('[data-module-toggle-description]').forEach(toggle=>{
  toggle.onclick=null;
  toggle.addEventListener('click',()=>{
   const description=detailRoot.querySelector('[data-module-description]');
   if(!description)return;
   const expanded=toggle.getAttribute('aria-expanded')==='true';
   toggle.setAttribute('aria-expanded',String(!expanded));
   description.classList.toggle('is-collapsed',expanded);
   toggle.textContent=expanded
    ?territoryTranslate('common.showMore','Mostra altro')
    :territoryTranslate('common.showLess','Mostra meno');
  });
 });
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
 const initialFilters=state.filters||{search:'',locality:'',category:'',categories:[],price:'',boolean:[]};
 const filteredRecords=municipalityModuleFilterRecords(records,initialFilters,config).filter(item=>municipalityModuleMatches(item,municipalityName,comuneId));
 const title=config.titlePrefix+' '+municipalityName;
 openPanel(type==='sleep'?'':title,municipalityModuleViewHtml(type,municipalityName,comuneId,filteredRecords,initialFilters));
 overlay.classList.toggle('municipality-module-sleep-open',type==='sleep');
 if(type==='sleep')configureNavigationDock('modal-return');
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
async function openMunicipalityDetailById(type,municipalityName,comuneId,itemId,navigationState){
 const records=await loadMunicipalityModuleData(type);
 const matchingRecords=records.filter(item=>municipalityModuleMatches(item,municipalityName,comuneId));
 const config=municipalityModuleConfig(type);
 const item=matchingRecords.find(record=>String(record.id)===String(itemId));
 if(!item)return;
 const resolvedState=navigationState||buildMunicipalityModuleNavigationState(type,municipalityName,comuneId,{search:'',locality:'',category:'',categories:[],price:'',boolean:[]},overlay.scrollTop);
 setMunicipalityModuleNavigationState(resolvedState);
 openPanel('',municipalityModuleDetailHtml(item,config,municipalityName,comuneId));
 bindMunicipalityDetailGalleryLightbox();
 bindMunicipalityDetailContentInteractions();
 requestAnimationFrame(()=>{
  overlay.scrollTo({top:0,left:0,behavior:'auto'});
  panelContent.closest('.panel')?.scrollTo({top:0,left:0,behavior:'auto'});
  updateMunicipalityModuleDistance(panelContent.querySelector('[data-module-detail-root]'),item);
 });
}
function municipalityModuleCollectFilters(root){
 const search=root.querySelector('[data-module-search]');
 const booleans=root.querySelectorAll('[data-module-boolean]');
 const categories=root.querySelectorAll('[data-module-category]');
 return {
  search:search?.value||'',
  locality:'',
  category:'',
  categories:Array.from(categories).filter(button=>button.getAttribute('aria-pressed')==='true').map(button=>button.getAttribute('data-module-category')),
  price:'',
  boolean:Array.from(booleans).filter(button=>button.getAttribute('aria-pressed')==='true').map(button=>button.getAttribute('data-module-boolean'))
 };
}
function bindMunicipalityModuleInteractions(root){
 if(!root)return;
 const search=root.querySelector('[data-module-search]');
 const booleans=root.querySelectorAll('[data-module-boolean]');
 const categories=root.querySelectorAll('[data-module-category]');

 const bindResetButtons=()=>{
  root.querySelectorAll('[data-module-reset-filters]').forEach(button=>{
   button.onclick=null;
   button.addEventListener('click',()=>{
    if(search)search.value='';
    root.querySelectorAll('[data-module-boolean]').forEach(control=>control.setAttribute('aria-pressed','false'));
    root.querySelectorAll('[data-module-category]').forEach(control=>control.setAttribute('aria-pressed','false'));
    updateResults();
    if(search)search.focus({preventScroll:true});
   });
  });
 };

 const openDetailById=(itemId,backStateRaw='')=>{
  const moduleType=root.getAttribute('data-module-type')||'sleep';
  const municipalityName=root.dataset.municipalityName||'';
  const resolvedComuneId=root.dataset.comuneId||'';
  let navigationState=null;
  if(backStateRaw){
   try{navigationState=JSON.parse(backStateRaw);}catch(error){navigationState=null;}
  }
  navigationState=navigationState||buildMunicipalityModuleNavigationState(moduleType,municipalityName,resolvedComuneId,municipalityModuleCollectFilters(root),overlay.scrollTop);
  openMunicipalityDetailById(moduleType,municipalityName,resolvedComuneId,itemId,navigationState);
 };

 const bindDiscoverButtons=()=>{
  root.querySelectorAll('[data-module-discover]').forEach(button=>{
   const itemId=button.getAttribute('data-module-discover')||'';
   button.addEventListener('pointerdown',()=>{
    const navigationState=buildMunicipalityModuleNavigationState(root.getAttribute('data-module-type')||'sleep',root.dataset.municipalityName||'',root.dataset.comuneId||'',municipalityModuleCollectFilters(root),overlay.scrollTop);
    button.dataset.moduleBackState=JSON.stringify(navigationState);
   });
   button.addEventListener('click',()=>openDetailById(itemId,button.dataset.moduleBackState||''));
  });
  root.querySelectorAll('[data-module-discover-card]').forEach(card=>{
   const itemId=card.getAttribute('data-module-discover-card')||'';
   card.addEventListener('click',event=>{
    if(event.target.closest('[data-module-discover]'))return;
    const navigationState=buildMunicipalityModuleNavigationState(root.getAttribute('data-module-type')||'sleep',root.dataset.municipalityName||'',root.dataset.comuneId||'',municipalityModuleCollectFilters(root),overlay.scrollTop);
    openDetailById(itemId,JSON.stringify(navigationState));
   });
   card.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&event.key!==' ')return;
    event.preventDefault();
    const navigationState=buildMunicipalityModuleNavigationState(root.getAttribute('data-module-type')||'sleep',root.dataset.municipalityName||'',root.dataset.comuneId||'',municipalityModuleCollectFilters(root),overlay.scrollTop);
    openDetailById(itemId,JSON.stringify(navigationState));
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
  if(results)results.outerHTML=municipalityModuleResultsHtml(filtered,config,root.dataset.municipalityName||'',root.dataset.comuneId||'',hasActiveFilters);
  const count=root.querySelector('[data-module-count]');
  if(count)count.textContent=municipalityModuleCountLabel(filtered.length,config);
  root.querySelectorAll('[data-module-reset-filters]').forEach(button=>button.classList.toggle('hidden',!hasActiveFilters));
  bindResetButtons();
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
 categories.forEach(control=>{
  control.onclick=null;
  control.addEventListener('click',()=>{
   const isPressed=control.getAttribute('aria-pressed')==='true';
   control.setAttribute('aria-pressed',String(!isPressed));
   updateResults();
  });
 });
 if(root.dataset.moduleResetDelegationBound!=='true'){
  root.addEventListener('click',event=>{
   const resetButton=event.target.closest('[data-module-reset-filters]');
   if(!resetButton||!root.contains(resetButton))return;
   if(search)search.value='';
   root.querySelectorAll('[data-module-boolean]').forEach(control=>control.setAttribute('aria-pressed','false'));
   root.querySelectorAll('[data-module-category]').forEach(control=>control.setAttribute('aria-pressed','false'));
   updateResults();
   if(search)search.focus({preventScroll:true});
  });
  root.dataset.moduleResetDelegationBound='true';
 }
 bindResetButtons();
 root.querySelectorAll('[data-module-back-to-towns]').forEach(button=>{
  button.onclick=null;
  button.addEventListener('click',()=>{
   const moduleType=root.getAttribute('data-module-type')||'sleep';
   const moduleTitle=territoryTranslate(moduleType==='eat'?'modules.eat':'modules.sleep',moduleType==='eat'?'Dove mangiare':'Dove dormire');
   const note=moduleType==='eat'
    ?'Scegli il Comune in cui cercare ristoranti e locali.'
    :'Scegli il Comune in cui cercare una struttura ricettiva.';
   openPanel(moduleTitle,'<section data-hub-section="'+safeTerritoryText(moduleType)+'">'+townSelector(note,'home-module',moduleType)+'</section>');
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
 const panel=panelContent.closest('.panel');
 const closeButton=document.getElementById('closePanel');
 if(closeButton&&panel&&closeButton.parentElement!==panel)panel.insertBefore(closeButton,panelContent);
 overlay.classList.remove('municipality-module-sleep-open');
 panelContent.innerHTML=(title?'<h2>'+title+'</h2>':'')+html;
 globalThis.CilentomaniaI18n?.applyTranslations?.(panelContent);
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
function closePanel(){configureNavigationDock(null);overlay.classList.remove('open','territory-sheet-open','municipality-module-sleep-open');overlay.scrollTop=0;unlockPageScroll();}
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
 const i18n=globalThis.CilentomaniaI18n;
 const panelTitle=i18n?.t?i18n.t('overlay.exploreTerritory','Esplora il Territorio'):'Esplora il Territorio';
 openPanel(panelTitle,territoryExplorer('Cerca e seleziona un Comune.'));
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

function parseMunicipalityNavigationState(rawState){
 if(!rawState)return null;
 try{
  const parsed=JSON.parse(rawState);
  if(!parsed||typeof parsed!=='object')return null;
  return parsed;
 }catch(error){
  return null;
 }
}

async function refreshOpenMunicipalityViewOnLanguageChange(){
 if(!overlay?.classList.contains('open')||!panelContent)return;

 const detailRoot=panelContent.querySelector('[data-module-detail-root]');
 if(detailRoot){
  const entityType=detailRoot.getAttribute('data-entity-type');
  const moduleType=entityType==='restaurant'?'eat':'sleep';
  const itemId=detailRoot.getAttribute('data-entity-id')||'';
  const backButton=detailRoot.querySelector('[data-module-back-municipality]');
  const municipalityName=backButton?.getAttribute('data-module-back-municipality')||'';
  const comuneId=detailRoot.getAttribute('data-comune-id')||backButton?.getAttribute('data-module-back-comune-id')||municipalitySlug(municipalityName);
  const parsedState=parseMunicipalityNavigationState(backButton?.getAttribute('data-module-back-state')||'');
  const navigationState=buildMunicipalityModuleNavigationState(
   moduleType,
   parsedState?.municipalityName||municipalityName,
   parsedState?.comuneId||comuneId,
   parsedState?.filters||{search:'',locality:'',category:'',price:'',boolean:[]},
   parsedState?.scrollTop||0
  );
  await openMunicipalityDetailById(moduleType,municipalityName,comuneId,itemId,navigationState);
  return;
 }

 const moduleRoot=panelContent.querySelector('[data-module-experience]');
 if(moduleRoot){
  const moduleType=moduleRoot.getAttribute('data-module-type')||'sleep';
  const municipalityName=moduleRoot.getAttribute('data-municipality-name')||'';
  const comuneId=moduleRoot.getAttribute('data-comune-id')||municipalitySlug(municipalityName);
  const parsedFilters=parseMunicipalityNavigationState(moduleRoot.getAttribute('data-module-filters')||'');
  const state=buildMunicipalityModuleNavigationState(
   moduleType,
   municipalityName,
   comuneId,
   parsedFilters?.filters||parsedFilters||{search:'',locality:'',category:'',price:'',boolean:[]},
   overlay.scrollTop
  );
  await openMunicipalityModule(moduleType,municipalityName,comuneId,state);
 }
}

document.addEventListener('cilentomania:languagechange',()=>{
 refreshOpenMunicipalityViewOnLanguageChange().catch(()=>{});
});
