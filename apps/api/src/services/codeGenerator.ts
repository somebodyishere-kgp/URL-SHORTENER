import { redis } from "../lib/redis.js";
import { toBase62 } from "../utils/base62.js";

const SEQUENCE_KEY = "short-code-sequence";

export async function generateShortCode(): Promise<string> {
  const nextId = await redis.incr(SEQUENCE_KEY);
  return toBase62(nextId);
}
