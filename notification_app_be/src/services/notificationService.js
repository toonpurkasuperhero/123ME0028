"use strict";
const { getToken } = require("../utils/auth");
const { Log }      = require("../utils/logger");
const { config }   = require("../config/env");
const BASE_URL = config.evaluationServiceBase;
async function fetchNotifications() {
  await Log("backend", "info", "service", "Fetching notifications from API");
  try {
    const token = await getToken(config.auth);
    const res = await fetch(`${BASE_URL}/notifications`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const errText = await res.text();
      await Log("backend", "error", "service", `Notifications API ${res.status}`);
      throw new Error(`Notifications API returned ${res.status}: ${errText}`);
    }
    const data = await res.json();
    const notifications = data.notifications;
    if (!Array.isArray(notifications)) {
      await Log("backend", "error", "service", "Unexpected notifications shape");
      throw new Error('"notifications" field missing or not an array');
    }
    await Log(
      "backend",
      "info",
      "service",
      `Fetched ${notifications.length} notifications`
    );
    return notifications;
  } catch (err) {
    await Log("backend", "fatal", "service", `fetchNotifications: ${err.message}`.slice(0, 48));
    throw err;
  }
}
module.exports = { fetchNotifications };