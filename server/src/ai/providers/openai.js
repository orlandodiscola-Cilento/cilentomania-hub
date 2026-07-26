async function openAiProvider({ config, intent, location, filters, results }) {
  if (!config.openaiApiKey) return null;

  const endpoint = 'https://api.openai.com/v1/chat/completions';
  const prompt = [
    'Sei Cilentino. Usa solo i dati forniti. Non inventare informazioni.',
    `Intento: ${intent}`,
    `Localita: ${location?.name || 'non specificata'}`,
    `Filtri: ${JSON.stringify(filters)}`,
    'Dati interni disponibili:',
    JSON.stringify(results.slice(0, 5), null, 2),
    'Rispondi in italiano in massimo 120 parole.'
  ].join('\n');

  const body = {
    model: config.openaiModel,
    temperature: 0.1,
    messages: [
      { role: 'system', content: 'Rispondi soltanto con informazioni presenti nel contesto fornito.' },
      { role: 'user', content: prompt }
    ]
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.openaiApiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${details.slice(0, 200)}`);
  }

  const json = await response.json();
  return json?.choices?.[0]?.message?.content?.trim() || null;
}

module.exports = { openAiProvider };
