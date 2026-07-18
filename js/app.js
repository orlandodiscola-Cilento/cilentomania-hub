const overlay=document.getElementById('overlay');
const panelContent=document.getElementById('panelContent');

const useful='<div class="notice">In caso di emergenza chiama direttamente il numero indicato.</div><div class="panel-grid">'+
['Carabinieri|112','Polizia di Stato|113','Vigili del Fuoco|115','Emergenza sanitaria|118','Guardia Costiera|1530'].map(x=>{const a=x.split('|');return '<article class="item"><h3>'+a[0]+'</h3><p>'+a[1]+'</p><div class="actions"><a href="tel:'+a[1]+'">Chiama</a></div></article>'}).join('')+
'<article class="item"><h3>Guardia medica</h3><p>Trova la sede più vicina.</p><div class="actions"><button onclick="findNearby(\'guardia medica\')">Geolocalizza</button></div></article>'+
'<article class="item"><h3>Farmacia di turno</h3><p>Trova una farmacia aperta vicino a te.</p><div class="actions"><button onclick="findNearby(\'farmacia aperta\')">Geolocalizza</button></div></article></div>';

function createModules(itineraries){
 return {
  useful:{title:'Numeri utili',html:useful},
  infopoints:{title:'I nostri Infopoint',html:buildInfopointsHtml()},
  events:{title:'Eventi',html:buildEventsHtml()},
  experiences:{title:'Esperienze',html:'<div class="panel-grid"><article class="item"><h3>Mare e outdoor</h3><p>Escursioni in barca, kayak, diving e trekking.</p></article><article class="item"><h3>Gusto e tradizioni</h3><p>Degustazioni, laboratori e visite ai produttori.</p></article></div>'},
  sleep:{title:'Dove dormire',html:townSelector('Scegli il Comune in cui cercare una struttura ricettiva.')},
  eat:{title:'Dove mangiare',html:townSelector('Scegli il Comune in cui cercare ristoranti e locali.')},
  routes:{title:'Itinerari',html:'<div class="panel-grid">'+itineraries.map(x=>'<article class="item"><h3>'+x.title+'</h3><p>'+x.description+'</p></article>').join('')+'</div>'},
  services:{title:'Servizi',html:'<div class="panel-grid"><article class="item"><h3>Noleggio</h3><p>Auto, bici, scooter e imbarcazioni.</p></article><article class="item"><h3>Guide e accompagnatori</h3><p>Professionisti e servizi per scoprire il territorio.</p></article></div>'}
 };
}

function bindApplication(modules){
 document.getElementById('closePanel').addEventListener('click',closePanel);
overlay.addEventListener('click',e=>{if(e.target===overlay)closePanel();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closePanel();});
document.querySelectorAll('[data-module]').forEach(b=>b.addEventListener('click',()=>{const key=b.dataset.module,m=modules[key];if(key==='events'){eventsVisibleLimit=MAX_EVENTS_HOME;m.html=buildEventsHtml();}openPanel(m.title,m.html);if(key==='events')setTimeout(()=>{loadEventsArchive();},0);}));
document.getElementById('exploreBtn').addEventListener('click',()=>openPanel('Esplora il Territorio',townSelector('Cerca e seleziona un Comune.')));
document.querySelectorAll('[data-detail]').forEach(b=>b.addEventListener('click',()=>{
 const i=Number(b.dataset.detail),x=featured[i];
 openPanel(x[0],'<img src="'+x[2]+'" alt="'+x[0]+'" style="width:100%;height:330px;object-fit:cover;border-radius:20px" onerror="this.style.display=\'none\'"><div class="detail-meta"><article class="item"><h3>Comune</h3><p>'+x[1]+'</p></article><article class="item"><h3>Categoria</h3><p>Luogo da non perdere</p></article><article class="item"><h3>Consiglio</h3><p>Verifica orari e condizioni prima della visita.</p></article></div>'+featuredDetails[i]);
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
 container.innerHTML=modules.map(module=>{
  const tone=/^[a-z-]+$/.test(module.tone)?module.tone:'ocean';
  return '<button class="module ds-navigation-card module--'+tone+'" type="button" data-module="'+escapeModuleText(module.key)+'">'+
   '<span class="module__top"><span class="module__icon" aria-hidden="true">'+escapeModuleText(module.icon)+'</span></span>'+
   '<span class="module__copy"><strong>'+escapeModuleText(module.title)+'</strong><span>'+escapeModuleText(module.subtitle)+'</span></span></button>';
 }).join('');
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
 bindApplication(createModules(itineraries));
}

initApplication().catch(error=>console.error('Errore di inizializzazione Cilentomania HUB:',error));
