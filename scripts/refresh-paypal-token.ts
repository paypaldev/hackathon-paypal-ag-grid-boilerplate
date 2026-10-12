// PayPal returns the same access token for a client until it expires (~9h), so
// permissions enabled on the app afterwards stay invisible. Revoking the current
// token forces the next request to mint one with the app's current scopes.
// Usage: npm run paypal:refresh-token

import { Buffer } from "node:buffer";

const BASE_URL = "https://api-m.sandbox.paypal.com";
const clientId = process.env.PAYPAL_CLIENT_ID;
const secret = process.env.PAYPAL_SECRET;
if (!clientId || !secret) throw new Error("PAYPAL_CLIENT_ID and PAYPAL_SECRET must be set");

const headers = {
  Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
  "Content-Type": "application/x-www-form-urlencoded",
};

async function oauth(path: string, body: string): Promise<{ access_token?: string; scope?: string }> {
  const res = await fetch(`${BASE_URL}${path}`, { method: "POST", headers, body });
  if (!res.ok) throw new Error(`${path} failed: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

const current = await oauth("/v1/oauth2/token", "grant_type=client_credentials");
await oauth(
  "/v1/oauth2/token/terminate",
  `token=${encodeURIComponent(current.access_token ?? "")}&token_type_hint=ACCESS_TOKEN`,
);
const fresh = await oauth("/v1/oauth2/token", "grant_type=client_credentials");

console.log("Revoked the cached token; new token scopes:");
for (const scope of fresh.scope?.split(" ").sort() ?? []) console.log(`  ${scope}`);
