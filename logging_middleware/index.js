"use strict";
const BASE_URL = "http://4.224.186.213/evaluation-service";
const VALID_STACKS = new Set(["backend", "frontend"]);
const VALID_LEVELS = new Set(["debug", "info", "warn", "error", "fatal"]);
const VALID_PACKAGES = new Set([
  "cache",
  "controller",
  "cron_job",
  "db",
  "domain",
  "handler",
  "repository",
  "route",
  "service",
  "api",
  "component",
  "hook",
  "page",
  "state",
  "style",
  "auth",
  "config",
  "middleware",
  "utils",
]);
let _cachedToken = null;
let _tokenExpiresAt = 0; 
async function _fetchToken(creds) {
  const response = await fetch(`${BASE_URL}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(creds),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`[logging_middleware] Auth failed (${response.status}): ${errText}`);
  }
  return response.json();
}
async function _getToken(creds) {
  const nowSec = Math.floor(Date.now() / 1000);
  if (_cachedToken && _tokenExpiresAt - 30 > nowSec) {
    return _cachedToken;
  }
  const authData = await _fetchToken(creds);
  _cachedToken = authData.access_token;
  _tokenExpiresAt = authData.expires_in; 
  return _cachedToken;
}
function _credsFromEnv() {
  return {
    email: process.env.LOG_EMAIL,
    name: process.env.LOG_NAME,
    rollNo: process.env.LOG_ROLL_NO,
    accessCode: process.env.LOG_ACCESS_CODE,
    clientID: process.env.LOG_CLIENT_ID,
    clientSecret: process.env.LOG_CLIENT_SECRET,
  };
}
async function Log(stack, level, pkg, message) {
  if (!VALID_STACKS.has(stack)) {
    console.error(
      `[logging_middleware] Invalid stack: "${stack}". Accepted values: ${[...VALID_STACKS].join(", ")}`
    );
    return null;
  }
  if (!VALID_LEVELS.has(level)) {
    console.error(
      `[logging_middleware] Invalid level: "${level}". Accepted values: ${[...VALID_LEVELS].join(", ")}`
    );
    return null;
  }
  if (!VALID_PACKAGES.has(pkg)) {
    console.error(
      `[logging_middleware] Invalid package: "${pkg}". Accepted values: ${[...VALID_PACKAGES].join(", ")}`
    );
    return null;
  }
  if (!message || typeof message !== "string" || message.trim() === "") {
    console.error("[logging_middleware] message must be a non-empty string.");
    return null;
  }
  const safeMessage = message.slice(0, 48);
  try {
    const creds = _credsFromEnv();
    const token = await _getToken(creds);
    const response = await fetch(`${BASE_URL}/logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        stack,
        level,
        package: pkg,
        message: safeMessage,
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error(
        `[logging_middleware] Log API returned ${response.status}: ${errText}`
      );
      return null;
    }
    const result = await response.json();
    return result; 
  } catch (err) {
    console.error(`[logging_middleware] Failed to ship log entry: ${err.message}`);
    return null;
  }
}
module.exports = { Log };