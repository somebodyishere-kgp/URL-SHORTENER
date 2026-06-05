import pg from "pg";
import { env } from "../config/env.js";

function isLocalDatabaseHost(connectionString: string): boolean {
  const host = new URL(connectionString).hostname;
  return ["localhost", "127.0.0.1", "::1", "postgres", "timescaledb"].includes(host);
}

function normalizeConnectionString(connectionString: string): string {
  const url = new URL(connectionString);

  // node-postgres lets sslmode query params override the explicit ssl object.
  // Keep TLS behavior controlled by env vars instead.
  for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert"]) {
    url.searchParams.delete(key);
  }

  return url.toString();
}

function createPool(
  connectionString: string,
  max: number,
  rejectUnauthorized: boolean,
  ca?: string
): pg.Pool {
  const normalizedCa = ca?.replace(/\\n/g, "\n");
  const isLocal = isLocalDatabaseHost(connectionString);

  return new pg.Pool({
    connectionString: normalizeConnectionString(connectionString),
    max,
    ssl: isLocal
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
