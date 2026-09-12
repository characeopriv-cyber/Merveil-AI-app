import { getSession, sendJson } from "../lib/supabaseServer.js";
import { diagnose, propose, repairPlan, verify } from "../server/debug-v1.js";

async function access(req, res) {
  try {
    const s = await getSession(req, res);
    const id = s?.user?.id || s?.jwtSub;
    if (!id) { sendJson(res, 401, { error: "Sign in required", code: "AUTH_REQUIRED" }); return null; }
    return id;
  } catch {
    sendJson(res, 401, { error: "Sign in required", code: "AUTH_REQUIRED" });
    return null;
  }
}

export default async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) return sendJson(res, 405, { error: "Method not allowed" });
  const userId = await access(req, res);
  if (!userId) return;
  if (req.method === "GET") return sendJson(res, 200, {
    ok: true,
    service: "Merveil Debug V1",
    pipeline: ["ingest", "map", "diagnose", "propose", "repair", "verify"],
    capabilities: ["project-scan", "static-diagnosis", "proposal-generation", "repair-plan", "verification", "safe-no-mutation"]
  });

  try {
    const body = req.body || {};
    const action = String(body.action || "diagnose").toLowerCase();
    if (action === "diagnose") {
      const result = diagnose(body.files || []);
      return sendJson(res, 200, { ok: true, userId, pipeline: "diagnose", ...result, generatedAt: new Date().toISOString() });
    }
    if (action === "propose") {
      const diagnosis = body.diagnosis || diagnose(body.files || []);
      return sendJson(res, 200, { ok: true, userId, ...propose(diagnosis), diagnosis });
    }
    if (action === "repair") {
      const diagnosis = body.diagnosis || diagnose(body.files || []);
      const selectedIds = Array.isArray(body.proposalIds) ? body.proposalIds : null;
      return sendJson(res, 200, { ok: true, userId, ...repairPlan(diagnosis, selectedIds), diagnosis });
    }
    if (action === "verify") {
      const before = body.before || {};
      const after = body.after || diagnose(body.files || []);
      return sendJson(res, 200, { ok: true, userId, ...verify(before, after), after });
    }
    return sendJson(res, 400, { error: "Unknown Debug action", code: "DEBUG_ACTION_INVALID", allowed: ["diagnose", "propose", "repair", "verify"] });
  } catch (e) {
    return sendJson(res, 400, { error: e?.message || "Debug operation failed", code: "DEBUG_OPERATION_FAILED" });
  }
}
