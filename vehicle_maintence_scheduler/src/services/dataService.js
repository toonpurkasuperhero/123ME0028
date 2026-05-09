"use strict";
const { getToken } = require("../utils/auth");
const { Log } = require("../utils/logger");
const { config } = require("../config/env");
const BASE_URL = config.evaluationServiceBase;
function getCredentials() {
  return config.auth;
}
async function authenticatedGet(path, logLabel) {
  const credentials = getCredentials();
  const token = await getToken(credentials);
  await Log(
    "backend",
    "debug",
    "service",
    `${logLabel}: sending GET ${BASE_URL}${path}`
  );
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errText = await response.text();
    await Log(
      "backend",
      "error",
      "service",
      `${logLabel}: received ${response.status} from ${path} — ${errText}`
    );
    throw new Error(
      `Evaluation service returned ${response.status} for ${path}: ${errText}`
    );
  }
  const data = await response.json();
  return data;
}
async function fetchDepots() {
  await Log("backend", "info", "service", "Fetching depot list from evaluation service");
  try {
    const data = await authenticatedGet("/depots", "fetchDepots");
    const depots = data.depots;
    if (!Array.isArray(depots)) {
      await Log(
        "backend",
        "error",
        "service",
        `fetchDepots: unexpected response shape — "depots" field is missing or not an array`
      );
      throw new Error('Unexpected response: "depots" field is not an array');
    }
    await Log(
      "backend",
      "info",
      "service",
      `fetchDepots: successfully retrieved ${depots.length} depots`
    );
    return depots;
  } catch (err) {
    await Log(
      "backend",
      "fatal",
      "service",
      `fetchDepots: failed to retrieve depots — ${err.message}`
    );
    throw err;
  }
}
async function fetchVehicles() {
  await Log("backend", "info", "service", "Fetching vehicle task list from evaluation service");
  try {
    const data = await authenticatedGet("/vehicles", "fetchVehicles");
    const vehicles = data.vehicles;
    if (!Array.isArray(vehicles)) {
      await Log(
        "backend",
        "error",
        "service",
        `fetchVehicles: unexpected response shape — "vehicles" field is missing or not an array`
      );
      throw new Error('Unexpected response: "vehicles" field is not an array');
    }
    await Log(
      "backend",
      "info",
      "service",
      `fetchVehicles: successfully retrieved ${vehicles.length} vehicle tasks`
    );
    return vehicles;
  } catch (err) {
    await Log(
      "backend",
      "fatal",
      "service",
      `fetchVehicles: failed to retrieve vehicles — ${err.message}`
    );
    throw err;
  }
}
module.exports = { fetchDepots, fetchVehicles };