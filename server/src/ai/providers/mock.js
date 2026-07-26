async function mockProvider({ intent, location, results }) {
  const place = location?.name ? ` a ${location.name}` : '';
  if (!results.length) return null;

  const leadByIntent = {
    accommodation: `Ho trovato alcune opzioni per dormire${place} nei dati interni verificati:`,
    food: `Ho trovato alcune opzioni dove mangiare${place} nei dati interni verificati:`,
    events: `Ecco cosa risulta sugli eventi${place} dai dati interni disponibili:`,
    infopoints: `Ecco gli Infopoint disponibili${place} nei dati interni:`,
    itineraries: 'Ecco alcuni itinerari presenti nei dati interni:',
    attractions: `Ecco cosa posso indicarti${place} dai contenuti interni verificati:`,
    experiences: `Ecco spunti di esperienza${place} basati su dati interni:`,
    useful_contacts: `Ecco i contatti utili disponibili${place} nei dati interni:`
  };

  const head = leadByIntent[intent] || 'Ecco cosa risulta nei dati interni verificati:';
  const lines = results.slice(0, 3).map(item => `- ${item.name}${item.locality ? ` (${item.locality})` : ''}`);
  return `${head}\n${lines.join('\n')}`;
}

module.exports = { mockProvider };
