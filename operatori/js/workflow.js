export const STATES=['draft','submitted','in_review','approved','published','changes_requested','suspended'];
export const labels={draft:'Bozza',submitted:'Modifiche in attesa di approvazione',in_review:'In revisione',approved:'Approvata, in attesa di pubblicazione',published:'Pubblicata',changes_requested:'Modifiche richieste',suspended:'Sospesa'};
export function transition(from,to,role) {
  const map=role==='admin'?{submitted:['in_review','approved','changes_requested'],in_review:['approved','changes_requested'],approved:['published'],published:['suspended'],suspended:['published']}:{draft:['submitted'],changes_requested:['draft']};
  if(!map[from]?.includes(to)) throw Error('Questa operazione non è disponibile nello stato attuale.');
  return to;
}
