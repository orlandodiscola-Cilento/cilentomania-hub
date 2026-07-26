const { mockProvider } = require('./providers/mock');
const { openAiProvider } = require('./providers/openai');

function createAiProvider(config, logger) {
  const selected = config.aiProvider || 'mock';

  async function generate(context) {
    if (!context.results?.length) return null;

    if (selected === 'openai') {
      try {
        const text = await openAiProvider({ ...context, config });
        if (text) return { text, provider: 'openai' };
      } catch (error) {
        logger.warn('Provider OpenAI non disponibile, fallback mock', { reason: error.message });
      }
    }

    const text = await mockProvider(context);
    return text ? { text, provider: 'mock' } : null;
  }

  return { generate };
}

module.exports = { createAiProvider };
