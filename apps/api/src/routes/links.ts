import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { createLink } from "../services/links.js";

const router = Router();

const createLinkSchema = z.object({
  targetUrl: z.string().url(),
  userId: z.string().uuid().optional()
});

router.post("/", async (req, res, next) => {
  try {
    const input = createLinkSchema.parse(req.body);
    const link = await createLink(input.targetUrl, input.userId);

    res.status(201).json({
      ...link,
      shortUrl: `${env.PUBLIC_BASE_URL}/${link.code}`
    });
  } catch (error) {
    next(error);
  }
});

export { router as linksRouter };
