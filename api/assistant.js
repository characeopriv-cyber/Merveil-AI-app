// /api/assistant — Merveil AI proxy (OpenAI-compatible; NOT Anthropic)
//
// Prefer the route in router.js when the app is served through the unified API.
// This file is kept for Vercel-style /api/assistant.js deploys.
//
// Env (server only):
//   AI_API_URL or XAI_API_URL  — e.g. https://api.x.ai/v1
//   AI_API_KEY or XAI_API_KEY  — Bearer token
//   AI_MODEL or XAI_MODEL      — optional model id
//
import { getSession, userClient } from "../lib/supabaseServer.js";

const AI_DAILY_LIMITS = { ordinary: 10, services: 25, investor: 100000 };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { system, messages, maxTokens } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "`messages` must be a non-empty array" });
    return;
  }

  const { token, user } = await getSession(req, res);
  if (!user || !token) {
    res.status(401).json({ error: "Sign in required." });
    return;
  }
  const sb = userClient(token);

  const { data: profile } = await sb.from("profiles").select("passport_tier").eq("id", user.id).maybeSingle();
  const tier = profile?.passport_tier || "ordinary";
  const limit = AI_DAILY_LIMITS[tier] ?? AI_DAILY_LIMITS.ordinary;
  const today = new Date().toISOString().slice(0, 10);
  const { data: usageRow } = await sb.from("ai_usage").select("message_count").eq("user_id", user.id).eq("usage_date", today).maybeSingle();
  const used = usageRow?.message_count || 0;
  if (used >= limit) {
    res.status(429).json({
      error: `Daily Merveil AI limit reached (${used}/${limit}) for your Passport tier. Try again tomorrow or upgrade your Passport.`,
    });
    return;
  }

  const apiUrl = (process.env.AI_API_URL || process.env.XAI_API_URL || "").replace(/\/$/, "");
  const apiKey = process.env.AI_API_KEY || process.env.XAI_API_KEY || "";
  const model = process.env.AI_MODEL || process.env.XAI_MODEL || "grok-2-latest";

  if (!apiUrl || !apiKey) {
    res.status(500).json({
      error: "Merveil AI is not configured. Set AI_API_URL and AI_API_KEY on the server, then redeploy.",
    });
    return;
  }

  const systemText =
    typeof system === "string" && system.trim()
      ? system.slice(0, 12000)
      : "You are Merveil AI, a helpful assistant inside the Merveil UAE super-app.";

  const safeMessages = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-20)
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, 8000) }));

  const endpoint = apiUrl.includes("/chat/completions") ? apiUrl : `${apiUrl}/chat/completions`;

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: systemText }, ...safeMessages],
        max_tokens: Math.min(Number(maxTokens) || 600, 2048),
        temperature: 0.7,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      res.status(upstream.status >= 500 ? 502 : upstream.status).json({
        error: `Merveil AI error (${upstream.status}): ${errText.slice(0, 200)}`,
      });
      return;
    }

    const data = await upstream.json();
    let reply =
      data?.choices?.[0]?.message?.content ||
      data?.reply ||
      data?.content ||
      data?.message ||
      "";
    if (typeof reply !== "string") reply = JSON.stringify(reply);

    await sb.rpc("increment_ai_usage", { uid: user.id }).catch(() => {});
    res.status(200).json({ reply: String(reply).trim() || "I didn't catch that — try asking again." });
  } catch (err) {
    res.status(500).json({ error: `Assistant request failed: ${err.message}` });
  }
}
