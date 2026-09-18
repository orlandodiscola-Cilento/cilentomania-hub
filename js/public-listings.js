(function(global){
 'use strict';
 const endpoint='https://qgkwqzjapvjvzmvdfges.supabase.co';
 let config;
 async function request(path,body,profile=false){
  config ||= fetch('operatori/public/config.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('catalog_configuration');return r.json();});
  const c=await config;if(c.supabase.url!==endpoint||!c.supabase.publishableKey.startsWith('sb_publishable_'))throw Error('catalog_configuration');
  const r=await fetch(endpoint+path,{method:'POST',headers:{apikey:c.supabase.publishableKey,Authorization:'Bearer '+c.supabase.publishableKey,'Content-Type':'application/json',...(profile?{'Content-Profile':'hub_api','Accept-Profile':'hub_api'}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw Error('catalog_unavailable');return r.json();
 }
 const focal=v=>Number.isFinite(v)?Math.max(0,Math.min(100,v)):50;
 function map(p){
  const f=p.features||{},c=p.contacts||{},l=p.location||{},photos=(p.media||[]).filter(m=>m.role!=='logo'),cover=photos.find(m=>m.role==='cover')||photos[0];
  const r={id:p.id,slug:p.slug,nome:p.name,categoria:p.category,claim:p.claim,descrizione_breve:p.shortDescription,descrizione_completa:p.description,comune_id:l.municipalitySlug,localita:l.locality||l.municipality,indirizzo:l.address,latitudine:l.latitude,longitudine:l.longitude,telefono:c.phone,whatsapp:c.whatsapp,email:c.email,sito_web:c.website,facebook:c.facebook,instagram:c.instagram,url_prenotazione:c.bookingUrl,editorialStatus:'published',stato_pubblicazione:'pubblicato',demo:p.isDemo===true,immagine_copertina:cover?.url||'',galleria:photos.filter(m=>m!==cover).map(m=>m.url),logo:p.media?.find(m=>m.role==='logo')?.url||'',focalX:focal(cover?.focalX),focalY:focal(cover?.focalY),serviceCodes:(p.amenities||[]).filter(a=>a.available===true).map(a=>a.code),translations:{}};
  for(const t of p.translations||[])r.translations[t.locale]={nome:t.name,descrizione_breve:t.shortDescription,descrizione_completa:t.description};
  if(p.type==='accommodation')Object.assign(r,{numero_camere:f.rooms,posti_letto:f.beds,check_in:f.checkIn?.slice(0,5),check_out:f.checkOut?.slice(0,5),periodo_apertura:f.openingPeriod,tipologie_camere:f.roomTypes,trattamenti_disponibili:f.boardOptions,ideale_per:f.idealFor,accessibile:f.accessible,animali_ammessi:f.pets,adatto_famiglie:f.familyFriendly,aperto_tutto_anno:f.openAllYear});
  else Object.assign(r,{tipologie_cucina:f.cuisine||[],specialita:f.specialties||[],periodo_apertura:f.opening_period,accessibile:f.accessible,animali_ammessi:f.pets,aperto_tutto_anno:f.open_all_year});
  return r;
 }
 async function list(type){
  let rows=[];for(let offset=0;;offset+=100){const page=await request('/rest/v1/rpc/public_listings',{content_type:type==='eat'?'restaurant':'accommodation',page_size:100,page_offset:offset},true);rows.push(...page);if(page.length<100)break;}
  const results=[];
  for(const row of rows){if(row.isDemo)continue;
   for(const media of row.media||[]){if(media.bucket!=='listing-published'||!/^([0-9a-f-]{36}\/){3}published$/.test(media.path))throw Error('invalid_public_media');
    const signed=await request('/storage/v1/object/sign/listing-published/'+media.path,{expiresIn:300});
    const url=new URL(signed.signedURL.startsWith('/object/')?endpoint+'/storage/v1'+signed.signedURL:signed.signedURL,endpoint);if(url.origin!==endpoint)throw Error('invalid_public_media');media.url=url.href;
   }results.push(map(row));
  }return results;
 }
 global.HubPublicListings=Object.freeze({list,map});
})(globalThis);
