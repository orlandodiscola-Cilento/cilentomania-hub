(function(){
 const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');

 function initializePageNavigation(dock){
  const backButton=dock.querySelector('[data-navigation-action="back"]');
  const topButton=dock.querySelector('[data-navigation-action="top"]');
  const threshold=Number(dock.dataset.topThreshold)||320;

  if(backButton)backButton.addEventListener('click',()=>window.history.back());
  if(topButton){
   const updateVisibility=()=>topButton.classList.toggle('hidden',window.scrollY<threshold);
   topButton.addEventListener('click',()=>window.scrollTo({top:0,left:0,behavior:reducedMotion.matches?'auto':'smooth'}));
   window.addEventListener('scroll',updateVisibility,{passive:true});
   updateVisibility();
  }
 }

 document.querySelectorAll('[data-navigation-scope="page"]').forEach(initializePageNavigation);
})();
