function dedupeSources(sources) {
  const seen = new Set();
  const out = [];
  (Array.isArray(sources) ? sources : []).forEach(source => {
    const key = `${source.record_type}:${source.record_id}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(source);
  });
  return out;
}

module.exports = { dedupeSources };
