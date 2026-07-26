function normalizeSource(source) {
  return {
    source_name: source.source_name || 'Cilentomania HUB',
    source_type: source.source_type || 'internal_verified',
    record_type: source.record_type || 'record',
    record_id: source.record_id || 'unknown',
    last_verified: source.last_verified || null
  };
}

function validateAnswer(payload) {
  const safe = { ...payload };
  safe.answer = String(safe.answer || '').replace(/<[^>]*>/g, '').trim();
  safe.intent = String(safe.intent || 'general_territory');
  safe.results = Array.isArray(safe.results) ? safe.results : [];
  safe.actions = Array.isArray(safe.actions) ? safe.actions : [];
  safe.sources = Array.isArray(safe.sources) ? safe.sources.map(normalizeSource) : [];
  safe.confidence = Number.isFinite(Number(safe.confidence)) ? Number(safe.confidence) : 0.4;
  safe.fallback = Boolean(safe.fallback);

  if (safe.results.length && !safe.sources.length) {
    safe.fallback = true;
    safe.answer = 'Non ho fonti interne sufficienti per fornire una risposta fattuale verificata.';
    safe.results = [];
  }

  return safe;
}

module.exports = { validateAnswer };
