(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CilentinoApiClient = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function withTimeout(promiseFactory, timeoutMs) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
      promiseFactory()
        .then(value => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  async function requestChat(config, payload) {
    const base = String(config?.apiBaseUrl || '').replace(/\/$/, '');
    if (!base) throw new Error('apiBaseUrl non configurato');

    const endpoint = `${base}/api/chat`;
    const timeoutMs = Number(config?.requestTimeoutMs) || 7000;

    const response = await withTimeout(() => fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }), timeoutMs);

    if (!response.ok) throw new Error(`chat-http-${response.status}`);
    return response.json();
  }

  return { requestChat };
});
