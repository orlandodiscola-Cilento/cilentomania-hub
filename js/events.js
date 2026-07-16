function initEventsData(data){
 CILENTOMANIA_EVENTS_URL=data.eventsUrl||'';
 embeddedEvents=Array.isArray(data.events)?data.events:[];
 seasonalEventProjects=Array.isArray(data.seasonalProjects)?data.seasonalProjects:[];
}
let CILENTOMANIA_EVENTS_URL = '';
const MAX_EVENTS_HOME = 8;
let eventsVisibleLimit = MAX_EVENTS_HOME;
let eventsArchive = [];

// Struttura richiesta per ogni evento:
// {id,title,municipality,place,startDate,endDate,time,category,description,image,url,source,status}
// Le date devono essere nel formato AAAA-MM-GG. Gli eventi scaduti vengono esclusi automaticamente.
let embeddedEvents = [];

let seasonalEventProjects = [];

function safeText(value){return String(value??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function localISODate(d=new Date()){const x=new Date(d.getTime()-d.getTimezoneOffset()*60000);return x.toISOString().slice(0,10);}
function normalizeEvent(e,index){
 const start=String(e.startDate||'').slice(0,10), end=String(e.endDate||start).slice(0,10);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(start)) return null;
 return {...e,id:e.id||'event-'+index,startDate:start,endDate:/^\d{4}-\d{2}-\d{2}$/.test(end)?end:start,status:e.status||'published'};
}
function activeEvents(){
 const today=localISODate();
 return eventsArchive.map(normalizeEvent).filter(Boolean).filter(e=>e.status!=='draft'&&e.endDate>=today).sort((a,b)=>a.startDate.localeCompare(b.startDate)||String(a.time||'').localeCompare(String(b.time||'')));
}
function eventDateBox(e){
 const d=new Date(e.startDate+'T12:00:00');
 const day=new Intl.DateTimeFormat('it-IT',{day:'2-digit'}).format(d);
 const month=new Intl.DateTimeFormat('it-IT',{month:'short'}).format(d).replace('.','');
 const year=d.getFullYear();
 return `<div class="event-date"><strong>${day}</strong><span>${safeText(month)}</span><small>${year}${e.time?' · '+safeText(e.time):''}</small></div>`;
}
function eventCard(e){
 const destination=[e.place,e.municipality].filter(Boolean).join(' · ');
 const tags=[e.category,e.source].filter(Boolean).map(x=>`<span class="event-tag">${safeText(x)}</span>`).join('');
 const detail=e.url?`<a href="${safeText(e.url)}" target="_blank" rel="noopener">Dettagli</a>`:'';
 const map=destination?`<a class="secondary" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}" target="_blank" rel="noopener">Mappa</a>`:'';
 return `<article class="event-card">${eventDateBox(e)}<div class="event-copy"><div class="event-place">${safeText(destination||'Cilento')}</div><h3>${safeText(e.title||e.name||'Evento')}</h3><p>${safeText(e.description||'')}</p><div class="event-tags">${tags}</div><div class="event-actions">${detail}${map}</div></div></article>`;
}
function eventProjectCards(){return seasonalEventProjects.map(e=>`<article class="item"><small>PROGETTO STAGIONALE</small><h3>${safeText(e.title)}</h3><p><strong>${safeText(e.place)}</strong></p><p>${safeText(e.description)}</p></article>`).join('');}
function buildEventsHtml(){
 const all=activeEvents();
 const municipalities=[...new Set(all.map(e=>e.municipality).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'it'));
 const options=municipalities.map(x=>`<option value="${safeText(x)}">${safeText(x)}</option>`).join('');
 return `<div class="events-toolbar"><input id="eventSearch" placeholder="Cerca evento o località" oninput="refreshEventsView()"><select id="eventTown" onchange="refreshEventsView()"><option value="">Tutti i Comuni</option>${options}</select></div><div class="events-summary"><span id="eventsCount"></span><span>Massimo 8 eventi per schermata</span></div><div class="events-grid" id="eventsGrid"></div><button class="events-more" id="eventsMore" onclick="showMoreEvents()" hidden>Mostra altri eventi</button><div class="events-source-note"><strong>Aggiornamento intelligente:</strong> gli eventi vengono ordinati per data e quelli terminati spariscono automaticamente. L'archivio è già predisposto per ricevere dati da fonti esterne, mantenendo un controllo centrale Cilentomania.</div>${all.length?'':`<div class="panel-grid" style="margin-top:18px">${eventProjectCards()}</div>`}`;
}
function refreshEventsView(){
 const grid=document.getElementById('eventsGrid'); if(!grid)return;
 const q=(document.getElementById('eventSearch')?.value||'').trim().toLowerCase();
 const town=document.getElementById('eventTown')?.value||'';
 const filtered=activeEvents().filter(e=>(!town||e.municipality===town)&&(!q||[e.title,e.name,e.municipality,e.place,e.description,e.category].join(' ').toLowerCase().includes(q)));
 const shown=filtered.slice(0,eventsVisibleLimit);
 grid.innerHTML=shown.length?shown.map(eventCard).join(''):`<div class="events-empty"><h3>Nessun evento pubblicato</h3><p>Il calendario è pronto. Appena collegheremo l'archivio online, qui compariranno automaticamente gli eventi futuri verificati.</p></div>`;
 const count=document.getElementById('eventsCount'); if(count)count.textContent=filtered.length===1?'1 evento disponibile':filtered.length+' eventi disponibili';
 const more=document.getElementById('eventsMore'); if(more)more.hidden=filtered.length<=eventsVisibleLimit;
}
function showMoreEvents(){eventsVisibleLimit+=MAX_EVENTS_HOME;refreshEventsView();}
async function loadEventsArchive(){
 eventsArchive=[...embeddedEvents];
 if(CILENTOMANIA_EVENTS_URL){
  try{const r=await fetch(CILENTOMANIA_EVENTS_URL,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);const data=await r.json();eventsArchive=Array.isArray(data)?data:(Array.isArray(data.events)?data.events:eventsArchive);}catch(err){console.warn('Archivio eventi esterno non disponibile:',err);}
 }
 refreshEventsView();
}
