"use strict";
const { config } = require("../config/env");
const BASE_URL = config.evaluationServiceBase;
let _cachedToken = null;
let _tokenExpiresAt = 0;
async function fetchToken(creds) {
  const res = await fetch(`${BASE_URL}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(creds),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Auth failed (${res.status}): ${err}`);
  }
  return res.json();
}
async function getToken(creds) {
  const nowSec = Math.floor(Date.now() / 1000);
  if (_cachedToken && _tokenExpiresAt - 30 > nowSec) return _cachedToken;
  const data = await fetchToken(creds);
  _cachedToken = data.access_token;
  _tokenExpiresAt = data.expires_in;
  return _cachedToken;
}
module.exports = { getToken };