"use strict";
const { fetchNotifications } = require("../services/notificationService");
const { getTopN }            = require("../priorityInbox");
const { Log }                = require("../utils/logger");
async function getAllNotifications(req, res) {
  await Log("backend", "info", "handler", "GET /api/notifications");
  try {
    const notifications = await fetchNotifications();
    await Log(
      "backend",
      "info",
      "handler",
      `Returned ${notifications.length} notifications`
    );
    return res.status(200).json({
      success: true,
      total: notifications.length,
      notifications,
    });
  } catch (err) {
    await Log("backend", "error", "handler", `getAllNotifications: ${err.message}`.slice(0, 48));
    return res.status(500).json({ success: false, error: err.message });
  }
}
async function getPriorityInbox(req, res) {
  const rawN = parseInt(req.query.n || "10", 10);
  const n = isNaN(rawN) || rawN <= 0 ? 10 : rawN;
  await Log("backend", "info", "handler", `GET /api/notifications/priority n=${n}`);
  try {
    const top = await getTopN(n);
    await Log(
      "backend",
      "info",
      "handler",
      `Priority inbox: returned top ${top.length}`
    );
    return res.status(200).json({
      success: true,
      n,
      priorityInbox: top,
    });
  } catch (err) {
    await Log("backend", "error", "handler", `getPriorityInbox: ${err.message}`.slice(0, 48));
    return res.status(500).json({ success: false, error: err.message });
  }
}
module.exports = { getAllNotifications, getPriorityInbox };