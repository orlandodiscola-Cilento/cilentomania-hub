const searchI18n=window.CilentomaniaI18n;
const searchT=(key,fallback,params)=>searchI18n?.t?searchI18n.t(key,fallback,params):fallback;

function findNearby(term){
 if(!navigator.geolocation)return openPanel(searchT('overlay.error','Posizione non disponibile'),'<div class="notice">Il browser non supporta la geolocalizzazione.</div>');
 navigator.geolocation.getCurrentPosition(p=>window.open('https://www.google.com/maps/search/'+encodeURIComponent(term)+'/@'+p.coords.latitude+','+p.coords.longitude+',13z','_blank'),()=>openPanel(searchT('overlay.error','Posizione non disponibile'),'<div class="notice">Autorizza la posizione oppure cerca manualmente il servizio.</div>'));
}

function performSearch(){
 const q=document.getElementById('globalSearch').value.trim().toLowerCase();
 if(!q)return openPanel(searchT('overlay.searchTitle','Ricerca'),'<div class="notice">'+searchT('overlay.searchPrompt','Scrivi il nome di un Comune, luogo o servizio.')+'</div>');
 const towns=municipalities.filter(x=>x.toLowerCase().includes(q));
 const feats=featured.filter(x=>(x[0]+' '+x[1]+' '+x[3]).toLowerCase().includes(q));
 let h='<div class="panel-grid">';
 towns.forEach(x=>h+='<article class="item"><h3>'+x+'</h3><p>'+searchT('overlay.municipality','Comune del territorio')+'</p></article>');
 feats.forEach(x=>h+='<article class="item"><h3>'+x[0]+'</h3><p>'+x[1]+'</p></article>');
 h+='</div>';
 openPanel(searchT('overlay.searchResults','Risultati della ricerca'),(towns.length||feats.length)?h:'<div class="notice">'+searchT('overlay.noResults','Nessun risultato.')+'</div>');
}
