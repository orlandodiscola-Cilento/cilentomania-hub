function sendJson(response, statusCode, payload, corsOrigin) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  response.end(body);
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let raw = '';
    request.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        reject(new Error('Payload troppo grande'));
        request.destroy();
      }
    });
    request.on('end', () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error('JSON non valido'));
      }
    });
    request.on('error', reject);
  });
}

module.exports = { sendJson, readJson };
