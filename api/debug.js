import { createClient } from "@supabase/supabase-js";
import { getSession, sendJson } from "../lib/supabaseServer.js";
import { diagnose, propose, repairPlan, verify } from "../server/debug-v1.js";

const SUPABASE_URL = "https://dixfybqlepticyudikuz.supabase.co";
const admin = () => createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || "", { auth: { autoRefreshToken: false, persistSession: false } });

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
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const action = String(body.action || "diagnose").toLowerCase();
    let files = Array.isArray(body.files) ? body.files : null;
    let project = null;
    if (!files && body.projectId) {
      const db = admin();
      const { data, error } = await db.from("developer_projects").select("id,name,owner_user_id").eq("id", String(body.projectId)).eq("owner_user_id", userId).maybeSingle();
      if (error) return sendJson(res, 500, { error: error.message, code: "PROJECT_LOOKUP_FAILED" });
      if (!data) return sendJson(res, 404, { error: "Project not found", code: "PROJECT_NOT_FOUND" });
      project = data;
      const { data: rows, error: fileError } = await db.from("developer_project_files").select("path,content").eq("project_id", data.id).eq("owner_user_id", userId).order("path");
      if (fileError) return sendJson(res, 500, { error: fileError.message, code: "PROJECT_FILES_LOOKUP_FAILED" });
      files = rows || [];
    }
    files = files || [];

    if (action === "diagnose") {
      const result = diagnose(files);
      return sendJson(res, 200, { ok: true, userId, project, pipeline: "diagnose", ...result, generatedAt: new Date().toISOString() });
    }
    if (action === "propose") {
      const diagnosis = body.diagnosis || diagnose(files);
      return sendJson(res, 200, { ok: true, userId, project, ...propose(diagnosis), diagnosis });
    }
    if (action === "repair") {
      const diagnosis = body.diagnosis || diagnose(files);
      const selectedIds = Array.isArray(body.proposalIds) ? body.proposalIds : null;
      return sendJson(res, 200, { ok: true, userId, project, ...repairPlan(diagnosis, selectedIds), diagnosis });
    }
    if (action === "verify") {
      const before = body.before || {};
      const after = body.after || diagnose(files);
      return sendJson(res, 200, { ok: true, userId, project, ...verify(before, after), after });
    }
    return sendJson(res, 400, { error: "Unknown Debug action", code: "DEBUG_ACTION_INVALID", allowed: ["diagnose", "propose", "repair", "verify"] });
  } catch (e) {
    return sendJson(res, 400, { error: e?.message || "Debug operation failed", code: "DEBUG_OPERATION_FAILED" });
  }
}
