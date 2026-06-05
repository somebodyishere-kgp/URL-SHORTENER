import pg from "pg";
import { env } from "../config/env.js";

function isLocalDatabaseHost(connectionString: string): boolean {
  const host = new URL(connectionString).hostname;
  return ["localhost", "127.0.0.1", "::1", "postgres", "timescaledb"].includes(host);
}

function createPool(
  connectionString: string,
  max: number,
  rejectUnauthorized: boolean,
  ca?: string
): pg.Pool {
  const normalizedCa = ca?.replace(/\\n/g, "\n");

  return new pg.Pool({
    connectionString,
    max,
    ssl: isLocalDatabaseHost(connectionString)
      ? undefined
      : {
          ca: normalizedCa,
          rejectUnauthorized
        }
  });
}

export const appDb = createPool(
  env.DATABASE_URL,
  20,
  env.DATABASE_SSL_REJECT_UNAUTHORIZED,
  env.DATABASE_CA_CERT
);

export const analyticsDb = createPool(
  env.TIMESCALE_URL,
  10,
  env.TIMESCALE_SSL_REJECT_UNAUTHORIZED,
  env.TIMESCALE_CA_CERT
);
