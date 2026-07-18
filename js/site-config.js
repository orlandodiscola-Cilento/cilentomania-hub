(function(){
 'use strict';

 let configPromise=null;

 function configUrl(){
  return document.documentElement.dataset.siteContacts||'data/site-contacts.json';
 }

 async function load(){
  if(configPromise)return configPromise;
  configPromise=fetch(configUrl(),{cache:'no-store'}).then(response=>{
   if(!response.ok)throw new Error('HTTP '+response.status);
   return response.json();
  });
  return configPromise;
 }

 function contact(config,key){return config?.[key]||null}

 function apply(root=document,config){
  root.querySelectorAll('[data-site-contact]').forEach(link=>{
   const key=link.dataset.siteContact;
   const entry=contact(config,key);
   if(!entry?.url)return;
   link.href=entry.url;
   if(key==='instagram'){
    link.setAttribute('aria-label',entry.username);
    link.title=entry.username;
   }
   if(/^https?:/i.test(entry.url)){
    link.target='_blank';
    link.rel='noopener noreferrer';
   }else{
    link.removeAttribute('target');
    link.removeAttribute('rel');
   }
   if(link.hasAttribute('data-site-contact-label'))link.textContent=entry.username||entry.display||link.textContent;
  });
 }

 function organizationContacts(config){
  return {
   email:config?.email?.display||undefined,
   telephone:(config?.numeroVerde?.display||'').replace(/\s+/g,'')||undefined,
   sameAs:[config?.facebook?.url,config?.instagram?.url].filter(Boolean)
  };
 }

 const api={load,apply,organizationContacts};
 globalThis.CilentomaniaSite=api;
 const start=()=>load().then(config=>apply(document,config)).catch(error=>console.error('Configurazione recapiti non disponibile:',error));
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();
