const express = require("express");
const router = express.Router();
const {
  getAllSchedules,
  getScheduleByDepot,
  getDepots,
  getVehicles,
} = require("../controllers/schedulerController");
router.get("/schedule", getAllSchedules);
router.get("/schedule/:depotID", getScheduleByDepot);
router.get("/depots", getDepots);
router.get("/vehicles", getVehicles);
module.exports = router;