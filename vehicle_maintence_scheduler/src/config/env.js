"use strict";
const REQUIRED_VARS = [
  "PORT",
  "LOG_EMAIL",
  "LOG_NAME",
  "LOG_ROLL_NO",
  "LOG_ACCESS_CODE",
  "LOG_CLIENT_ID",
  "LOG_CLIENT_SECRET",
];
function validateEnv() {
  const missing = REQUIRED_VARS.filter(
    (key) => !process.env[key] || process.env[key].trim() === ""
  );
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        `Please check your .env file.`
    );
  }
}
const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  evaluationServiceBase: "http://4.224.186.213/evaluation-service",
  auth: {
    email: process.env.LOG_EMAIL,
    name: process.env.LOG_NAME,
    rollNo: process.env.LOG_ROLL_NO,
    accessCode: process.env.LOG_ACCESS_CODE,
    clientID: process.env.LOG_CLIENT_ID,
    clientSecret: process.env.LOG_CLIENT_SECRET,
  },
};
module.exports = { validateEnv, config };