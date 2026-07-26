const fs = require('fs/promises');
const path = require('path');

async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (typeof fallback !== 'undefined') return fallback;
    throw error;
  }
}

async function loadAllData(dataRoot) {
  const files = {
    comuni: path.join(dataRoot, 'comuni.json'),
    accommodations: path.join(dataRoot, 'strutture-ricettive.json'),
    restaurants: path.join(dataRoot, 'ristorazione.json'),
    events: path.join(dataRoot, 'eventi.json'),
    infopoints: path.join(dataRoot, 'infopoint.json'),
    itineraries: path.join(dataRoot, 'itinerari.json'),
    usefulContacts: path.join(dataRoot, 'contatti-utili-comuni.json'),
    partners: path.join(dataRoot, 'partner.json'),
    modules: path.join(dataRoot, 'home-modules.json')
  };

  const [comuni, accommodations, restaurants, events, infopoints, itineraries, usefulContacts, partners, modules] = await Promise.all([
    readJson(files.comuni, {}),
    readJson(files.accommodations, []),
    readJson(files.restaurants, []),
    readJson(files.events, { events: [], seasonalProjects: [] }),
    readJson(files.infopoints, []),
    readJson(files.itineraries, []),
    readJson(files.usefulContacts, { contacts: [] }),
    readJson(files.partners, []),
    readJson(files.modules, { modules: [] })
  ]);

  return { comuni, accommodations, restaurants, events, infopoints, itineraries, usefulContacts, partners, modules };
}

module.exports = { loadAllData };
