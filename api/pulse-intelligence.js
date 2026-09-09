import { getSession, userClient, sendJson } from "../lib/supabaseServer.js";

const MAX_BODY = 32 * 1024;
const ALLOWED_ACTIONS = new Set(["overview", "analyze"]);

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function normalizeAction(value) {
  const action = String(value || "overview").trim().toLowerCase();
  return ALLOWED_ACTIONS.has(action) ? action : null;
}

function summarizeMachine(machine, telemetry, twin) {
  const caps = Array.isArray(machine.capabilities) ? machine.capabilities : [];
  const latest = telemetry?.[0] || null;
  const heartbeatAge = machine.last_heartbeat_at ? Math.max(0, Date.now() - new Date(machine.last_heartbeat_at).getTime()) : null;
  const heartbeatFresh = heartbeatAge !== null && heartbeatAge <= 5 * 60 * 1000;
  const state = String(machine.state || "OFFLINE").toUpperCase();
  const connection = ["ONLINE", "CONNECTING", "ACTIVE"].includes(state) ? "connected" : "not_connected";
  const evidence = [];
  if (machine.machine_identity) evidence.push("machine_identity");
  if (machine.manufacturer || machine.model || machine.firmware_version) evidence.push("manufacturer_model_firmware");
  if (caps.length) evidence.push("declared_capabilities");
  if (latest) evidence.push("telemetry");
  if (twin) evidence.push("digital_twin_snapshot");
  if (machine.last_heartbeat_at) evidence.push("heartbeat");

  let confidence = 0.35;
  confidence += machine.machine_identity ? 0.2 : 0;
  confidence += (machine.manufacturer || machine.model) ? 0.1 : 0;
  confidence += caps.length ? 0.1 : 0;
  confidence += latest ? 0.1 : 0;
  confidence += twin ? 0.05 : 0;
  confidence += heartbeatFresh ? 0.05 : 0;

  const findings = [];
  if (!machine.machine_identity) findings.push({ level: "critical", code: "MISSING_IDENTITY", message: "Machine identity is missing." });
  if (!machine.model) findings.push({ level: "warning", code: "MISSING_MODEL", message: "Model is not recorded." });
  if (!machine.firmware_version) findings.push({ level: "warning", code: "MISSING_FIRMWARE", message: "Firmware version is not recorded." });
  if (!caps.length) findings.push({ level: "warning", code: "NO_CAPABILITIES", message: "No capabilities have been declared." });
  if (!latest) findings.push({ level: "info", code: "NO_TELEMETRY", message: "No telemetry evidence is available yet." });
  if (!twin) findings.push({ level: "info", code: "NO_TWIN", message: "No digital-twin snapshot is available yet." });
  if (!heartbeatFresh) findings.push({ level: "info", code: "HEARTBEAT_NOT_FRESH", message: "A fresh heartbeat is not available." });

  return {
    id: machine.id,
    identity: machine.machine_identity,
    name: machine.name,
    type: machine.machine_type,
    manufacturer: machine.manufacturer,
    model: machine.model,
    firmwareVersion: machine.firmware_version,
    state,
    connection,
    capabilities: caps,
    latestTelemetry: latest ? {
      metric: latest.metric_name,
      value: latest.metric_value,
      unit: latest.unit,
      recordedAt: latest.recorded_at,
      source: latest.source,
    } : null,
    twinObservedAt: twin?.observed_at || null,
    confidence: Number(clamp(confidence, 0, 1).toFixed(2)),
    evidence,
    findings,
  };
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return sendJson(res, 204, null);
  if (!["GET", "POST"].includes(req.method)) return sendJson(res, 405, { error: "method_not_allowed" });

  const session = await getSession(req, res);
  if (!session?.user?.id) return sendJson(res, 401, { error: "authentication_required" });

  const client = userClient(session.token);
  const action = normalizeAction(req.method === "GET" ? "overview" : req.body?.action);
  if (!action) return sendJson(res, 400, { error: "unsupported_action" });

  let machineId = null;
  if (req.method === "GET") {
    const url = new URL(req.url, "http://localhost");
    machineId = url.searchParams.get("machineId");
  } else {
    if (!req.body && req.headers["content-length"] && Number(req.headers["content-length"]) > MAX_BODY) {
      return sendJson(res, 413, { error: "request_too_large" });
    }
    machineId = req.body?.machineId ? String(req.body.machineId) : null;
  }

  const select = "id,machine_identity,name,machine_type,state,owner_id,capabilities,trust_level,last_heartbeat_at,created_at,updated_at,organization_id,manufacturer,model,firmware_version,adapter_id";
  let query = client.from("machine_connect_machines").select(select).order("updated_at", { ascending: false }).limit(100);
  if (machineId) query = query.eq("id", machineId).limit(1);
  const { data: machines, error: machineError } = await query;
  if (machineError) return sendJson(res, 500, { error: "machine_read_failed" });
  if (machineId && !machines?.length) return sendJson(res, 404, { error: "machine_not_found" });

  const rows = [];
  for (const machine of machines || []) {
    const [telemetryResult, twinResult] = await Promise.all([
      client.from("machine_connect_telemetry").select("metric_name,metric_value,unit,recorded_at,source,observed_at,data").eq("machine_id", machine.id).order("recorded_at", { ascending: false }).limit(20),
      client.from("machine_connect_twin_snapshots").select("observed_at,state,twin_type").eq("machine_id", machine.id).order("observed_at", { ascending: false }).limit(1),
    ]);
    if (telemetryResult.error || twinResult.error) return sendJson(res, 500, { error: "machine_context_read_failed" });
    rows.push(summarizeMachine(machine, telemetryResult.data || [], twinResult.data?.[0] || null));
  }

  const summary = {
    machineCount: rows.length,
    connectedCount: rows.filter((m) => m.connection === "connected").length,
    withTelemetry: rows.filter((m) => !!m.latestTelemetry).length,
    withTwin: rows.filter((m) => !!m.twinObservedAt).length,
    generatedAt: new Date().toISOString(),
  };

  if (action === "overview") {
    return sendJson(res, 200, {
      ok: true,
      service: "pulse-intelligence",
      version: "1.0",
      mode: "evidence_only",
      summary,
      machines: rows,
    });
  }

  const target = rows[0];
  if (!target) return sendJson(res, 409, { error: "no_machine_context", message: "No authorized machine context is available for analysis." });
  const critical = target.findings.filter((f) => f.level === "critical").length;
  const warnings = target.findings.filter((f) => f.level === "warning").length;
  const riskScore = clamp(critical * 45 + warnings * 15, 0, 100);
  const decision = riskScore >= 70 ? "REVIEW_REQUIRED" : riskScore >= 35 ? "CAUTION" : "NO_BLOCKING_FINDING";

  return sendJson(res, 200, {
    ok: true,
    service: "pulse-intelligence",
    version: "1.0",
    mode: "evidence_only",
    analysis: {
      machineId: target.id,
      identity: target.identity,
      confidence: target.confidence,
      riskScore,
      decision,
      findings: target.findings,
      evidence: target.evidence,
      recommendation: decision === "REVIEW_REQUIRED"
        ? "Do not execute control actions. Complete machine identity and evidence review first."
        : decision === "CAUTION"
          ? "Improve missing machine evidence before relying on automated reasoning."
          : "Machine context is internally consistent enough for read-only intelligence; control remains governed by authorization and safety layers.",
    },
  });
}
