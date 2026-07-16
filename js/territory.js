let municipalities=[];
let featured=[];
let featuredDetails=[];

function initTerritoryData(data){
 municipalities=Array.isArray(data.municipalities)?data.municipalities:data.municipalities.value;
 featured=data.featured.map(x=>[x.title,x.municipality,x.image,x.description]);
 featuredDetails=data.featured.map(x=>x.detailHtml);
}
function townSelector(note){
 return '<div class="notice">'+note+'</div><input class="town-search" id="townFilter" placeholder="Cerca un Comune..."><div class="towns" id="townList">'+municipalities.map(m=>'<button class="town" data-name="'+m.toLowerCase()+'">'+m+'</button>').join('')+'</div>';
}
function openPanel(title,html){
 panelContent.innerHTML='<h2>'+title+'</h2>'+html;
 overlay.classList.add('open');document.body.style.overflow='hidden';
 setTimeout(bindTownFilter,0);
}
function closePanel(){overlay.classList.remove('open');document.body.style.overflow='';}
function bindTownFilter(){
 const f=document.getElementById('townFilter'); if(!f)return;
 f.addEventListener('input',()=>{const q=f.value.toLowerCase();document.querySelectorAll('#townList .town').forEach(b=>b.classList.toggle('hidden',!b.dataset.name.includes(q)));});
 document.querySelectorAll('#townList .town').forEach(b=>b.addEventListener('click',()=>openPanel(b.textContent,'<div class="notice">Scheda territoriale predisposta per essere popolata con cosa vedere, dove dormire, dove mangiare, eventi, esperienze e servizi.</div><div class="panel-grid"><article class="item"><h3>Cosa vedere</h3><p>Attrattori e luoghi di interesse.</p></article><article class="item"><h3>Dove dormire</h3><p>Strutture ricettive presenti nel Comune.</p></article><article class="item"><h3>Dove mangiare</h3><p>Ristoranti, agriturismi e locali.</p></article><article class="item"><h3>Eventi ed esperienze</h3><p>Appuntamenti e attività disponibili.</p></article></div>')));
}
