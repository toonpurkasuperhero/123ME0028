"use strict";
const express = require("express");
const router  = express.Router();
const {
  getAllNotifications,
  getPriorityInbox,
} = require("../controllers/notificationController");
router.get("/priority", getPriorityInbox);
router.get("/", getAllNotifications);
module.exports = router;