const express = require("express");
const { Log } = require("./utils/logger");
const schedulerRoutes = require("./routes/schedulerRoutes");
const app = express();
app.use(express.json());
app.use(async (req, res, next) => {
  const start = Date.now();
  await Log("backend", "info", "middleware", `${req.method} ${req.path}`);
  res.on("finish", async () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    await Log("backend", level, "middleware", `${req.method} ${req.path} ${res.statusCode}`);
  });
  next();
});
app.use("/api", schedulerRoutes);
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "vehicle-maintenance-scheduler" });
});
app.use(async (req, res) => {
  await Log("backend", "warn", "handler", `404: ${req.method} ${req.path}`);
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
});
app.use(async (err, req, res, next) => {
  await Log("backend", "fatal", "handler", `Unhandled: ${err.message}`.slice(0,48));
  res.status(500).json({ success: false, error: "Internal server error" });
});
module.exports = app;