const { fetchDepots, fetchVehicles } = require("./dataService");
const { solveKnapsack } = require("../utils/knapsack");
const { Log } = require("../utils/logger");
async function computeSchedule() {
  await Log("backend", "info", "service", "Starting vehicle maintenance schedule computation");
  const [depots, vehicles] = await Promise.all([fetchDepots(), fetchVehicles()]);
  await Log(
    "backend",
    "debug",
    "service",
    `Loaded ${depots.length} depots and ${vehicles.length} vehicle tasks. Running knapsack per depot.`
  );
  const results = depots.map((depot) => {
    const solution = solveKnapsack(vehicles, depot.MechanicHours);
    return {
      depotID: depot.ID,
      mechanicHoursBudget: depot.MechanicHours,
      hoursUsed: solution.hoursUsed,
      hoursRemaining: solution.hoursRemaining,
      totalImpact: solution.totalImpact,
      totalTasksSelected: solution.selectedTasks.length,
      selectedTasks: solution.selectedTasks,
    };
  });
  const totalImpactAcrossDepots = results.reduce((sum, r) => sum + r.totalImpact, 0);
  await Log(
    "backend",
    "info",
    "service",
    `Schedule computed for ${results.length} depots. Total combined impact: ${totalImpactAcrossDepots}`
  );
  return results;
}
async function computeScheduleForDepot(depotID) {
  await Log("backend", "info", "service", `Computing schedule for depot ID: ${depotID}`);
  const [depots, vehicles] = await Promise.all([fetchDepots(), fetchVehicles()]);
  const depot = depots.find((d) => d.ID === depotID);
  if (!depot) {
    await Log("backend", "warn", "service", `Depot with ID ${depotID} not found`);
    return null;
  }
  const solution = solveKnapsack(vehicles, depot.MechanicHours);
  await Log(
    "backend",
    "info",
    "service",
    `Depot ${depotID}: selected ${solution.selectedTasks.length} tasks, totalImpact=${solution.totalImpact}, hoursUsed=${solution.hoursUsed}/${depot.MechanicHours}`
  );
  return {
    depotID: depot.ID,
    mechanicHoursBudget: depot.MechanicHours,
    hoursUsed: solution.hoursUsed,
    hoursRemaining: solution.hoursRemaining,
    totalImpact: solution.totalImpact,
    totalTasksSelected: solution.selectedTasks.length,
    selectedTasks: solution.selectedTasks,
  };
}
module.exports = { computeSchedule, computeScheduleForDepot };