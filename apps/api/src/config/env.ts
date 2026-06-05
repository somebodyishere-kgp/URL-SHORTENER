import "dotenv/config";
import { z } from "zod";

const booleanFromEnv = z
  .union([z.boolean(), z.string()])
  .transform((value) => {
    if (typeof value === "boolean") return value;
    return value.trim().toLowerCase() === "true";
  });

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  PUBLIC_BASE_URL: z.string().url().default("http://localhost:4000"),
  FRONTEND_ORIGINS: z.string().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1),
  TIMESCALE_URL: z.string().min(1),
  DATABASE_SSL_REJECT_UNAUTHORIZED: booleanFromEnv.default(false),
  TIMESCALE_SSL_REJECT_UNAUTHORIZED: booleanFromEnv.default(false),
  DATABASE_CA_CERT: z.string().optional(),
  TIMESCALE_CA_CERT: z.string().optional(),
  REDIS_URL: z.string().min(1),
  ANALYTICS_DRIVER: z.enum(["queue", "direct"]).default("queue"),
  RUN_WORKER_IN_API: booleanFromEnv.default(false),
  REDIRECT_STATUS_CODE: z.coerce.number().pipe(z.union([z.literal(301), z.literal(302)])).default(302),
  CACHE_TTL_SECONDS: z.coerce.number().default(3600),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().default(60),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(120)
});

export const env = schema.parse(process.env);
