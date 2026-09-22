// In-memory sliding-window rate limit (D6: 5/min/IP).
// Per serverless INSTANCE: a speed bump, not a guarantee. Two instances each
// allow five. Never describe it as more than that.

export interface RateLimitDecision {
  allowed: boolean;
  retryAfterSeconds: number;
}

export interface RateLimiter {
  check(key: string): RateLimitDecision;
}

export function createRateLimiter({
  limit,
  windowMs,
  now = () => Date.now(),
}: {
  limit: number;
  windowMs: number;
  now?: () => number;
}): RateLimiter {
  let hits = new Map<string, readonly number[]>();

  return {
    check(key: string): RateLimitDecision {
      const t = now();
      const recent = (hits.get(key) ?? []).filter((stamp) => t - stamp < windowMs);

      // Drop idle keys so the map cannot grow without bound.
      if (hits.size > 5000) {
        hits = new Map(
          Array.from(hits).filter(([, stamps]) => stamps.some((s) => t - s < windowMs)),
        );
      }

      if (recent.length >= limit) {
        hits.set(key, recent);
        const oldest = recent[0];
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (t - oldest)) / 1000)),
        };
      }
      hits.set(key, [...recent, t]);
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}

/** Client IP as Vercel reports it; "unknown" shares one bucket. */
export function clientIp(headers: Headers): string {
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
