"use strict";
const { getToken } = require("./auth");
const { config } = require("../config/env");
const BASE_URL = config.evaluationServiceBase;
const VALID_STACKS   = new Set(["backend", "frontend"]);
const VALID_LEVELS   = new Set(["debug", "info", "warn", "error", "fatal"]);
const VALID_PACKAGES = new Set([
  "cache", "controller", "cron_job", "db", "domain",
  "handler", "repository", "route", "service",
  "api", "component", "hook", "page", "state", "style",
  "auth", "config", "middleware", "utils",
]);
async function Log(stack, level, pkg, message) {
  if (!VALID_STACKS.has(stack))   { console.error(`[Logger] bad stack: ${stack}`);   return null; }
  if (!VALID_LEVELS.has(level))   { console.error(`[Logger] bad level: ${level}`);   return null; }
  if (!VALID_PACKAGES.has(pkg))   { console.error(`[Logger] bad package: ${pkg}`);   return null; }
  if (!message || typeof message !== "string" || !message.trim()) {
    console.error("[Logger] message must be a non-empty string");
    return null;
  }
  const safeMessage = message.slice(0, 48);
  try {
    const token = await getToken(config.auth);
    const res = await fetch(`${BASE_URL}/logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ stack, level, package: pkg, message: safeMessage }),
    });
    if (!res.ok) {
      console.error(`[Logger] API ${res.status}: ${await res.text()}`);
      return null;
    }
    return res.json();
  } catch (err) {
    console.error(`[Logger] Failed: ${err.message}`);
    return null;
  }
}
module.exports = { Log };