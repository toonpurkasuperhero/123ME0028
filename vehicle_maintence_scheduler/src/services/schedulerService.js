const { fetchDepots, fetchVehicles } = require("./dataService");
const { optimize } = require("../utils/knapsack");
const { Log } = require("../utils/logger");

const computeSchedule = async () => {
  await Log("backend", "info", "service", "building schedules...");
  const [depots, vehicles] = await Promise.all([fetchDepots(), fetchVehicles()]);
  
  await Log("backend", "debug", "service", `got ${depots.length} depots, ${vehicles.length} tasks`);

  const results = depots.map((d) => {
    const res = optimize(vehicles, d.MechanicHours);
    return {
      depotID: d.ID,
      mechanicHoursBudget: d.MechanicHours,
      hoursUsed: res.used,
      hoursRemaining: res.remaining,
      totalImpact: res.impact,
      totalTasksSelected: res.selected.length,
      selectedTasks: res.selected,
    };
  });

  const total = results.reduce((sum, r) => sum + r.totalImpact, 0);
  await Log("backend", "info", "service", `done building schedules. total impact: ${total}`);
  
  return results;
};

const computeScheduleForDepot = async (depotID) => {
  await Log("backend", "info", "service", `building schedule for depot ${depotID}`);
  const [depots, vehicles] = await Promise.all([fetchDepots(), fetchVehicles()]);
  const depot = depots.find((d) => d.ID === depotID);
  
  if (!depot) {
    await Log("backend", "warn", "service", `depot ${depotID} not found`);
    return null;
  }

  const res = optimize(vehicles, depot.MechanicHours);
  await Log("backend", "info", "service", `depot ${depotID} done: ${res.selected.length} tasks, impact=${res.impact}`);
  
  return {
    depotID: depot.ID,
    mechanicHoursBudget: depot.MechanicHours,
    hoursUsed: res.used,
    hoursRemaining: res.remaining,
    totalImpact: res.impact,
    totalTasksSelected: res.selected.length,
    selectedTasks: res.selected,
  };
};

module.exports = { computeSchedule, computeScheduleForDepot };