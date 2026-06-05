import { env } from "../config/env.js";
import { appDb } from "../lib/db.js";
import { cacheRedis } from "../lib/redis.js";
import { generateShortCode } from "./codeGenerator.js";

export type LinkRecord = {
  id: string;
  code: string;
  targetUrl: string;
  createdAt: string;
};

const cacheKey = (code: string) => `link:${code}`;

export async function createLink(targetUrl: string, userId?: string): Promise<LinkRecord> {
  const code = await generateShortCode();
  const result = await appDb.query(
    `INSERT INTO links (code, target_url, user_id)
     VALUES ($1, $2, $3)
     RETURNING id, code, target_url, created_at`,
    [code, targetUrl, userId ?? null]
  );

  const row = result.rows[0];
  await cacheRedis.set(
    cacheKey(code),
    JSON.stringify({ id: row.id, targetUrl: row.target_url }),
    "EX",
    env.CACHE_TTL_SECONDS
  );

  return {
    id: row.id,
    code: row.code,
    targetUrl: row.target_url,
    createdAt: row.created_at
  };
}

export async function resolveLink(code: string): Promise<{ id: string; targetUrl: string } | null> {
  const cached = await cacheRedis.get(cacheKey(code));
  if (cached) return JSON.parse(cached);

  const result = await appDb.query(
    `SELECT id, target_url
     FROM links
     WHERE code = $1
       AND deleted_at IS NULL
       AND (expires_at IS NULL OR expires_at > now())
     LIMIT 1`,
    [code]
  );

  if (result.rowCount === 0) return null;

  const row = result.rows[0];
  const value = { id: row.id, targetUrl: row.target_url };
  await cacheRedis.set(cacheKey(code), JSON.stringify(value), "EX", env.CACHE_TTL_SECONDS);

  return value;
}

export async function warmPopularLinks(limit = 1000): Promise<number> {
  const result = await appDb.query(
    `SELECT id, code, target_url
     FROM links
     WHERE deleted_at IS NULL
       AND (expires_at IS NULL OR expires_at > now())
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );

  const pipeline = cacheRedis.pipeline();
  for (const row of result.rows) {
    pipeline.set(
      cacheKey(row.code),
      JSON.stringify({ id: row.id, targetUrl: row.target_url }),
      "EX",
      env.CACHE_TTL_SECONDS
    );
  }
  await pipeline.exec();

  return result.rowCount ?? 0;
}
