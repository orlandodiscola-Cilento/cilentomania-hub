function stripTags(text) {
  return String(text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function sanitizeText(text, maxLen) {
  const clean = stripTags(text);
  if (typeof maxLen === 'number' && clean.length > maxLen) {
    return clean.slice(0, maxLen);
  }
  return clean;
}

function sanitizeAction(action) {
  return {
    id: String(action.id || '').slice(0, 80),
    label: sanitizeText(action.label || '', 120),
    query: sanitizeText(action.query || '', 220)
  };
}

module.exports = { sanitizeText, sanitizeAction };
