import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { cacheRedis } from "../lib/redis.js";

function clientKey(req: Request): string {
  const forwardedFor = req.header("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || req.ip || req.socket.remoteAddress || "unknown";
}

export async function slidingWindowRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const now = Date.now();
  const windowMs = env.RATE_LIMIT_WINDOW_SECONDS * 1000;
  const key = `rate:${clientKey(req)}`;
  const member = `${now}:${Math.random()}`;

  try {
    const pipeline = cacheRedis.pipeline();
    pipeline.zremrangebyscore(key, 0, now - windowMs);
    pipeline.zadd(key, now, member);
    pipeline.zcard(key);
    pipeline.expire(key, env.RATE_LIMIT_WINDOW_SECONDS);

    const results = await pipeline.exec();
    const count = Number(results?.[2]?.[1] ?? 0);

    if (count > env.RATE_LIMIT_MAX_REQUESTS) {
      res.status(429).json({ error: "Rate limit exceeded" });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}
