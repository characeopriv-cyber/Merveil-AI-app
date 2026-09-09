import { getAccessToken } from "../lib/supabaseServer.js";

const MACHINE_CONNECT_FUNCTION = "https://dixfybqlepticyudikuz.supabase.co/functions/v1/machine-connect-api";

export default async function handler(req, res) {
  const token = getAccessToken(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const rawPath = String(req.query?.path || "").replace(/^\/+/, "");
  const target = rawPath ? `${MACHINE_CONNECT_FUNCTION}/${rawPath}` : MACHINE_CONNECT_FUNCTION;

  try {
    const response = await fetch(target, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: req.method === "GET" || req.method === "HEAD" ? undefined : JSON.stringify(req.body || {}),
    });

    const text = await response.text();
    let payload;
    try { payload = text ? JSON.parse(text) : null; } catch { payload = { error: text || "Empty response" }; }

    res.status(response.status).json(payload);
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : "Machine Connect upstream unavailable" });
  }
}
