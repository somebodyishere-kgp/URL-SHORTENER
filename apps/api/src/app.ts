import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { analyticsRouter } from "./routes/analytics.js";
import { linksRouter } from "./routes/links.js";
import { redirectRouter } from "./routes/redirect.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/links", linksRouter);
  app.use("/api/analytics", analyticsRouter);
  app.use("/", redirectRouter);

  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof ZodError) {
      res.status(400).json({ error: "Invalid request", details: error.flatten() });
      return;
    }

    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  };

  app.use(errorHandler);

  return app;
}
