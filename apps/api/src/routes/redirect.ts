import crypto from "node:crypto";
import { Router } from "express";
import { enqueueClickEvent } from "../queue/analyticsQueue.js";
import { resolveLink } from "../services/links.js";
import { slidingWindowRateLimiter } from "../services/rateLimiter.js";

const router = Router();

function ipHash(ip?: string): string | undefined {
  if (!ip) return undefined;
  return crypto.createHash("sha256").update(ip).digest("hex");
}

router.get("/:code", slidingWindowRateLimiter, async (req, res, next) => {
  try {
    const code = String(req.params.code);
    const link = await resolveLink(code);
    if (!link) {
      res.status(404).json({ error: "Short URL not found" });
      return;
    }

    void enqueueClickEvent({
      linkId: link.id,
      code,
      ip: ipHash(req.ip),
      userAgent: req.header("user-agent"),
      referer: req.header("referer"),
      clickedAt: new Date().toISOString()
    }).catch((error) => {
      console.error("Failed to enqueue analytics event", error);
    });

    res.redirect(301, link.targetUrl);
  } catch (error) {
    next(error);
  }
});

export { router as redirectRouter };
