import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { warmPopularLinks } from "./services/links.js";

const app = createApp();

app.listen(env.PORT, async () => {
  console.log(`API listening on ${env.PUBLIC_BASE_URL}`);

  if (env.RUN_WORKER_IN_API) {
    await import("./workers/analyticsWorker.js");
    console.log("Analytics worker started inside API process");
  }

  try {
    const warmed = await warmPopularLinks();
    console.log(`Warmed ${warmed} links into Redis cache`);
  } catch (error) {
    console.warn("Cache warmup skipped", error);
  }
});
