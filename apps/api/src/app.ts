import cors, { type CorsOptions } from "cors";
import express, { type ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { env } from "./config/env.js";
import { analyticsRouter } from "./routes/analytics.js";
import { linksRouter } from "./routes/links.js";
import { redirectRouter } from "./routes/redirect.js";

const allowedOrigins = env.FRONTEND_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    callback(null, allowedOrigins.includes(origin));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  optionsSuccessStatus: 204
};

export function createApp() {
  const app = express();

  app.use(cors(corsOptions));
  app.options(/.*/, cors(corsOptions));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "api",
      analyticsDriver: env.ANALYTICS_DRIVER,
      workerInApi: env.RUN_WORKER_IN_API,
      redirectStatusCode: env.REDIRECT_STATUS_CODE,
      frontendOrigins: allowedOrigins,
      timestamp: new Date().toISOString()
    });
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
