(function(){
 'use strict';

 async function initializeSeo(){
  const root=document.documentElement;
  const pageId=root.dataset.seoPage;
  if(!pageId||!window.CilentomaniaSEO)return;
  const configUrl=root.dataset.seoConfig||'/seo/seo.config.json';
  const pagesUrl=root.dataset.seoPages||'/seo/pages.json';
  const [configResponse,pagesResponse,siteContacts]=await Promise.all([fetch(configUrl,{cache:'no-store'}),fetch(pagesUrl,{cache:'no-store'}),globalThis.CilentomaniaSite?.load?.()||Promise.resolve(null)]);
  if(!configResponse.ok||!pagesResponse.ok)throw new Error('Configurazione SEO non disponibile');
  const [config,registry]=await Promise.all([configResponse.json(),pagesResponse.json()]);
  const registeredPage=registry.pages?.[pageId];
  const page=registeredPage?{...registeredPage}:null;
  if(!page)throw new Error('Profilo SEO non trovato: '+pageId);
  if(siteContacts&&Array.isArray(page.structuredData))page.structuredData=page.structuredData.map(schema=>schema?.['@type']==='Organization'?{...schema,...CilentomaniaSite.organizationContacts(siteContacts)}:schema);
  const manager=new CilentomaniaSEO.SeoManager(config);
  manager.setPage(page);
  CilentomaniaSEO.SeoManager.applyImageAlts(document);
  const observer=new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{
   if(node.nodeType!==Node.ELEMENT_NODE)return;
   if(node.matches?.('img[data-seo-alt]:not([alt])'))CilentomaniaSEO.SeoManager.applyImageAlt(node,node.dataset.seoAlt);
   CilentomaniaSEO.SeoManager.applyImageAlts(node);
  })));
  observer.observe(document.body,{childList:true,subtree:true});
 }

 const start=()=>initializeSeo().catch(error=>console.error('Errore SEO Foundation:',error));
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();
