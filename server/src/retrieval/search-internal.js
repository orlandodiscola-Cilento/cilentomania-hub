const { rankResults } = require('./rank-results');

function isVerifiedStatus(status) {
  const value = String(status || '').toLocaleLowerCase('it-IT');
  if (!value) return false;
  if (value.includes('bozza')) return false;
  if (value.includes('sospeso') || value.includes('scaduto')) return false;
  return value.includes('verificato') || value.includes('pubblicato') || value.includes('approvato');
}

function isFactualRecordAllowed(item) {
  if (typeof item.status === 'undefined' || item.status === null) return true;
  return isVerifiedStatus(item.status);
}

function byMunicipalityId(item, location) {
  if (!location) return true;
  return item.municipalityId === location.municipalityId;
}

function compactResult(item, type) {
  return {
    id: item.id,
    type,
    name: item.name || item.title || item.officialName,
    municipality: item.municipality || null,
    locality: item.locality || null,
    category: item.category || item.type || null,
    shortDescription: item.shortDescription || item.description || null,
    status: item.status || null
  };
}

function searchInternal({ intent, location, filters, dataset }) {
  let results = [];
  let sources = [];

  if (intent === 'accommodation') {
    const candidates = dataset.accommodations.filter(item => byMunicipalityId(item, location) && isFactualRecordAllowed(item));
    results = rankResults(candidates, filters).slice(0, 5).map(item => compactResult(item, 'accommodation'));
    sources = candidates.slice(0, 5).map(item => item.source);
  } else if (intent === 'food') {
    const candidates = dataset.restaurants.filter(item => byMunicipalityId(item, location) && isFactualRecordAllowed(item));
    results = rankResults(candidates, filters).slice(0, 5).map(item => compactResult(item, 'food'));
    sources = candidates.slice(0, 5).map(item => item.source);
  } else if (intent === 'events') {
    const candidates = dataset.events.filter(item => byMunicipalityId(item, location));
    if (candidates.length) {
      results = candidates.slice(0, 5).map(item => compactResult(item, 'event'));
      sources = candidates.slice(0, 5).map(item => item.source);
    } else {
      results = dataset.seasonalProjects.slice(0, 3).map(item => ({
        id: item.id,
        type: 'seasonal_project',
        name: item.title,
        municipality: null,
        locality: item.place,
        shortDescription: item.description
      }));
      sources = dataset.seasonalProjects.slice(0, 3).map(item => item.source);
    }
  } else if (intent === 'infopoints') {
    const candidates = dataset.infopoints.filter(item => byMunicipalityId(item, location));
    results = candidates.slice(0, 5).map(item => compactResult(item, 'infopoint'));
    sources = candidates.slice(0, 5).map(item => item.source);
  } else if (intent === 'useful_contacts') {
    const candidates = dataset.contacts.filter(item => byMunicipalityId(item, location) && isFactualRecordAllowed(item));
    results = candidates.slice(0, 6).map(item => compactResult(item, 'useful_contact'));
    sources = candidates.slice(0, 6).map(item => item.source);
  } else if (intent === 'itineraries') {
    results = dataset.itineraries.slice(0, 5).map(item => compactResult(item, 'itinerary'));
    sources = dataset.itineraries.slice(0, 5).map(item => item.source);
  } else if (intent === 'attractions' || intent === 'general_territory' || intent === 'experiences') {
    const municipality = location?.municipalityId
      ? dataset.municipalities.find(item => item.id === location.municipalityId)
      : null;
    if (municipality) {
      results = [{
        id: municipality.id,
        type: 'municipality',
        name: municipality.name,
        municipality: municipality.name,
        shortDescription: municipality.description || null
      }];
      sources = [municipality.source];
    } else {
      results = dataset.municipalities.slice(0, 4).map(item => ({
        id: item.id,
        type: 'municipality',
        name: item.name,
        municipality: item.name,
        shortDescription: item.description || null
      }));
      sources = dataset.municipalities.slice(0, 4).map(item => item.source);
    }
  }

  return { results, sources };
}

module.exports = { searchInternal };
