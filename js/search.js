function findNearby(term){
 if(!navigator.geolocation)return openPanel('Posizione non disponibile','<div class="notice">Il browser non supporta la geolocalizzazione.</div>');
 navigator.geolocation.getCurrentPosition(p=>window.open('https://www.google.com/maps/search/'+encodeURIComponent(term)+'/@'+p.coords.latitude+','+p.coords.longitude+',13z','_blank'),()=>openPanel('Posizione non disponibile','<div class="notice">Autorizza la posizione oppure cerca manualmente il servizio.</div>'));
}

function performSearch(){
 const q=document.getElementById('globalSearch').value.trim().toLowerCase();
 if(!q)return openPanel('Ricerca','<div class="notice">Scrivi il nome di un Comune, luogo o servizio.</div>');
 const towns=municipalities.filter(x=>x.toLowerCase().includes(q));
 const feats=featured.filter(x=>(x[0]+' '+x[1]+' '+x[3]).toLowerCase().includes(q));
 let h='<div class="panel-grid">';
 towns.forEach(x=>h+='<article class="item"><h3>'+x+'</h3><p>Comune del territorio</p></article>');
 feats.forEach(x=>h+='<article class="item"><h3>'+x[0]+'</h3><p>'+x[1]+'</p></article>');
 h+='</div>';
 openPanel('Risultati della ricerca',(towns.length||feats.length)?h:'<div class="notice">Nessun risultato.</div>');
}
