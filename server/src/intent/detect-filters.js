const { normalize } = require('../data/normalizers');

function detectFilters(message) {
  const text = normalize(message);
  return {
    family: /(famiglia|famiglie|bambini|bimbo|bimba)/i.test(text),
    nearSea: /(mare|spiaggia|costa)/i.test(text),
    today: /\boggi\b/i.test(text),
    weekend: /(weekend|fine settimana)/i.test(text),
    nearest: /(vicino a me|piu vicino|più vicino|nearest)/i.test(text)
  };
}

module.exports = { detectFilters };
