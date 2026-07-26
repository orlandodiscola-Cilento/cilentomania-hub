function rankResults(items, filters) {
  const scored = items.map(item => {
    let score = 0;
    if (filters.family && item.familyFriendly) score += 2;
    if (filters.nearSea && Number.isFinite(item.seaDistanceMeters)) score += 2;
    if (Number.isFinite(item.seaDistanceMeters)) score += Math.max(0, 1 - (item.seaDistanceMeters / 5000));
    if ((item.status || '').toLowerCase().includes('bozza')) score -= 0.5;
    return { item, score };
  });

  return scored.sort((a, b) => b.score - a.score).map(entry => entry.item);
}

module.exports = { rankResults };
