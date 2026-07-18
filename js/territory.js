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
function townSelector(note){
 if(note==='Cerca e seleziona un Comune.')return territoryExplorer(note);
 return '<div class="notice">'+note+'</div><input class="town-search" id="townFilter" placeholder="Cerca un Comune..."><div class="towns" id="townList">'+municipalities.map(m=>'<button class="town" data-name="'+m.toLowerCase()+'">'+m+'</button>').join('')+'</div>';
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
 return '<nav class="territory-final-actions" aria-label="Approfondimenti su '+safeTerritoryText(name)+'"><button type="button" data-municipality-action="sights" data-municipality="'+safeTerritoryText(name)+'">Cosa vedere</button><button type="button" data-municipality-action="events" data-municipality="'+safeTerritoryText(name)+'">Eventi ed esperienze</button><button type="button" data-municipality-action="eat" data-municipality="'+safeTerritoryText(name)+'">Dove mangiare</button><button type="button" data-municipality-action="sleep" data-municipality="'+safeTerritoryText(name)+'">Dove dormire</button></nav>';
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
 f.addEventListener('input',()=>{
  const q=f.value.trim().toLowerCase();
  const options=document.querySelectorAll('#townList .town,#townList .territory-card');
  let visible=0;
  options.forEach(option=>{const match=(option.dataset.name||option.dataset.search||'').includes(q);option.classList.toggle('hidden',!match);if(match)visible++;});
  const empty=document.getElementById('territoryEmpty');if(empty)empty.classList.toggle('hidden',visible>0);
 });
 document.querySelectorAll('#townList .town').forEach(button=>button.addEventListener('click',()=>{modalReturnHtml=panelContent.innerHTML;openPanel(button.textContent,municipalitySheet(button.textContent,false));}));
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
 return '<button class="territory-back" type="button" data-municipality-back="'+safeTerritoryText(name)+'">← Torna alla scheda</button><section class="territory-filtered"><p class="territory-filter-label">Risultati esclusivi per '+safeTerritoryText(name)+'</p><h2>'+labels[type]+'</h2>'+content+'</section>';
}
function bindTerritoryInteractions(){
 bindTerritoryGallery();
 const municipalityBack=document.querySelector('[data-municipality-back]');if(municipalityBack)municipalityBack.addEventListener('click',()=>openTerritoryMunicipality(municipalityBack.dataset.municipalityBack));
 document.querySelectorAll('[data-municipality-action]').forEach(button=>button.addEventListener('click',()=>openPanel('',municipalitySectionHtml(button.dataset.municipalityAction,button.dataset.municipality))));
 const toggle=document.querySelector('[data-infopoint-toggle]');
 const panel=document.querySelector('[data-infopoint-panel]');
 if(!toggle||!panel)return;
 const setOpen=open=>{panel.classList.toggle('hidden',!open);toggle.setAttribute('aria-expanded',String(open));if(open)panel.scrollIntoView({behavior:'smooth',block:'nearest'});};
 toggle.addEventListener('click',()=>setOpen(toggle.getAttribute('aria-expanded')!=='true'));
 const close=document.querySelector('[data-infopoint-close]');if(close)close.addEventListener('click',()=>setOpen(false));
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
