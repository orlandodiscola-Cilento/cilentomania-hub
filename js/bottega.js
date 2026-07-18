(function(){
 const grid=document.getElementById('bottegaCategoryGrid');

 function escapeHtml(value){return String(value??'').replace(/[&<>"]/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[character]));}
 function categoryMedia(category){
  if(category.image)return '<img class="bottega-category__image" src="'+escapeHtml(category.image)+'" alt="" loading="lazy">';
  return '<span class="bottega-category__icon" aria-hidden="true">'+escapeHtml(category.icon||'◇')+'</span>';
 }
 function categoryButton(category){
  const label=escapeHtml(category.button_text||'Scopri');
  if(!category.active)return '<button class="bottega-category__button" type="button" disabled aria-disabled="true">'+label+'</button>';
  return '<a class="bottega-category__button" href="'+escapeHtml(category.destination||'#')+'">'+label+'</a>';
 }
 function renderCategories(categories){
  const ordered=[...categories].sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));
  grid.innerHTML=ordered.map((category,index)=>'<article data-category-id="'+escapeHtml(category.id)+'"><div class="bottega-category__head"><span class="bottega-category__order">'+String(index+1).padStart(2,'0')+'</span>'+categoryMedia(category)+'</div><h3>'+escapeHtml(category.title)+'</h3>'+categoryButton(category)+'</article>').join('');
 }
 async function loadCategories(){
  try{
   const response=await fetch('data/bottega-categorie.json',{cache:'no-store'});
   if(!response.ok)throw new Error('HTTP '+response.status);
   const data=await response.json();
   if(!Array.isArray(data.categories))throw new Error('Archivio categorie non valido');
   renderCategories(data.categories);
  }catch(error){
   grid.innerHTML='<p class="bottega-categories__error" role="alert">Le categorie non sono temporaneamente disponibili.</p>';
   console.error('Errore caricamento categorie Bottega:',error);
  }
 }
 loadCategories();
})();
