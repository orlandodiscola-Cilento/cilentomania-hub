const path = require('path');

function asNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

module.exports = {
  port: asNumber(process.env.PORT, 8787),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  aiProvider: (process.env.AI_PROVIDER || 'mock').trim().toLowerCase(),
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  chatMaxMessageLength: asNumber(process.env.CHAT_MAX_MESSAGE_LENGTH, 500),
  chatRequestTimeoutMs: asNumber(process.env.CHAT_REQUEST_TIMEOUT_MS, 7000),
  rateLimitWindowMs: asNumber(process.env.RATE_LIMIT_WINDOW_MS, 60000),
  rateLimitMaxRequests: asNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 30),
  dataRoot: path.resolve(__dirname, '..', '..', 'data')
};
