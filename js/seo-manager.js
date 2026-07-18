(function(global){
 'use strict';

 const SELECTORS={
  description:'meta[name="description"]',canonical:'link[rel="canonical"]',favicon:'link[rel~="icon"]',
  ogTitle:'meta[property="og:title"]',ogDescription:'meta[property="og:description"]',ogImage:'meta[property="og:image"]',
  ogUrl:'meta[property="og:url"]',ogType:'meta[property="og:type"]',ogLocale:'meta[property="og:locale"]',
  twitterCard:'meta[name="twitter:card"]',twitterTitle:'meta[name="twitter:title"]',
  twitterDescription:'meta[name="twitter:description"]',twitterImage:'meta[name="twitter:image"]',twitterSite:'meta[name="twitter:site"]',
  robots:'meta[name="robots"]'
 };

 function absoluteUrl(value,baseUrl){return new URL(value||'/',baseUrl).href}
 function upsert(selector,tag,attributes){
  let element=document.head.querySelector(selector);
  if(!element){element=document.createElement(tag);document.head.appendChild(element)}
  Object.entries(attributes).forEach(([name,value])=>{
   if(value===undefined||value===null||value==='')element.removeAttribute(name);
   else element.setAttribute(name,String(value));
  });
  return element;
 }
 function compact(value){
  if(Array.isArray(value))return value.map(compact).filter(item=>item!==undefined);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,compact(item)]).filter(([,item])=>item!==undefined));
  return value===null||value===''||value===undefined?undefined:value;
 }

 class SeoManager{
  constructor(config){this.config=config||{}}
  setPage(page){
   const config=this.config;
   const title=page.title?(page.titleMode==='absolute'?page.title:String(config.titleTemplate||'%s').replace('%s',page.title)):config.defaultTitle;
   const description=page.description||config.defaultDescription;
   const canonical=absoluteUrl(page.url||location.pathname,config.baseUrl);
   const image=absoluteUrl(page.image||config.defaultImage,config.baseUrl);
   const robots=page.robots||config.robots||{index:true,follow:true};
   document.title=title;
   upsert(SELECTORS.description,'meta',{name:'description',content:description});
   upsert(SELECTORS.canonical,'link',{rel:'canonical',href:canonical});
   upsert(SELECTORS.favicon,'link',{rel:'icon',href:absoluteUrl(config.favicon,config.baseUrl)});
   upsert(SELECTORS.ogTitle,'meta',{property:'og:title',content:title});
   upsert(SELECTORS.ogDescription,'meta',{property:'og:description',content:description});
   upsert(SELECTORS.ogImage,'meta',{property:'og:image',content:image});
   upsert(SELECTORS.ogUrl,'meta',{property:'og:url',content:canonical});
   upsert(SELECTORS.ogType,'meta',{property:'og:type',content:page.type||'website'});
   upsert(SELECTORS.ogLocale,'meta',{property:'og:locale',content:config.defaultLocale||'it_IT'});
   upsert(SELECTORS.twitterCard,'meta',{name:'twitter:card',content:config.twitterCard||'summary_large_image'});
   upsert(SELECTORS.twitterTitle,'meta',{name:'twitter:title',content:title});
   upsert(SELECTORS.twitterDescription,'meta',{name:'twitter:description',content:description});
   upsert(SELECTORS.twitterImage,'meta',{name:'twitter:image',content:image});
   if(config.twitterSite)upsert(SELECTORS.twitterSite,'meta',{name:'twitter:site',content:config.twitterSite});
   else document.head.querySelector(SELECTORS.twitterSite)?.remove();
   upsert(SELECTORS.robots,'meta',{name:'robots',content:(robots.index?'index':'noindex')+','+(robots.follow?'follow':'nofollow')});
   this.setStructuredData(page.structuredData||[]);
  }
  setStructuredData(items){
   document.head.querySelectorAll('script[data-seo-structured-data]').forEach(node=>node.remove());
   (Array.isArray(items)?items:[items]).map(compact).filter(Boolean).forEach(item=>{
    const script=document.createElement('script');script.type='application/ld+json';script.dataset.seoStructuredData='';
    script.textContent=JSON.stringify({'@context':'https://schema.org',...item});document.head.appendChild(script);
   });
  }
  static breadcrumb(items){return {'@type':'BreadcrumbList',itemListElement:items.map((item,index)=>({'@type':'ListItem',position:index+1,name:item.name,item:item.url}))}}
  static faq(items){return {'@type':'FAQPage',mainEntity:items.map(item=>({'@type':'Question',name:item.question,acceptedAnswer:{'@type':'Answer',text:item.answer}}))}}
  static schema(type,data){return {'@type':type,...data}}
  static applyImageAlt(image,alt){if(image instanceof HTMLImageElement&&alt&&!image.hasAttribute('alt'))image.setAttribute('alt',alt)}
  static applyImageAlts(root=document){root.querySelectorAll('img[data-seo-alt]:not([alt])').forEach(image=>{const alt=image.dataset.seoAlt;if(alt)image.setAttribute('alt',alt)})}
 }

 async function createSeoManager(configUrl='/seo/seo.config.json'){
  const response=await fetch(configUrl,{cache:'no-store'});
  if(!response.ok)throw new Error('Configurazione SEO non disponibile: '+response.status);
  return new SeoManager(await response.json());
 }

 global.CilentomaniaSEO={SeoManager,createSeoManager};
})(window);
