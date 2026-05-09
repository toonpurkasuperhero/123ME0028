"use strict";
require("dotenv").config();
const { validateEnv, config } = require("./src/config/env");
const { Log } = require("./src/utils/logger");
try {
  validateEnv();
} catch (err) {
  console.error(`[Startup] ${err.message}`);
  process.exit(1);
}
const app = require("./src/app");
const server = app.listen(config.port, async () => {
  await Log("backend", "info", "config", `Server started on port ${config.port}`);
  console.log(`[Server] Notification App BE running on http://localhost:${config.port}`);
  console.log(`[Server] Endpoints:`);
  console.log(`  GET /health`);
  console.log(`  GET /api/notifications`);
  console.log(`  GET /api/notifications/priority?n=10`);
});
process.on("SIGTERM", async () => {
  await Log("backend", "warn", "config", "SIGTERM — shutting down");
  server.close(() => process.exit(0));
});
process.on("SIGINT", async () => {
  await Log("backend", "warn", "config", "SIGINT — shutting down");
  server.close(() => process.exit(0));
});