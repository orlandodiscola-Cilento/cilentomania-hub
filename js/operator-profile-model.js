(function (global) {
  'use strict';
  const SERVICE_CODES = Object.freeze(['wifi', 'pool', 'parking', 'breakfast', 'air_conditioning', 'sea_view', 'pets', 'accessible', 'spa', 'restaurant']);
  const LEGACY_SERVICES = { wifi: 'wifi', piscina: 'pool', parcheggio: 'parking', 'colazione inclusa': 'breakfast', 'aria condizionata': 'air_conditioning', 'vista mare': 'sea_view', 'animali ammessi': 'pets' };
  const text = value => typeof value === 'string' ? value.trim() : '';
  const count = value => typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null;
  const time = value => /^([01]\d|2[0-3]):[0-5]\d$/.test(text(value)) ? text(value) : '';
  const triState = value => typeof value === 'boolean' ? value : null;
  const normalized = value => text(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s\u2011-]/g, '');
  function safeUrl(value, image = false) {
    const raw = text(value);
    if (!raw) return '';
    if (image && /^(?:images|assets)\/[\w./-]+$/.test(raw) && !raw.includes('..')) return raw;
    try { const url = new URL(raw); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : ''; } catch (_) { return ''; }
  }
  function coordinates(lat, lng) {
    if (lat === null || lng === null || lat === undefined || lng === undefined || lat === '' || lng === '') return null;
    const latitude = Number(lat), longitude = Number(lng);
    return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? { latitude, longitude } : null;
  }
  function normalize(record, language = 'it') {
    const localized = record.translations?.[language] || {};
    const field = key => text(localized[key]) || text(record[key]);
    const list = key => (Array.isArray(localized[key]) ? localized[key] : Array.isArray(record[key]) ? record[key] : []).map(text).filter(Boolean);
    const editorialStatus = text(record.editorialStatus || record.stato_pubblicazione) || 'draft';
    const isDemo = record.demo === true || editorialStatus === 'demo' || editorialStatus === 'bozza tecnica';
    const isDraft = !['published', 'pubblicato'].includes(editorialStatus);
    const structured = Array.isArray(record.serviceCodes) ? record.serviceCodes : null;
    const services = structured ? structured.filter(code => SERVICE_CODES.includes(code)) : (Array.isArray(record.servizi) ? record.servizi : []).map(label => Object.entries(LEGACY_SERVICES).find(([key]) => normalized(key) === normalized(label))?.[1]).filter(Boolean);
    const phone = text(record.telefono).replace(/[\s().-]/g, '');
    const whatsapp = text(record.whatsapp).replace(/[\s()+.-]/g, '');
    const email = text(record.email);
    const photos = [record.immagine_copertina, ...(Array.isArray(record.galleria) ? record.galleria : [])].map(value => safeUrl(value, true)).filter(Boolean);
    return {
      publicProfile: {
        id: text(record.id), slug: text(record.slug), type: 'accommodation', municipalityId: text(record.comune_id),
        logo: safeUrl(record.logo, true), name: field('nome'), category: field('categoria'), locality: field('localita'), address: field('indirizzo'),
        claim: field('claim'), description: field('descrizione_completa') || field('descrizione_breve'),
        isDemo, isDraft, photos: [...new Set(photos)], photosIllustrative: record.photosIllustrative === true,
        services: [...new Set(services)],
        features: { roomCount: count(record.numero_camere), beds: count(record.posti_letto), checkIn: time(record.check_in), checkOut: time(record.check_out), rooms: list('tipologie_camere'), board: list('trattamenti_disponibili'), idealFor: list('ideale_per'), opening: field('periodo_apertura'), accessible: triState(record.accessibile), pets: triState(record.animali_ammessi), family: triState(record.adatto_famiglie), yearRound: triState(record.aperto_tutto_anno) },
        coordinates: coordinates(record.latitudine, record.longitudine),
        contacts: { phone: /^\+?[1-9]\d{6,14}$/.test(phone) ? phone : '', whatsapp: /^[1-9]\d{7,14}$/.test(whatsapp) ? whatsapp : '', email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '', website: safeUrl(record.sito_web), booking: safeUrl(record.url_prenotazione), facebook: safeUrl(record.facebook), instagram: safeUrl(record.instagram) },
        territoryContent: (Array.isArray(record.territoryContent) ? record.territoryContent : []).filter(item => item && ['event','experience','restaurant','itinerary'].includes(item.type) && item.municipalityId === record.comune_id).map(item => ({ id: text(item.id), type: item.type, demo: item.demo === true, title: text(item.translations?.[language]?.title) || text(item.title), description: text(item.translations?.[language]?.description) || text(item.description), image: safeUrl(item.image, true), municipalityId: item.municipalityId })),
        related: (Array.isArray(record.relatedContent) ? record.relatedContent : []).filter(ref => ref && typeof ref.id === 'string' && typeof ref.type === 'string').map(({ id, type }) => ({ id, type }))
      },
      // In production these fields belong to a private API, never the public JSON response.
      administration: {
        organizationId: text(record.organizationId) || null,
        contentOwner: text(record.contentOwner) || null,
        editorialStatus,
        planId: text(record.planId) || null,
        subscriptionId: text(record.subscriptionId) || null,
        commercial: { startsAt: text(record.administration?.commercial?.startsAt) || null, expiresAt: text(record.administration?.commercial?.expiresAt) || null, subscriptionStatus: text(record.administration?.commercial?.subscriptionStatus) || null, renewalAt: text(record.administration?.commercial?.renewalAt) || null }
      }
    };
  }
  function actions(profile) {
    const c = profile.contacts, point = profile.coordinates;
    const destination = point ? `${point.latitude},${point.longitude}` : profile.address;
    return [
      { key: 'call', href: c.phone ? `tel:${c.phone}` : '' },
      { key: 'whatsapp', href: c.whatsapp ? `https://wa.me/${c.whatsapp}` : '' },
      { key: 'directions', href: destination ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}` : '' },
      { key: 'book', href: c.booking }
    ].map(action => ({ ...action, enabled: Boolean(action.href) && !profile.isDemo && !profile.isDraft }));
  }
  function resolveRelated(profile, catalog) {
    return profile.related.map(ref => catalog.find(item => item.type === ref.type && item.id === ref.id)).filter(Boolean).slice(0, 3);
  }
  global.OperatorProfileModel = Object.freeze({ normalize, actions, resolveRelated, SERVICE_CODES, safeUrl, coordinates });
})(globalThis);
