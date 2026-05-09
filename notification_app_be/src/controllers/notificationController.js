"use strict";
const { fetchNotifications } = require("../services/notificationService");
const { getTopN }            = require("../priorityInbox");
const { Log }                = require("../utils/logger");

const getAllNotifications = async (req, res) => {
  await Log("backend", "info", "handler", "getting notifications");
  try {
    const notifications = await fetchNotifications();
    await Log("backend", "info", "handler", `found ${notifications.length} notifications`);
    
    return res.status(200).json({
      success: true,
      total: notifications.length,
      notifications,
    });
  } catch (err) {
    await Log("backend", "error", "handler", `getAllNotifications failed: ${err.message}`.slice(0, 48));
    return res.status(500).json({ success: false, error: err.message });
  }
};

const getPriorityInbox = async (req, res) => {
  const rawN = parseInt(req.query.n || "10", 10);
  const n = isNaN(rawN) || rawN <= 0 ? 10 : rawN;
  
  await Log("backend", "info", "handler", `getting top ${n} priority notifications`);
  try {
    const top = await getTopN(n);
    await Log("backend", "info", "handler", `returned top ${top.length}`);
    
    return res.status(200).json({
      success: true,
      n,
      priorityInbox: top,
    });
  } catch (err) {
    await Log("backend", "error", "handler", `getPriorityInbox failed: ${err.message}`.slice(0, 48));
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getAllNotifications, getPriorityInbox };