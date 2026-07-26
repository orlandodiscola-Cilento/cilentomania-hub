const { normalize } = require('../data/normalizers');

const INTENT_MAP = [
  { intent: 'accommodation', keywords: ['dormire', 'alloggiare', 'soggiornare', 'hotel', 'albergo', 'b&b', 'bed and breakfast', 'casa vacanza', 'agriturismo', 'struttura ricettiva'] },
  { intent: 'food', keywords: ['mangiare', 'ristorante', 'pizzeria', 'trattoria', 'pranzo', 'cena', 'locale'] },
  { intent: 'events', keywords: ['eventi', 'manifestazioni', 'spettacoli', 'concerti', 'sagre', 'oggi', 'fine settimana', 'weekend'] },
  { intent: 'experiences', keywords: ['esperienza', 'esperienze', 'attivita', 'attività', 'famiglia', 'bambini'] },
  { intent: 'itineraries', keywords: ['itinerario', 'itinerari', 'percorso', 'tre giorni', 'giornata'] },
  { intent: 'attractions', keywords: ['cosa vedere', 'visitare', 'luoghi', 'attrazioni'] },
  { intent: 'infopoints', keywords: ['infopoint', 'informazioni turistiche', 'ufficio turistico'] },
  { intent: 'useful_contacts', keywords: ['numeri utili', 'farmacie', 'farmacia', 'emergenza', 'guardia medica', 'parcheggiare', 'parcheggio'] },
  { intent: 'general_territory', keywords: ['parlami di', 'territorio', 'cilento'] }
];

function detectIntent(message) {
  const text = normalize(message);
  let best = { intent: 'general_territory', score: 0 };

  INTENT_MAP.forEach(entry => {
    const score = entry.keywords.reduce((acc, keyword) => acc + (text.includes(normalize(keyword)) ? 1 : 0), 0);
    if (score > best.score) {
      best = { intent: entry.intent, score };
    }
  });

  const confidence = best.score <= 0 ? 0.35 : Math.min(0.98, 0.45 + best.score * 0.12);
  return { intent: best.intent, confidence };
}

module.exports = { detectIntent };
