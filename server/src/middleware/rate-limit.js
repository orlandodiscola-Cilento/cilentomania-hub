function createRateLimiter(config) {
  const buckets = new Map();

  return function checkRateLimit(ip) {
    const key = ip || 'unknown';
    const now = Date.now();
    const bucket = buckets.get(key) || { count: 0, resetAt: now + config.rateLimitWindowMs };

    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + config.rateLimitWindowMs;
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count > config.rateLimitMaxRequests) {
      return { allowed: false, retryAfterMs: bucket.resetAt - now };
    }
    return { allowed: true, retryAfterMs: 0 };
  };
}

module.exports = { createRateLimiter };
