const { loadAllData } = require('./loaders');
const { normalizeDataset } = require('./normalizers');

class InternalRepository {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.cache = null;
    this.cacheAt = 0;
  }

  async load(force = false) {
    const now = Date.now();
    if (!force && this.cache && (now - this.cacheAt) < 60000) return this.cache;
    const raw = await loadAllData(this.config.dataRoot);
    this.cache = normalizeDataset(raw);
    this.cacheAt = now;
    this.logger.info('Dataset interno caricato', {
      municipalities: this.cache.municipalities.length,
      accommodations: this.cache.accommodations.length,
      restaurants: this.cache.restaurants.length,
      infopoints: this.cache.infopoints.length
    });
    return this.cache;
  }
}

module.exports = { InternalRepository };
