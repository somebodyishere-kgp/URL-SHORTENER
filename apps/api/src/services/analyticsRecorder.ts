import crypto from "node:crypto";
import { env } from "../config/env.js";
import { analyticsDb } from "../lib/db.js";
import type { ClickEventJob } from "../queue/analyticsQueue.js";

function ensureHashedIp(ip?: string): string | undefined {
  if (!ip) return undefined;
  if (/^[a-f0-9]{64}$/i.test(ip)) return ip;
  return crypto.createHash("sha256").update(ip).digest("hex");
}

export async function insertClickEvent(event: ClickEventJob): Promise<void> {
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
}

export async function recordClickEvent(event: ClickEventJob): Promise<void> {
  if (env.ANALYTICS_DRIVER === "direct") {
    await insertClickEvent(event);
    return;
  }

  const { enqueueClickEvent } = await import("../queue/analyticsQueue.js");
  await enqueueClickEvent(event);
}
