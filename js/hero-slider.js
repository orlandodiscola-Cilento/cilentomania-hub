(function(){
 'use strict';

 const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');

 function loadSlide(image,entry,priority='low'){
  return new Promise((resolve,reject)=>{
   const finish=()=>resolve(image);
   const fail=()=>reject(new Error('Immagine Hero non disponibile: '+entry.src));
   image.onload=finish;
   image.onerror=fail;
   image.alt='';
   image.setAttribute('aria-hidden','true');
   image.decoding='async';
   image.fetchPriority=priority;
   image.style.objectPosition=entry.objectPosition||'center center';
   image.dataset.heroSrc=entry.src;
   image.src=entry.src;
   if(image.complete&&image.naturalWidth)finish();
  });
 }

 async function initializeHeroSlider(){
  const hero=document.querySelector('[data-hero-slider]');
  if(!hero)return;
  const layers=[...hero.querySelectorAll('[data-hero-slide]')];
  if(layers.length!==2)return;

  const configPath=hero.dataset.heroConfig||'data/home-hero.json';
  const response=await fetch(configPath,{cache:'no-store'});
  if(!response.ok)throw new Error('Configurazione Hero non disponibile');
  const config=await response.json();
  const images=(config.images||[]).filter(entry=>entry?.src);
  if(!images.length)return;

  const interval=Math.max(1000,Number(config.intervalMs)||5000);
  const transition=Math.max(0,Number(config.transitionMs)||1000);
  hero.style.setProperty('--hero-transition-duration',transition+'ms');

  await loadSlide(layers[0],images[0],'high');
  layers[0].classList.add('is-active');

  if(reducedMotion.matches||images.length===1)return;

  let currentIndex=0;
  let activeLayer=0;
  let timer=null;

  const preloadNext=async()=>{
   const nextIndex=(currentIndex+1)%images.length;
   const inactive=layers[1-activeLayer];
   if(inactive.dataset.heroSrc===images[nextIndex].src&&inactive.complete&&inactive.naturalWidth)return true;
   try{await loadSlide(inactive,images[nextIndex]);return true;}
   catch(error){console.warn(error);return false;}
  };

  const schedule=()=>{
   clearTimeout(timer);
   timer=setTimeout(rotate,interval);
  };

  const rotate=async()=>{
   if(document.hidden){schedule();return;}
   const ready=await preloadNext();
   if(!ready){schedule();return;}
   const previous=layers[activeLayer];
   const nextLayerIndex=1-activeLayer;
   const next=layers[nextLayerIndex];
   next.classList.add('is-active');
   previous.classList.remove('is-active');
   activeLayer=nextLayerIndex;
   currentIndex=(currentIndex+1)%images.length;
   window.setTimeout(preloadNext,transition);
   schedule();
  };

  await preloadNext();
  schedule();
 }

 const start=()=>initializeHeroSlider().catch(error=>console.error('Errore slider Hero:',error));
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();
