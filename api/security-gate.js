import { getSession, sendJson } from "../lib/supabaseServer.js";
import { inspectText, inspectUploadMeta, connectionSafety, encryptionState, progressiveAction } from "../lib/merveilSecurityGate.js";

const MAX_BODY = 64 * 1024;
function body(req) {
  if (req.body && typeof req.body === "object") return req.body;
  return {};
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed" });
  }
  const session = await getSession(req, res);
  if (!session.authenticated || !session.user?.id) return sendJson(res, 401, { error: "Authentication required" });
  const input = body(req);
  if (JSON.stringify(input).length > MAX_BODY) return sendJson(res, 413, { error: "Request too large" });

  const kind = String(input.kind || "").toLowerCase();
  if (kind === "text") return sendJson(res, 200, inspectText(input.text));
  if (kind === "upload") return sendJson(res, 200, inspectUploadMeta(input));
  if (kind === "connection") return sendJson(res, 200, connectionSafety(input));
  if (kind === "encryption") return sendJson(res, 200, encryptionState(input));
  if (kind === "enforcement") return sendJson(res, 200, { action: progressiveAction(Number(input.strikes || 0), Boolean(input.severe)) });
  return sendJson(res, 400, { error: "Unknown safety check" });
}
