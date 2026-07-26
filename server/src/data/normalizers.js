function normalize(value) {
  return String(value || '')
    .toLocaleLowerCase('it-IT')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function parseCoordinates(value) {
  if (!value) return null;
  if (typeof value === 'string') {
    const parts = value.split(',').map(item => Number(item.trim()));
    if (parts.length === 2 && parts.every(Number.isFinite)) {
      return { lat: parts[0], lon: parts[1] };
    }
    return null;
  }
  if (typeof value === 'object' && value) {
    const lat = Number(value.lat ?? value.latitude ?? value.latitudine);
    const lon = Number(value.lon ?? value.lng ?? value.longitude ?? value.longitudine);
    if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
  }
  return null;
}

function toSource(recordType, recordId, lastVerified) {
  return {
    source_name: 'Cilentomania HUB',
    source_type: 'internal_verified',
    record_type: recordType,
    record_id: String(recordId || ''),
    last_verified: lastVerified || null
  };
}

function normalizeDataset(raw) {
  const municipalityCards = Array.isArray(raw?.comuni?.territory?.cards) ? raw.comuni.territory.cards : [];
  const municipalityList = municipalityCards.map(card => ({
    id: normalize(card.municipality),
    name: card.municipality,
    normalizedName: normalize(card.municipality),
    locations: Array.isArray(card.locations) ? card.locations : [],
    description: card.introduzione || (Array.isArray(card.presentazione) ? card.presentazione[0] : ''),
    usefulContactIds: Array.isArray(card.useful_contact_ids) ? card.useful_contact_ids : [],
    source: toSource('comune', normalize(card.municipality), null)
  }));

  const localityToMunicipality = [];
  municipalityList.forEach(m => {
    m.locations.forEach(locality => {
      localityToMunicipality.push({
        locality,
        normalizedLocality: normalize(locality),
        municipality: m.name,
        municipalityId: m.id
      });
    });
  });

  const accommodations = (Array.isArray(raw.accommodations) ? raw.accommodations : []).map(item => ({
    id: item.id,
    name: item.nome,
    municipalityId: normalize(item.comune_id || item.comune || ''),
    municipality: item.comune || null,
    locality: item.localita || null,
    category: item.categoria || null,
    shortDescription: item.descrizione_breve || '',
    services: Array.isArray(item.servizi) ? item.servizi : [],
    priceRange: item.fascia_prezzo || null,
    seaDistanceMeters: Number.isFinite(Number(item.distanza_mare_metri)) ? Number(item.distanza_mare_metri) : null,
    familyFriendly: Boolean(item.adatto_famiglie),
    status: item.stato_pubblicazione || null,
    source: toSource('struttura_ricettiva', item.id, null)
  }));

  const restaurants = (Array.isArray(raw.restaurants) ? raw.restaurants : []).map(item => ({
    id: item.id,
    name: item.nome,
    municipalityId: normalize(item.comune_id || item.comune || ''),
    locality: item.localita || null,
    category: item.categoria || null,
    cuisine: Array.isArray(item.tipologie_cucina) ? item.tipologie_cucina : [],
    services: Array.isArray(item.servizi) ? item.servizi : [],
    priceRange: item.fascia_prezzo || null,
    familyFriendly: Boolean(item.adatto_famiglie),
    status: item.stato_pubblicazione || null,
    source: toSource('ristorazione', item.id, null)
  }));

  const infopoints = (Array.isArray(raw.infopoints) ? raw.infopoints : []).map(item => ({
    id: item.id,
    name: item.name,
    municipality: item.municipality,
    municipalityId: normalize(item.municipality),
    locality: item.locality,
    address: item.address,
    coordinates: parseCoordinates(item.coordinates),
    email: item.email || null,
    phone: item.phone || null,
    source: toSource('infopoint', item.id, null)
  }));

  const events = Array.isArray(raw?.events?.events) ? raw.events.events : [];
  const seasonalProjects = Array.isArray(raw?.events?.seasonalProjects) ? raw.events.seasonalProjects : [];

  const normalizedEvents = events.map((item, index) => ({
    id: item.id || `event-${index + 1}`,
    title: item.title || item.nome || 'Evento',
    municipality: item.municipality || item.comune || null,
    municipalityId: normalize(item.municipality || item.comune || ''),
    locality: item.locality || item.localita || null,
    dateText: item.date || item.data || null,
    source: toSource('evento', item.id || `event-${index + 1}`, item.last_verified || null)
  }));

  const normalizedSeasonalProjects = seasonalProjects.map((item, index) => ({
    id: `seasonal-${index + 1}`,
    title: item.title,
    place: item.place,
    description: item.description,
    source: toSource('progetto_stagionale', `seasonal-${index + 1}`, null)
  }));

  const itineraries = (Array.isArray(raw.itineraries) ? raw.itineraries : []).map((item, index) => ({
    id: `itinerary-${index + 1}`,
    title: item.title,
    description: item.description,
    source: toSource('itinerario', `itinerary-${index + 1}`, null)
  }));

  const contacts = (Array.isArray(raw?.usefulContacts?.contacts) ? raw.usefulContacts.contacts : []).map(item => ({
    id: item.id,
    municipality: item.municipality,
    municipalityId: normalize(item.municipality),
    type: item.type,
    officialName: item.official_name,
    phone: item.phone,
    website: item.website,
    status: item.status,
    lastVerified: item.last_verified || null,
    source: toSource('contatto_utile', item.id, item.last_verified || null)
  }));

  return {
    municipalities: municipalityList,
    localityToMunicipality,
    accommodations,
    restaurants,
    infopoints,
    events: normalizedEvents,
    seasonalProjects: normalizedSeasonalProjects,
    itineraries,
    contacts,
    partners: Array.isArray(raw.partners) ? raw.partners : [],
    modules: Array.isArray(raw?.modules?.modules) ? raw.modules.modules : []
  };
}

module.exports = { normalize, normalizeDataset };
