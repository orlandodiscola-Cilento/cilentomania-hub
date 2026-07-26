function buildActions(intent, location, dataset) {
  if (intent === 'accommodation') {
    const actions = [{ id: 'open-sleep', label: 'Apri Dove dormire', query: 'Mostrami la sezione Dove dormire' }];
    if (location?.municipalityId) {
      const municipality = dataset.municipalities.find(item => item.id === location.municipalityId);
      if (municipality) {
        municipality.locations.slice(0, 4).forEach(locality => {
          actions.push({ id: `loc-${locality}`, label: locality, query: `Mostrami opzioni per ${locality}` });
        });
      }
    }
    return actions;
  }

  if (intent === 'food') return [{ id: 'open-eat', label: 'Apri Dove mangiare', query: 'Mostrami la sezione Dove mangiare' }];
  if (intent === 'events') return [{ id: 'open-events', label: 'Apri Eventi', query: 'Mostrami la sezione Eventi' }];
  if (intent === 'infopoints') return [{ id: 'open-infopoints', label: 'Apri Infopoint', query: 'Mostrami gli Infopoint' }];
  if (intent === 'itineraries') return [{ id: 'open-routes', label: 'Apri Itinerari', query: 'Mostrami la sezione Itinerari' }];
  return [{ id: 'explore-territory', label: 'Esplora il territorio', query: 'Aiutami a esplorare il territorio del Cilento' }];
}

function summarizeResults(results) {
  return results.slice(0, 3).map(item => {
    const pieces = [item.name];
    if (item.locality) pieces.push(`(${item.locality})`);
    if (item.category) pieces.push(`- ${item.category}`);
    return `- ${pieces.join(' ')}`;
  }).join('\n');
}

function noDataMessage(intent, location) {
  const place = location?.name ? ` per ${location.name}` : '';
  if (intent === 'accommodation') {
    return `Al momento nel Cilentomania HUB non risultano ancora strutture ricettive verificate${place}. Posso pero aiutarti a scegliere la zona piu adatta oppure mostrarti la sezione Dove dormire.`;
  }
  if (intent === 'food') return `Al momento nel Cilentomania HUB non risultano ancora ristoranti verificati${place}. Posso mostrarti la sezione Dove mangiare per continuare la ricerca.`;
  if (intent === 'events') return `Al momento non risultano eventi interni verificati${place} per questa ricerca. Posso indicarti i progetti stagionali disponibili.`;
  if (intent === 'useful_contacts') return `Al momento non ho contatti utili verificati${place} per questa richiesta specifica.`;
  return `Al momento nel Cilentomania HUB non ci sono dati interni sufficienti${place} per rispondere in modo verificato.`;
}

function buildAnswer({ intent, location, results, dataset, usedAiText }) {
  const hasResults = Array.isArray(results) && results.length > 0;
  const answer = hasResults
    ? (usedAiText || `Ecco cosa risulta nei dati interni di Cilentomania HUB:\n${summarizeResults(results)}`)
    : noDataMessage(intent, location);

  const confidence = hasResults ? 0.82 : 0.58;

  return {
    answer,
    actions: buildActions(intent, location, dataset),
    confidence,
    fallback: !hasResults
  };
}

module.exports = { buildAnswer };
