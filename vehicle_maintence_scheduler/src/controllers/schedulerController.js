const { computeSchedule, computeScheduleForDepot } = require("../services/schedulerService");
const { Log } = require("../utils/logger");

const getAllSchedules = async (req, res) => {
  await Log("backend", "info", "handler", "getting all depot schedules");
  try {
    const schedules = await computeSchedule();
    await Log("backend", "info", "handler", `got ${schedules.length} schedules`);
    
    return res.status(200).json({
      success: true,
      totalDepots: schedules.length,
      schedules,
    });
  } catch (err) {
    await Log("backend", "error", "handler", `getAllSchedules failed: ${err.message}`);
    return res.status(500).json({ success: false, error: err.message });
  }
};

const getScheduleByDepot = async (req, res) => {
  const id = parseInt(req.params.depotID, 10);
  
  if (isNaN(id) || id <= 0) {
    await Log("backend", "warn", "handler", `invalid depotID: ${req.params.depotID}`);
    return res.status(400).json({ success: false, error: "invalid depot id" });
  }
  
  await Log("backend", "info", "handler", `getting schedule for depot ${id}`);
  try {
    const schedule = await computeScheduleForDepot(id);
    if (!schedule) {
      await Log("backend", "warn", "handler", `depot ${id} not found`);
      return res.status(404).json({ success: false, error: `depot ${id} not found` });
    }
    
    await Log("backend", "info", "handler", `depot ${id}: selected ${schedule.totalTasksSelected} tasks, impact=${schedule.totalImpact}`);
    return res.status(200).json({ success: true, schedule });
  } catch (err) {
    await Log("backend", "error", "handler", `getScheduleByDepot error: ${err.message}`);
    return res.status(500).json({ success: false, error: err.message });
  }
};

const getDepots = async (req, res) => {
  await Log("backend", "info", "handler", "fetching depots list");
  try {
    const { fetchDepots } = require("../services/dataService");
    const depots = await fetchDepots();
    return res.status(200).json({ success: true, count: depots.length, depots });
  } catch (err) {
    await Log("backend", "error", "handler", `getDepots failed: ${err.message}`);
    return res.status(500).json({ success: false, error: err.message });
  }
};

const getVehicles = async (req, res) => {
  await Log("backend", "info", "handler", "fetching vehicles list");
  try {
    const { fetchVehicles } = require("../services/dataService");
    const vehicles = await fetchVehicles();
    return res.status(200).json({ success: true, count: vehicles.length, vehicles });
  } catch (err) {
    await Log("backend", "error", "handler", `getVehicles failed: ${err.message}`);
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getAllSchedules, getScheduleByDepot, getDepots, getVehicles };