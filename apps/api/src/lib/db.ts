import pg from "pg";
import { env } from "../config/env.js";

export const appDb = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 20
});

export const analyticsDb = new pg.Pool({
  connectionString: env.TIMESCALE_URL,
  max: 10
});
