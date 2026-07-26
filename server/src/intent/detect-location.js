const { normalize } = require('../data/normalizers');

function detectLocation(message, dataset) {
  const text = normalize(message);
  if (!text) return null;

  const municipalityMatch = dataset.municipalities.find(item => text.includes(item.normalizedName));
  if (municipalityMatch) {
    return {
      name: municipalityMatch.name,
      type: 'comune',
      municipalityId: municipalityMatch.id,
      confidence: 0.95
    };
  }

  const localityMatch = dataset.localityToMunicipality.find(item => text.includes(item.normalizedLocality));
  if (localityMatch) {
    return {
      name: localityMatch.locality,
      type: 'localita',
      municipality: localityMatch.municipality,
      municipalityId: localityMatch.municipalityId,
      confidence: 0.88
    };
  }

  return null;
}

module.exports = { detectLocation };
