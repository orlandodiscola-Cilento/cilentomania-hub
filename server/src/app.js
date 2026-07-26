const http = require('http');
const { URL } = require('url');
const config = require('./config');
const { logger } = require('./logging/logger');
const { InternalRepository } = require('./data/repository');
const { createAiProvider } = require('./ai/provider');
const { createRateLimiter } = require('./middleware/rate-limit');
const { sendJson, readJson } = require('./utils/http');
const { handleChat } = require('./routes/chat');

function createApp(customConfig = config) {
  const repository = new InternalRepository(customConfig, logger);
  const ai = createAiProvider(customConfig, logger);
  const checkRateLimit = createRateLimiter(customConfig);

  return http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

    if (request.method === 'OPTIONS') {
      sendJson(response, 204, {}, customConfig.corsOrigin);
      return;
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      sendJson(response, 200, { ok: true, service: 'cilentino-server' }, customConfig.corsOrigin);
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/chat') {
      const limiter = checkRateLimit(request.socket.remoteAddress);
      if (!limiter.allowed) {
        sendJson(response, 429, {
          answer: 'Limite richieste raggiunto. Riprova tra poco.',
          retryAfterMs: limiter.retryAfterMs
        }, customConfig.corsOrigin);
        return;
      }

      try {
        const payload = await readJson(request);
        const result = await handleChat({ payload, repository, ai, config: customConfig, logger });
        sendJson(response, result.status, result.body, customConfig.corsOrigin);
      } catch (error) {
        logger.error('Errore API chat', { message: error.message });
        sendJson(response, 500, {
          answer: 'Servizio temporaneamente non disponibile.',
          intent: 'unknown',
          location: null,
          results: [],
          actions: [],
          sources: [],
          confidence: 0,
          fallback: true
        }, customConfig.corsOrigin);
      }
      return;
    }

    sendJson(response, 404, { error: 'Not found' }, customConfig.corsOrigin);
  });
}

function startServer() {
  const server = createApp(config);
  server.listen(config.port, () => {
    logger.info('Server Cilentino avviato', { port: config.port, aiProvider: config.aiProvider });
  });
  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = { createApp, startServer };
