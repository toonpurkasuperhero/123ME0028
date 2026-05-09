const { getToken } = require("./auth");
const BASE_URL = "http://4.224.186.213/evaluation-service";
const VALID_STACKS = new Set(["backend", "frontend"]);
const VALID_LEVELS = new Set(["debug", "info", "warn", "error", "fatal"]);
const VALID_PACKAGES = new Set([
  "cache", "controller", "cron_job", "db", "domain",
  "handler", "repository", "route", "service",
  "api", "component", "hook", "page", "state", "style",
  "auth", "config", "middleware", "utils",
]);
async function Log(stack, level, pkg, message) {
  if (!VALID_STACKS.has(stack)) {
    console.error(`[Logger] Invalid stack: "${stack}". Must be one of: ${[...VALID_STACKS].join(", ")}`);
    return null;
  }
  if (!VALID_LEVELS.has(level)) {
    console.error(`[Logger] Invalid level: "${level}". Must be one of: ${[...VALID_LEVELS].join(", ")}`);
    return null;
  }
  if (!VALID_PACKAGES.has(pkg)) {
    console.error(`[Logger] Invalid package: "${pkg}". Must be one of: ${[...VALID_PACKAGES].join(", ")}`);
    return null;
  }
  if (!message || typeof message !== "string" || message.trim() === "") {
    console.error("[Logger] Message must be a non-empty string.");
    return null;
  }
  const safeMessage = message.slice(0, 48);
  const credentials = getCredentialsFromEnv();
  try {
    const token = await getToken(credentials);
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
      console.error(`[Logger] Log API responded with ${response.status}: ${errText}`);
      return null;
    }
    const result = await response.json();
    return result; 
  } catch (err) {
    console.error(`[Logger] Failed to ship log: ${err.message}`);
    return null;
  }
}
function getCredentialsFromEnv() {
  return {
    email: process.env.LOG_EMAIL,
    name: process.env.LOG_NAME,
    rollNo: process.env.LOG_ROLL_NO,
    accessCode: process.env.LOG_ACCESS_CODE,
    clientID: process.env.LOG_CLIENT_ID,
    clientSecret: process.env.LOG_CLIENT_SECRET,
  };
}
module.exports = { Log };