import { createMiddleware } from "hono/factory";
import { ApiError } from "../lib/errors.js";

/**
 * Fixed-window in-memory limiter. Good enough for a single instance;
 * swap the Map for Redis when running more than one replica.
 */
export function rateLimit({ windowMs, max, key }) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
  }, windowMs).unref();

  return createMiddleware(async (c, next) => {
    const k = await key(c);
    const now = Date.now();
    const entry = hits.get(k);
    if (!entry || entry.reset <= now) hits.set(k, { count: 1, reset: now + windowMs });
    else if (++entry.count > max) {
      c.header("Retry-After", String(Math.ceil((entry.reset - now) / 1000)));
      throw new ApiError(429, "Too many attempts. Please wait a few minutes and try again.", "rate_limited");
    }
    await next();
  });
}

export function clientIp(c) {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
    c.req.header("x-real-ip") ||
    c.env?.incoming?.socket?.remoteAddress ||
    "unknown"
  );
}
