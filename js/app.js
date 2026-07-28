const overlay=document.getElementById('overlay');
const panelContent=document.getElementById('panelContent');
const i18n=window.CilentomaniaI18n;
const t=(key,fallback,params)=>i18n?.t?i18n.t(key,fallback,params):fallback;

function usefulHtml(){
 return '<div class="notice">In caso di emergenza chiama direttamente il numero indicato.</div><div class="panel-grid">'+
 ['Carabinieri|112','Polizia di Stato|113','Vigili del Fuoco|115','Emergenza sanitaria|118','Guardia Costiera|1530'].map(x=>{const a=x.split('|');return '<article class="item"><h3>'+a[0]+'</h3><p>'+a[1]+'</p><div class="actions"><a href="tel:'+a[1]+'">'+t('infopoints.call','Chiama')+'</a></div></article>'}).join('')+
 '<article class="item"><h3>Guardia medica</h3><p>Trova la sede più vicina.</p><div class="actions"><button onclick="findNearby(\'guardia medica\')">Geolocalizza</button></div></article>'+
 '<article class="item"><h3>Farmacia di turno</h3><p>Trova una farmacia aperta vicino a te.</p><div class="actions"><button onclick="findNearby(\'farmacia aperta\')">Geolocalizza</button></div></article></div>';
}

function createModules(itineraries){
 return {
  useful:{title:t('modules.useful','Numeri utili'),html:'<section data-hub-section="useful">'+usefulHtml()+'</section>'},
  infopoints:{title:t('modules.infopoints','I nostri Infopoint'),html:'<section data-hub-section="infopoints">'+buildInfopointsHtml()+'</section>'},
  events:{title:t('modules.events','Eventi'),html:'<section data-hub-section="events">'+buildEventsHtml()+'</section>'},
  experiences:{title:t('modules.experiences','Esperienze'),html:'<section data-hub-section="experiences"><div class="panel-grid"><article class="item"><h3>Mare e outdoor</h3><p>Escursioni in barca, kayak, diving e trekking.</p></article><article class="item"><h3>Gusto e tradizioni</h3><p>Degustazioni, laboratori e visite ai produttori.</p></article></div></section>'},
  sleep:{title:t('modules.sleep','Dove dormire'),html:'<section data-hub-section="sleep">'+townSelector('Scegli il Comune in cui cercare una struttura ricettiva.','home-module','sleep')+'</section>'},
  eat:{title:t('modules.eat','Dove mangiare'),html:'<section data-hub-section="eat">'+townSelector('Scegli il Comune in cui cercare ristoranti e locali.','home-module','eat')+'</section>'},
  routes:{title:t('modules.routes','Itinerari'),html:'<section data-hub-section="itineraries"><div class="panel-grid">'+itineraries.map(x=>'<article class="item"><h3>'+x.title+'</h3><p>'+x.description+'</p></article>').join('')+'</div></section>'},
  services:{title:t('modules.services','Servizi'),html:'<section data-hub-section="services"><div class="panel-grid"><article class="item"><h3>Noleggio</h3><p>Auto, bici, scooter e imbarcazioni.</p></article><article class="item"><h3>Guide e accompagnatori</h3><p>Professionisti e servizi per scoprire il territorio.</p></article></div></section>'}
 };
}

function bindModuleLaunchers(getModules){
 document.querySelectorAll('[data-module]').forEach(button=>button.addEventListener('click',()=>{
  const key=button.dataset.module;
  const modules=getModules();
  const module=modules[key];
  if(!module)return;
  if(key==='events'){
   eventsVisibleLimit=MAX_EVENTS_HOME;
   module.html=buildEventsHtml();
  }
  openPanel(module.title,module.html);
  if(key==='events')setTimeout(()=>{loadEventsArchive();},0);
 }));
}

function bindApplication(getModules){
 document.getElementById('closePanel').addEventListener('click',closePanel);
overlay.addEventListener('click',e=>{if(e.target===overlay)closePanel();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closePanel();});
bindModuleLaunchers(getModules);
document.getElementById('exploreBtn').addEventListener('click',()=>openPanel(t('overlay.exploreTerritory','Esplora il Territorio'),townSelector('Cerca e seleziona un Comune.')));
document.querySelectorAll('[data-detail]').forEach(b=>b.addEventListener('click',()=>{
 const i=Number(b.dataset.detail),x=featured[i];
 openPanel(x[0],'<img src="'+x[2]+'" alt="'+x[0]+'" style="width:100%;height:330px;object-fit:cover;border-radius:20px" onerror="this.style.display=\'none\'"><div class="detail-meta"><article class="item"><h3>'+t('overlay.municipality','Comune')+'</h3><p>'+x[1]+'</p></article><article class="item"><h3>'+t('overlay.category','Categoria')+'</h3><p>'+t('overlay.categoryValue','Luogo da non perdere')+'</p></article><article class="item"><h3>'+t('overlay.tip','Consiglio')+'</h3><p>'+t('overlay.tipValue','Verifica orari e condizioni prima della visita.')+'</p></article></div>'+featuredDetails[i]);
}));

document.getElementById('searchBtn').addEventListener('click',performSearch);
document.getElementById('globalSearch').addEventListener('keydown',e=>{if(e.key==='Enter')performSearch();});
document.getElementById('nearbyBtn').addEventListener('click',()=>findNearby('cose da fare ristoranti hotel attrazioni'));
}

async function loadJson(path){
 const response=await fetch(path,{cache:'no-store'});
 if(!response.ok)throw new Error('HTTP '+response.status+' caricando '+path);
 return response.json();
}

function renderPartners(partners){
 const container=document.getElementById('partnerGridContent');
 container.innerHTML=partners.map(x=>`<a href="${x.url}" target="_blank" rel="noopener"><img src="${x.image}" alt="${x.alt}"></a>`).join('');
}

function escapeModuleText(value){
 return String(value??'').replace(/[&<>\"]/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[character]));
}

function renderHomeModules(data){
 const container=document.getElementById('homeModules');
 const modules=[...(data.modules||[])].sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));
 const titleByKey={useful:'modules.useful',infopoints:'modules.infopoints',events:'modules.events',experiences:'modules.experiences',sleep:'modules.sleep',eat:'modules.eat',routes:'modules.routes',services:'modules.services'};
 container.innerHTML=modules.map(module=>{
  const tone=/^[a-z-]+$/.test(module.tone)?module.tone:'ocean';
  const translatedTitle=titleByKey[module.key]?t(titleByKey[module.key],module.title):module.title;
  return '<button class="module ds-navigation-card module--'+tone+'" type="button" data-module="'+escapeModuleText(module.key)+'">'+
   '<span class="module__top"><span class="module__icon" aria-hidden="true">'+escapeModuleText(module.icon)+'</span></span>'+
   '<span class="module__copy"><strong>'+escapeModuleText(translatedTitle)+'</strong><span>'+escapeModuleText(module.subtitle)+'</span></span></button>';
 }).join('');
 i18n?.applyTranslations?.(container);
}

async function initApplication(){
 const [territoryData,infopointData,eventData,partners,itineraries,homeModules]=await Promise.all([
  loadJson('data/comuni.json'),
  loadJson('data/infopoint.json'),
  loadJson('data/eventi.json'),
  loadJson('data/partner.json'),
  loadJson('data/itinerari.json'),
  loadJson('data/home-modules.json')
 ]);
 initTerritoryData(territoryData);
 initInfopointData(infopointData);
 initEventsData(eventData);
 renderPartners(partners);
 renderHomeModules(homeModules);
 const getModules=()=>createModules(itineraries);
 bindApplication(getModules);

 document.addEventListener('cilentomania:languagechange',()=>{
  renderHomeModules(homeModules);
  bindModuleLaunchers(getModules);
 });
}

initApplication().catch(error=>console.error('Errore di inizializzazione Cilentomania HUB:',error));
