import "server-only";

// Lightweight in-memory sliding-window rate limiter.
// Fine for a demo / single instance; pair with an OpenAI spend cap for hard protection.

const HITS = new Map<string, number[]>();

export interface RateLimitResult {
  ok: boolean;
  retryAfterMs: number;
  remaining: number;
}

export function rateLimit(opts: {
  key: string;
  max: number;
  windowMs: number;
}): RateLimitResult {
  const now = Date.now();
  const recent = (HITS.get(opts.key) ?? []).filter((t) => now - t < opts.windowMs);

  if (recent.length >= opts.max) {
    const retryAfterMs = recent[0] + opts.windowMs - now;
    return { ok: false, retryAfterMs: Math.max(1000, retryAfterMs), remaining: 0 };
  }

  recent.push(now);
  HITS.set(opts.key, recent);
  return { ok: true, retryAfterMs: 0, remaining: opts.max - recent.length };
}

export function ipFromRequest(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "anon";
}
