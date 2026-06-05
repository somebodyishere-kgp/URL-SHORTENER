import { Router } from "express";
import { z } from "zod";
import { analyticsDb } from "../lib/db.js";

const router = Router();

const summaryQuerySchema = z.object({
  code: z.string().min(1),
  range: z.enum(["24h", "7d", "30d"]).default("7d")
});

const rangeToInterval = {
  "24h": "24 hours",
  "7d": "7 days",
  "30d": "30 days"
} as const;

router.get("/summary", async (req, res, next) => {
  try {
    const query = summaryQuerySchema.parse(req.query);
    const interval = rangeToInterval[query.range];

    const totals = await analyticsDb.query(
      `SELECT count(*)::int AS clicks, count(DISTINCT ip_hash)::int AS unique_visitors
       FROM click_events
       WHERE code = $1
         AND time >= now() - $2::interval`,
      [query.code, interval]
    );

    const series = await analyticsDb.query(
      `SELECT time_bucket('1 hour', time) AS bucket, count(*)::int AS clicks
       FROM click_events
       WHERE code = $1
         AND time >= now() - $2::interval
       GROUP BY bucket
       ORDER BY bucket ASC`,
      [query.code, interval]
    );

    res.json({
      code: query.code,
      range: query.range,
      clicks: totals.rows[0]?.clicks ?? 0,
      uniqueVisitors: totals.rows[0]?.unique_visitors ?? 0,
      series: series.rows.map((row) => ({
        bucket: row.bucket,
        clicks: row.clicks
      }))
    });
  } catch (error) {
    next(error);
  }
});

export { router as analyticsRouter };
