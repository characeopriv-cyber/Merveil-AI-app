// api/engine.js — Merveil Engine routes (Studio backend)
// Handles: /api/engine/generate, /api/engine/evolve, /api/engine/deploy,
//          /api/engine/integrations, /api/studio?action=access
// Runs separately from router.js so it can have a 60s timeout for Claude.

import { createClient } from "@supabase/supabase-js";
import { getSession, sendJson } from "../lib/supabaseServer.js";

export const config = {
  api: { bodyParser: false },
  maxDuration: 60,
};

const SUPABASE_URL = "https://dixfybqlepticyudikuz.supabase.co";
const CITIZEN_ORIGIN = "https://www.junction.technology";

function adminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
  if (!key) throw new Error("Server misconfiguration: missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { return {}; }
}

function passportCompletionPct(profile) {
  return profile ? [
    20,
    profile.avatar_url ? 15 : 0,
    profile.bio && profile.bio.length > 10 ? 15 : 0,
    profile.city ? 10 : 0,
    profile.profession ? 10 : 0,
    (profile.skills || []).length ? 10 : 0,
    (profile.languages || []).length ? 10 : 0,
    (profile.portfolio_url || profile.website_url) ? 10 : 0,
  ].reduce((a, b) => a + b, 0) : 20;
}

const MIN_COMPLETION = 20;

async function requireAccess(req, res) {
  let sessionResult = { user: null, jwtSub: null };
  try { sessionResult = await getSession(req, res); } catch {}
  const citizenId = sessionResult?.user?.id || sessionResult?.jwtSub || null;

  if (!citizenId) {
    // Never redirect to "/" from developer.junction.technology: that host's
    // root is itself rewritten to Studio, which creates a bounce/flash loop.
    sendJson(res, 401, {
      error: "Sign in required",
      code: "AUTH_REQUIRED",
      redirect: `${CITIZEN_ORIGIN}/?next=/developer`,
    });
    return null;
  }

  let svc;
  try { svc = adminClient(); }
  catch (e) { sendJson(res, 500, { error: e.message }); return null; }

  const { data: profile } = await svc.from("profiles").select("*").eq("id", citizenId).maybeSingle();
  const pct = passportCompletionPct(profile);

  if (pct < MIN_COMPLETION) {
    sendJson(res, 403, {
      error: "Complete your Merveil Passport to build in Developer.",
      code: "PASSPORT_INCOMPLETE",
      completionPct: pct,
      required: MIN_COMPLETION,
      redirect: `${CITIZEN_ORIGIN}/?goto=passport&next=/developer`,
    });
    return null;
  }

  return { citizenId, profile, completionPct: pct };
}

async function streamClaude(res, { system, prompt, image }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return sendJson(res, 500, { error: "ANTHROPIC_API_KEY not configured on the server." });

  const content = [];
  if (image?.data && image?.mediaType) {
    content.push({ type: "image", source: { type: "base64", media_type: image.mediaType, data: image.data } });
  }
  content.push({ type: "text", text: prompt });

  let upstream;
  try {
    upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
        stream: true,
        system,
        messages: [{ role: "user", content }],
      }),
    });
  } catch (e) {
    return sendJson(res, 502, { error: `Could not reach the build model: ${e.message}` });
  }

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => "");
    return sendJson(res, upstream.status || 502, {
      error: `Build model unavailable (${upstream.status}). ${errText.slice(0, 300)}`,
    });
  }

  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "X-Accel-Buffering": "no",
  });

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === "content_block_delta" && evt.delta?.text) res.write(evt.delta.text);
        } catch {}
      }
    }
  } catch {}
  return res.end();
}

const GEN_SYSTEM = [
  "You are the Merveil Engine. Emit ONLY files, no prose, in this exact format:",
  "<MF:BEGIN>",
  "path: <relative/path>",
  "<MF:BYTES>",
  "<file content>",
  "<MF:END>",
  "Emit a complete, runnable Vite + React (TypeScript) project.",
  "Required files: package.json, vite.config.ts, index.html, src/main.tsx, src/App.tsx, src/styles.css.",
  "package.json must have scripts.dev = \"vite --host 0.0.0.0\".",
  "Style using CSS custom properties --primary and --accent on :root in src/styles.css.",
  "Emit files in dependency order: package.json, index.html, src/main.tsx, src/App.tsx, styles, components.",
].join("\n");

const EVOLVE_SYSTEM = [
  "You are the Merveil Engine in EVOLVE mode. Emit ONLY files that change.",
  "<MF:BEGIN>",
  "path: <relative/path>",
  "<MF:BYTES>",
  "<MF:END>",
  "Do NOT re-emit unchanged files. Do NOT add prose.",
].join("\n");

export default async function handler(req, res) {
  const rawUrl = req.url || "";
  const [pathPart, queryPart] = rawUrl.split("?");
  const query = Object.fromEntries(new URLSearchParams(queryPart || ""));

  if (pathPart.endsWith("/api/engine/integrations") && req.method === "GET") {
    return sendJson(res, 200, {
      integrations: [
        { name: "Supabase", connected: !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE) },
        { name: "Anthropic", connected: !!process.env.ANTHROPIC_API_KEY },
        { name: "Stripe", connected: !!process.env.STRIPE_SECRET_KEY },
        { name: "GitHub", connected: !!process.env.GITHUB_TOKEN },
        { name: "OpenAI", connected: !!process.env.OPENAI_API_KEY },
        { name: "Resend", connected: !!process.env.RESEND_API_KEY },
        { name: "Twilio", connected: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) },
        { name: "Vercel Deploy", connected: !!process.env.VERCEL_TOKEN },
      ],
    });
  }

  if (pathPart.endsWith("/api/studio") && req.method === "GET") {
    const gate = await requireAccess(req, res);
    if (!gate) return;
    return sendJson(res, 200, { ok: true, completionPct: gate.completionPct, citizenId: gate.citizenId });
  }

  if (pathPart.endsWith("/api/engine/generate") && req.method === "POST") {
    const gate = await requireAccess(req, res);
    if (!gate) return;
    const body = await readJson(req);
    const prompt = String(body.prompt || "").slice(0, 6000);
    if (!prompt) return sendJson(res, 400, { error: "Prompt required." });
    return streamClaude(res, { system: GEN_SYSTEM, prompt, image: body.image });
  }

  if (pathPart.endsWith("/api/engine/evolve") && req.method === "POST") {
    const gate = await requireAccess(req, res);
    if (!gate) return;
    const body = await readJson(req);
    const instruction = String(body.instruction || "").slice(0, 4000);
    const files = Array.isArray(body.files) ? body.files : [];
    if (!instruction) return sendJson(res, 400, { error: "instruction required." });
    if (!files.length) return sendJson(res, 400, { error: "files required." });
    const fileContext = files.slice(0, 20).map((f) => `=== ${f.path} ===\n${String(f.content || "").slice(0, 4000)}`).join("\n\n");
    const prompt = `EVOLVE existing app.\n\nInstruction: ${instruction}\n\nCURRENT FILES:\n${fileContext}\n\nEmit only the files that change.`;
    return streamClaude(res, { system: EVOLVE_SYSTEM, prompt });
  }

  if (pathPart.endsWith("/api/engine/deploy") && req.method === "POST") {
    const gate = await requireAccess(req, res);
    if (!gate) return;

    const token = process.env.VERCEL_TOKEN;
    if (!token) {
      return sendJson(res, 400, {
        error: "Vercel deployment is not configured. Add VERCEL_TOKEN in the Vercel project's Environment Variables.",
        code: "DEPLOY_NOT_CONFIGURED",
      });
    }

    const body = await readJson(req);
    const files = Array.isArray(body.files) ? body.files : [];
    if (!files.length) return sendJson(res, 400, { error: "No files to deploy." });

    const projectId = process.env.VERCEL_PROJECT_ID || "";
    const teamQuery = process.env.VERCEL_TEAM_ID ? `?teamId=${encodeURIComponent(process.env.VERCEL_TEAM_ID)}` : "";
    const target = body.target === "production" ? "production" : "preview";
    const name = String(body.projectName || "merveil-app").toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 52) || "merveil-app";

    try {
      const dep = await fetch(`https://api.vercel.com/v13/deployments${teamQuery}`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name,
          ...(projectId ? { project: projectId } : {}),
          files: files.map((f) => ({ file: f.path, data: f.content })),
          target,
        }),
      });
      const data = await dep.json();
      if (!dep.ok) return sendJson(res, dep.status, { error: data?.error?.message || "Vercel deploy failed." });
      return sendJson(res, 200, {
        ok: true,
        url: data.url ? `https://${data.url}` : null,
        deploymentId: data.id || null,
        target,
      });
    } catch (e) {
      return sendJson(res, 500, { error: e.message || "Deploy failed." });
    }
  }

  return sendJson(res, 404, { error: "Unknown engine route", path: pathPart });
}
