const { validateChatPayload } = require('../middleware/validate-request');
const { detectIntent } = require('../intent/detect-intent');
const { detectLocation } = require('../intent/detect-location');
const { detectFilters } = require('../intent/detect-filters');
const { searchInternal } = require('../retrieval/search-internal');
const { buildAnswer } = require('../response/build-answer');
const { validateAnswer } = require('../response/validate-answer');
const { dedupeSources } = require('../response/source-format');
const { sanitizeAction } = require('../utils/sanitize');

async function handleChat({ payload, repository, ai, config, logger }) {
  const validation = validateChatPayload(payload, config);
  if (!validation.ok) {
    return {
      status: validation.status,
      body: {
        answer: validation.error,
        intent: 'unknown',
        location: null,
        results: [],
        actions: [],
        sources: [],
        confidence: 0,
        fallback: true
      }
    };
  }

  const safe = validation.value;
  const dataset = await repository.load();
  const intentDetected = detectIntent(safe.message);
  const locationDetected = detectLocation(safe.message, dataset) || safe.location || null;
  const filtersDetected = detectFilters(safe.message);

  const retrieval = searchInternal({
    intent: intentDetected.intent,
    location: locationDetected,
    filters: filtersDetected,
    dataset
  });

  const aiOutput = await ai.generate({
    intent: intentDetected.intent,
    location: locationDetected,
    filters: filtersDetected,
    results: retrieval.results,
    language: safe.language,
    conversation: safe.conversation
  });

  const answerParts = buildAnswer({
    intent: intentDetected.intent,
    location: locationDetected,
    results: retrieval.results,
    dataset,
    usedAiText: aiOutput?.text || null
  });

  const response = validateAnswer({
    answer: answerParts.answer,
    intent: intentDetected.intent,
    location: locationDetected
      ? {
          name: locationDetected.name,
          type: locationDetected.type || 'comune'
        }
      : null,
    results: retrieval.results,
    actions: answerParts.actions.map(sanitizeAction),
    sources: dedupeSources(retrieval.sources),
    confidence: Math.min(0.99, (intentDetected.confidence + answerParts.confidence) / 2),
    fallback: answerParts.fallback || !aiOutput
  });

  logger.info('Richiesta chat elaborata', {
    intent: response.intent,
    hasLocation: Boolean(response.location),
    resultCount: response.results.length,
    sourceCount: response.sources.length,
    fallback: response.fallback
  });

  return { status: 200, body: response };
}

module.exports = { handleChat };
