interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

export function rateLimit(
  key: string,
  maxRequests = 5,
  windowMs = 15 * 60 * 1000,
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const record = store.get(key);

  if (!record || record.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, retryAfterMs: record.resetAt - now };
  }

  record.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}
