const { computeSchedule, computeScheduleForDepot } = require("../services/schedulerService");
const { Log } = require("../utils/logger");
async function getAllSchedules(req, res) {
  await Log("backend", "info", "handler", "GET /api/schedule - computing schedule for all depots");
  try {
    const schedules = await computeSchedule();
    await Log("backend", "info", "handler", `GET /api/schedule - returned ${schedules.length} depot schedules`);
    return res.status(200).json({
      success: true,
      totalDepots: schedules.length,
      schedules,
    });
  } catch (err) {
    await Log("backend", "error", "handler", `GET /api/schedule failed: ${err.message}`);
    return res.status(500).json({ success: false, error: err.message });
  }
}
async function getScheduleByDepot(req, res) {
  const depotID = parseInt(req.params.depotID, 10);
  if (isNaN(depotID) || depotID <= 0) {
    await Log("backend", "warn", "handler", `GET /api/schedule/:depotID - invalid depotID: "${req.params.depotID}"`);
    return res.status(400).json({ success: false, error: "depotID must be a positive integer" });
  }
  await Log("backend", "info", "handler", `GET /api/schedule/${depotID} - computing schedule for single depot`);
  try {
    const schedule = await computeScheduleForDepot(depotID);
    if (!schedule) {
      await Log("backend", "warn", "handler", `GET /api/schedule/${depotID} - depot not found`);
      return res.status(404).json({ success: false, error: `Depot with ID ${depotID} not found` });
    }
    await Log("backend", "info", "handler", `GET /api/schedule/${depotID} - responded with ${schedule.totalTasksSelected} tasks, impact=${schedule.totalImpact}`);
    return res.status(200).json({ success: true, schedule });
  } catch (err) {
    await Log("backend", "error", "handler", `GET /api/schedule/${depotID} failed: ${err.message}`);
    return res.status(500).json({ success: false, error: err.message });
  }
}
async function getDepots(req, res) {
  await Log("backend", "info", "handler", "GET /api/depots - fetching depot list");
  try {
    const { fetchDepots } = require("../services/dataService");
    const depots = await fetchDepots();
    return res.status(200).json({ success: true, totalDepots: depots.length, depots });
  } catch (err) {
    await Log("backend", "error", "handler", `GET /api/depots failed: ${err.message}`);
    return res.status(500).json({ success: false, error: err.message });
  }
}
async function getVehicles(req, res) {
  await Log("backend", "info", "handler", "GET /api/vehicles - fetching vehicle task list");
  try {
    const { fetchVehicles } = require("../services/dataService");
    const vehicles = await fetchVehicles();
    return res.status(200).json({ success: true, totalVehicles: vehicles.length, vehicles });
  } catch (err) {
    await Log("backend", "error", "handler", `GET /api/vehicles failed: ${err.message}`);
    return res.status(500).json({ success: false, error: err.message });
  }
}
module.exports = { getAllSchedules, getScheduleByDepot, getDepots, getVehicles };