// Conferme accessibili nella pagina, senza finestre native del browser.
export function ask(message,{feedback=false}={}) {
 return new Promise(resolve=>{
  const dialog=document.createElement('dialog');dialog.className='operator-dialog';
  dialog.innerHTML='<form method="dialog"><h2>Conferma</h2><p></p>'+(feedback?'<label class="field">Modifiche richieste<textarea required maxlength="4000"></textarea></label>':'')+'<div class="actions"><button value="cancel" formnovalidate>Annulla</button><button class="primary" value="confirm">Conferma</button></div></form>';
  dialog.querySelector('p').textContent=message;document.body.append(dialog);
  dialog.addEventListener('close',()=>{const result=dialog.returnValue==='confirm'?(feedback?dialog.querySelector('textarea').value:true):null;dialog.remove();resolve(result);},{once:true});dialog.showModal();
 });
}
