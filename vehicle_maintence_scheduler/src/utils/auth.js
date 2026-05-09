const BASE_URL = "http://4.224.186.213/evaluation-service";
let cachedToken = null;
let tokenExpiresAt = 0; 
async function fetchToken(credentials) {
  const response = await fetch(`${BASE_URL}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Auth failed (${response.status}): ${err}`);
  }
  const data = await response.json();
  return data;
}
async function getToken(credentials) {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (cachedToken && tokenExpiresAt - 30 > nowInSeconds) {
    return cachedToken;
  }
  const authData = await fetchToken(credentials);
  cachedToken = authData.access_token;
  tokenExpiresAt = authData.expires_in;
  return cachedToken;
}
module.exports = { getToken };