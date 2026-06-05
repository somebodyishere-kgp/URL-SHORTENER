import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  PUBLIC_BASE_URL: z.string().url().default("http://localhost:4000"),
  DATABASE_URL: z.string().min(1),
  TIMESCALE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  CACHE_TTL_SECONDS: z.coerce.number().default(3600),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().default(60),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(120)
});

export const env = schema.parse(process.env);
