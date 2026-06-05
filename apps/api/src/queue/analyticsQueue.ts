import { Queue } from "bullmq";
import { bullConnection } from "../lib/redis.js";

export type ClickEventJob = {
  linkId: string;
  code: string;
  ip?: string;
  userAgent?: string;
  referer?: string;
  country?: string;
  clickedAt: string;
};

export const analyticsQueue = new Queue<ClickEventJob, void, "record-click">("click-analytics", {
  connection: bullConnection
});

export function enqueueClickEvent(event: ClickEventJob) {
  return analyticsQueue.add("record-click", event, {
    removeOnComplete: 10_000,
    removeOnFail: 50_000,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000
    }
  });
}
