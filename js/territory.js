let municipalities=[];
let featured=[];
let featuredDetails=[];
let territoryConfig={placeholderImage:'assets/placeholder-comune.svg',cards:[]};

function initTerritoryData(data){
 municipalities=Array.isArray(data.municipalities)?data.municipalities:data.municipalities.value;
 featured=data.featured.map(x=>[x.title,x.municipality,x.image,x.description]);
 featuredDetails=data.featured.map(x=>x.detailHtml);
 territoryConfig={...territoryConfig,...(data.territory||{})};
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
 return {municipality:name,image:configured.image||territoryConfig.placeholderImage,locations:configured.locations||[]};
}
function municipalityHasInfopoint(card){
 const terms=[card.municipality,...card.locations].map(value=>value.toLowerCase());
 return typeof infopoints!=='undefined'&&infopoints.some(point=>{
  const text=(point.name+' '+point.address).toLowerCase();
  return terms.some(term=>text.includes(term));
 });
}
function territoryExplorer(note){
 const cards=municipalities.map(name=>{
  const card=territoryCardData(name);
  const search=[card.municipality,...card.locations].join(' ').toLowerCase();
  const badge=municipalityHasInfopoint(card)?'<span class="territory-badge">Infopoint</span>':'';
  return '<article class="territory-card" data-search="'+safeTerritoryText(search)+'"><div class="territory-image"><img src="'+safeTerritoryText(card.image)+'" width="800" height="500" loading="lazy" alt="'+safeTerritoryText(card.municipality)+'" onerror="this.onerror=null;this.src=\''+safeTerritoryText(territoryConfig.placeholderImage)+'\'">'+badge+'</div><div class="territory-card-copy"><h3>'+safeTerritoryText(card.municipality)+'</h3><button class="territory-discover" type="button" data-territory="'+safeTerritoryText(card.municipality)+'">Scopri</button></div></article>';
 }).join('');
 return '<div class="notice">'+note+'</div><label class="territory-search-label" for="townFilter">Cerca per Comune o località</label><input class="town-search" id="townFilter" placeholder="Cerca un Comune o una località..."><div class="territory-grid" id="townList">'+cards+'</div><p class="territory-empty hidden" id="territoryEmpty">Nessun Comune trovato.</p>';
}
function openPanel(title,html){
 panelContent.innerHTML='<h2>'+title+'</h2>'+html;
 overlay.classList.add('open');document.body.style.overflow='hidden';
 setTimeout(bindTownFilter,0);
}
function closePanel(){overlay.classList.remove('open');document.body.style.overflow='';}
function bindTownFilter(){
 const f=document.getElementById('townFilter'); if(!f)return;
 const openTerritoryCard=name=>openPanel(name,'<div class="notice">Scheda territoriale predisposta per essere popolata con cosa vedere, dove dormire, dove mangiare, eventi, esperienze e servizi.</div><div class="panel-grid"><article class="item"><h3>Cosa vedere</h3><p>Attrattori e luoghi di interesse.</p></article><article class="item"><h3>Dove dormire</h3><p>Strutture ricettive presenti nel Comune.</p></article><article class="item"><h3>Dove mangiare</h3><p>Ristoranti, agriturismi e locali.</p></article><article class="item"><h3>Eventi ed esperienze</h3><p>Appuntamenti e attività disponibili.</p></article></div>');
 f.addEventListener('input',()=>{
  const q=f.value.trim().toLowerCase();
  const options=document.querySelectorAll('#townList .town,#townList .territory-card');
  let visible=0;
  options.forEach(option=>{const match=(option.dataset.name||option.dataset.search||'').includes(q);option.classList.toggle('hidden',!match);if(match)visible++;});
  const empty=document.getElementById('territoryEmpty');if(empty)empty.classList.toggle('hidden',visible>0);
 });
 document.querySelectorAll('#townList .town').forEach(button=>button.addEventListener('click',()=>openTerritoryCard(button.textContent)));
 document.querySelectorAll('#townList [data-territory]').forEach(button=>button.addEventListener('click',()=>openTerritoryCard(button.dataset.territory)));
}
