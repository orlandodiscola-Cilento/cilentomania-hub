const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');
const { validateAnswer } = require('../src/response/validate-answer');
const apiClient = require('../../js/cileo-api-client.js');

async function startTestServer(overrides = {}) {
  const server = createApp({
    port: 0,
    corsOrigin: '*',
    aiProvider: 'mock',
    openaiApiKey: '',
    openaiModel: 'gpt-4o-mini',
    chatMaxMessageLength: 500,
    chatRequestTimeoutMs: 7000,
    rateLimitWindowMs: 60000,
    rateLimitMaxRequests: 200,
    dataRoot: require('path').resolve(__dirname, '..', '..', 'data'),
    ...overrides
  });
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

async function postChat(baseUrl, message) {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversation: [], location: null, language: 'it' })
  });
  const body = await response.json();
  return { status: response.status, body };
}

test('1) Vorrei dormire a Castellabate', async () => {
  const { server, baseUrl } = await startTestServer();
  const { body } = await postChat(baseUrl, 'Vorrei dormire a Castellabate');
  assert.equal(body.intent, 'accommodation');
  assert.equal(body.location.name, 'Castellabate');
  assert.ok(Array.isArray(body.results));
  if (!body.results.length) {
    assert.equal(body.fallback, true);
    assert.match(body.answer, /non risultano ancora strutture ricettive verificate/i);
  }
  server.close();
});

test('2) Dove posso mangiare ad Agropoli?', async () => {
  const { server, baseUrl } = await startTestServer();
  const { body } = await postChat(baseUrl, 'Dove posso mangiare ad Agropoli?');
  assert.equal(body.intent, 'food');
  assert.equal(body.location.name, 'Agropoli');
  server.close();
});

test('3) Che eventi ci sono oggi a Paestum?', async () => {
  const { server, baseUrl } = await startTestServer();
  const { body } = await postChat(baseUrl, 'Che eventi ci sono oggi a Paestum?');
  assert.equal(body.intent, 'events');
  assert.ok(body.location);
  server.close();
});

test('4) Cosa vedere a Palinuro?', async () => {
  const { server, baseUrl } = await startTestServer();
  const { body } = await postChat(baseUrl, 'Cosa vedere a Palinuro?');
  assert.equal(body.intent, 'attractions');
  server.close();
});

test('5) Parlami di Castellabate', async () => {
  const { server, baseUrl } = await startTestServer();
  const { body } = await postChat(baseUrl, 'Parlami di Castellabate');
  assert.equal(body.intent, 'general_territory');
  assert.equal(body.location.name, 'Castellabate');
  server.close();
});

test('6) Cerco un B&B vicino al mare a Santa Maria di Castellabate', async () => {
  const { server, baseUrl } = await startTestServer();
  const { body } = await postChat(baseUrl, 'Cerco un B&B vicino al mare a Santa Maria di Castellabate');
  assert.equal(body.intent, 'accommodation');
  assert.ok(body.location);
  server.close();
});

test('7) Dov\'e l\'Infopoint piu vicino?', async () => {
  const { server, baseUrl } = await startTestServer();
  const { body } = await postChat(baseUrl, "Dov'e l'Infopoint piu vicino?");
  assert.equal(body.intent, 'infopoints');
  server.close();
});

test('8) Vorrei un\'esperienza per bambini', async () => {
  const { server, baseUrl } = await startTestServer();
  const { body } = await postChat(baseUrl, "Vorrei un'esperienza per bambini");
  assert.equal(body.intent, 'experiences');
  server.close();
});

test('9) domanda senza localita', async () => {
  const { server, baseUrl } = await startTestServer();
  const { body } = await postChat(baseUrl, 'Cerco una struttura ricettiva');
  assert.equal(body.intent, 'accommodation');
  assert.equal(body.location, null);
  server.close();
});

test('10) localita non riconosciuta', async () => {
  const { server, baseUrl } = await startTestServer();
  const { body } = await postChat(baseUrl, 'Cerco ristoranti ad Atlantide');
  assert.equal(body.intent, 'food');
  assert.equal(body.location, null);
  server.close();
});

test('11) messaggio vuoto', async () => {
  const { server, baseUrl } = await startTestServer();
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: '   ', conversation: [] })
  });
  assert.equal(response.status, 400);
  server.close();
});

test('12) backend non disponibile (client)', async () => {
  await assert.rejects(
    () => apiClient.requestChat({ apiBaseUrl: 'http://127.0.0.1:9', requestTimeoutMs: 300 }, { message: 'test' }),
    /timeout|fetch|chat-http/i
  );
});

test('13) nessun risultato interno', async () => {
  const { server, baseUrl } = await startTestServer();
  const { body } = await postChat(baseUrl, 'Cerco ristoranti a Bellosguardo');
  assert.equal(body.intent, 'food');
  assert.equal(body.results.length, 0);
  assert.equal(body.fallback, true);
  server.close();
});

test('14) risposta con fonti', async () => {
  const { server, baseUrl } = await startTestServer();
  const { body } = await postChat(baseUrl, 'Mi servono numeri utili a Castellabate');
  assert.equal(body.intent, 'useful_contacts');
  assert.ok(body.sources.length > 0);
  assert.equal(body.sources[0].source_type, 'internal_verified');
  server.close();
});

test('15) risposta priva di fonti fattuali viene neutralizzata', () => {
  const output = validateAnswer({
    answer: 'Dato fattuale non supportato',
    intent: 'food',
    results: [{ id: 'x1', name: 'Ristorante X' }],
    sources: [],
    fallback: false
  });
  assert.equal(output.results.length, 0);
  assert.equal(output.fallback, true);
});
