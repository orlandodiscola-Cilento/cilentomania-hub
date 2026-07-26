const { sanitizeText } = require('../utils/sanitize');

function validateChatPayload(payload, config) {
  const message = sanitizeText(payload?.message || '', config.chatMaxMessageLength + 10);
  if (!message.trim()) {
    return { ok: false, status: 400, error: 'Messaggio vuoto' };
  }
  if (message.length > config.chatMaxMessageLength) {
    return { ok: false, status: 400, error: `Messaggio troppo lungo (max ${config.chatMaxMessageLength})` };
  }

  const language = String(payload?.language || 'it').slice(0, 10);
  const conversation = Array.isArray(payload?.conversation) ? payload.conversation.slice(-12) : [];
  const location = payload?.location && typeof payload.location === 'object' ? payload.location : null;

  return {
    ok: true,
    value: {
      message,
      language,
      conversation,
      location
    }
  };
}

module.exports = { validateChatPayload };
