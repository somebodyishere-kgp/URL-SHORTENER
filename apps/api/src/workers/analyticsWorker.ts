import crypto from "node:crypto";
import { Worker } from "bullmq";
import { analyticsDb } from "../lib/db.js";
import { bullConnection } from "../lib/redis.js";
import type { ClickEventJob } from "../queue/analyticsQueue.js";

function ensureHashedIp(ip?: string): string | undefined {
  if (!ip) return undefined;
  if (/^[a-f0-9]{64}$/i.test(ip)) return ip;
  return crypto.createHash("sha256").update(ip).digest("hex");
}

const worker = new Worker<ClickEventJob, void, "record-click">(
  "click-analytics",
  async (job) => {
    const event = job.data;

    await analyticsDb.query(
      `INSERT INTO click_events (time, link_id, code, ip_hash, user_agent, referer, country)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        event.clickedAt,
        event.linkId,
        event.code,
        ensureHashedIp(event.ip),
        event.userAgent ?? null,
        event.referer ?? null,
        event.country ?? null
      ]
    );
  },
  {
    connection: bullConnection,
    concurrency: 50
  }
);

worker.on("ready", () => {
  console.log("Analytics worker ready");
});

worker.on("failed", (job, error) => {
  console.error(`Analytics job ${job?.id ?? "unknown"} failed`, error);
});

process.on("SIGTERM", async () => {
  await worker.close();
  await analyticsDb.end();
  process.exit(0);
});
