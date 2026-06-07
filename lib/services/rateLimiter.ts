interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const ipBuckets = new Map<string, TokenBucket>();

// Default rate-limiting parameters
// 10 requests burst limit, refilling 1 token every 2 seconds
const DEFAULT_LIMIT = 10;
const DEFAULT_REFILL_RATE = 0.5; // tokens per second (1 every 2s)

/**
 * Check if a request from a key (e.g. IP or User ID) is allowed under the rate limit.
 * Uses the Token Bucket algorithm.
 * 
 * @param key Unique key to identify request origin (e.g., client IP)
 * @param limit Max capacity of the bucket
 * @param refillRate Refill rate of tokens per second
 * @returns boolean true if allowed, false if rate-limited
 */
export function rateLimit(
  key: string,
  limit: number = DEFAULT_LIMIT,
  refillRate: number = DEFAULT_REFILL_RATE
): boolean {
  const now = Date.now();
  let bucket = ipBuckets.get(key);

  if (!bucket) {
    bucket = { tokens: limit, lastRefill: now };
  } else {
    const elapsedSeconds = (now - bucket.lastRefill) / 1000;
    // Calculate new token amount (capped at limit)
    bucket.tokens = Math.min(limit, bucket.tokens + elapsedSeconds * refillRate);
    bucket.lastRefill = now;
  }

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    ipBuckets.set(key, bucket);
    return true; // Allowed
  }

  ipBuckets.set(key, bucket);
  return false; // Rate-limited
}
