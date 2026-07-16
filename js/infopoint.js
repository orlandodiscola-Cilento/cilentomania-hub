function initInfopointData(data){
 infopoints=data;
}

let infopoints=[];
function buildInfopointsHtml(){ return `<button class="nearby-infopoint" type="button" onclick="findNearestInfopoint()">Trova l'Infopoint più vicino</button>
<div id="infopointGeoStatus" class="notice" style="display:none"></div>
<div class="notice">Consulta indirizzi e contatti ufficiali della rete Infopoint Cilentomania.</div>
<div class="panel-grid">${infopoints.map((x,i)=>`<article class="item infopoint-item" data-infopoint="${i}">
<h3>${x.name}</h3>
<p><strong>Indirizzo</strong><br>${x.address}</p>
${x.phone?`<p><strong>Telefono</strong><br>${x.phone}</p>`:''}
<p><strong>Email</strong><br><a href="mailto:${x.email}" style="color:var(--blue2);font-weight:800">${x.email}</a></p>
<div class="actions">
${x.phone?`<a href="tel:${x.phone}">Chiama</a>`:''}
<a href="mailto:${x.email}">Scrivi</a>
<a href="https://www.google.com/maps/dir/?api=1&destination=${x.coordinates}" target="_blank" rel="noopener">Come raggiungerci</a>
</div></article>`).join('')}</div>`; }

function distanceKm(lat1,lon1,lat2,lon2){
 const r=6371;
 const dLat=(lat2-lat1)*Math.PI/180;
 const dLon=(lon2-lon1)*Math.PI/180;
 const a=Math.sin(dLat/2)**2+
   Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*
   Math.sin(dLon/2)**2;
 return 2*r*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

function findNearestInfopoint(){
 const status=document.getElementById('infopointGeoStatus');
 if(!navigator.geolocation){
   status.style.display='block';
   status.textContent='La geolocalizzazione non è supportata da questo dispositivo.';
   return;
 }
 status.style.display='block';
 status.textContent='Sto cercando l’Infopoint più vicino…';
 navigator.geolocation.getCurrentPosition(position=>{
   let nearestIndex=0;
   let nearestDistance=Infinity;
   infopoints.forEach((x,i)=>{
     const [lat,lon]=x.coordinates.split(',').map(Number);
     const distance=distanceKm(
       position.coords.latitude,
       position.coords.longitude,
       lat,
       lon
     );
     if(distance<nearestDistance){
       nearestDistance=distance;
       nearestIndex=i;
     }
   });
   document.querySelectorAll('.infopoint-item').forEach(card=>card.classList.remove('nearest'));
   const card=document.querySelector(`.infopoint-item[data-infopoint="${nearestIndex}"]`);
   if(card){
     card.classList.add('nearest');
     card.scrollIntoView({behavior:'smooth',block:'center'});
   }
   status.innerHTML=`L’Infopoint più vicino è <strong>${infopoints[nearestIndex].name}</strong>, a circa ${nearestDistance.toFixed(1)} km.`;
 },()=>{
   status.textContent='Non è stato possibile rilevare la posizione. Verifica di aver autorizzato la geolocalizzazione.';
 },{enableHighAccuracy:true,timeout:10000,maximumAge:60000});
}
