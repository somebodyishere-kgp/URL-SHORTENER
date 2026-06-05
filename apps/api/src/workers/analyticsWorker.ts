import { Worker } from "bullmq";
import { analyticsDb } from "../lib/db.js";
import { bullConnection } from "../lib/redis.js";
import type { ClickEventJob } from "../queue/analyticsQueue.js";
import { insertClickEvent } from "../services/analyticsRecorder.js";

const worker = new Worker<ClickEventJob, void, "record-click">(
  "click-analytics",
  async (job) => {
    await insertClickEvent(job.data);
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
