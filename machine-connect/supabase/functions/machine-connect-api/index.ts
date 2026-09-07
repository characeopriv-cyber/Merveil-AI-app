import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" };
const url = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

const allowedJobTypes = new Set(["IDENTIFY", "INSPECT", "DIAGNOSE", "REPAIR_PLAN", "REBUILD_PLAN", "SIMULATE", "TRANSCRIBE", "MULTIMODAL"]);
const allowedEvidenceTypes = new Set(["IMAGE", "VIDEO", "AUDIO", "TELEMETRY", "DOCUMENT", "LOG", "TEXT", "LIVE_CAMERA", "LIVE_AUDIO"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const sb = createClient(url, anonKey, { global: { headers: { Authorization: auth } } });
    const { data: { user }, error: authError } = await sb.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const parts = new URL(req.url).pathname.split("/").filter(Boolean);
    const i = parts.indexOf("machines");
    const machineId = i >= 0 ? parts[i + 1] : undefined;
    const action = i >= 0 ? parts[i + 2] : undefined;

    if (req.method === "GET" && !machineId) {
      const { data, error } = await sb.from("machine_connect_machines").select("*").order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 400);
      return json({ machines: data ?? [] });
    }

    if (req.method === "POST" && !machineId) {
      const body = await req.json();
      const row = { machine_identity: String(body.machine_identity ?? "").trim(), name: String(body.name ?? "").trim(), machine_type: String(body.machine_type ?? "").trim(), capabilities: Array.isArray(body.capabilities) ? body.capabilities : [], owner_id: user.id, state: "OFFLINE", trust_level: "PENDING" };
      if (!row.machine_identity || !row.name || !row.machine_type) return json({ error: "machine_identity, name and machine_type are required" }, 400);
      const { data, error } = await sb.from("machine_connect_machines").insert(row).select().single();
      if (error) return json({ error: error.message }, error.code === "23505" ? 409 : 400);
      await sb.from("machine_connect_events").insert({ machine_id: data.id, event_type: "machine.registered", actor_id: user.id, payload: { machine_identity: data.machine_identity } });
      return json({ machine: data }, 201);
    }

    if (!machineId) return json({ error: "Route not found" }, 404);
    const { data: machine, error: machineError } = await sb.from("machine_connect_machines").select("*").eq("id", machineId).single();
    if (machineError || !machine) return json({ error: "Machine not found" }, 404);
    if (req.method === "GET" && !action) return json({ machine });

    if (req.method === "POST" && action === "evidence") {
      const body = await req.json();
      const evidenceType = String(body.evidence_type ?? "").trim().toUpperCase();
      if (!allowedEvidenceTypes.has(evidenceType)) return json({ error: "Unsupported evidence_type" }, 400);
      const { data, error } = await sb.from("machine_connect_evidence").insert({
        machine_id: machine.id, owner_id: user.id, evidence_type: evidenceType,
        source_uri: body.source_uri ?? null, mime_type: body.mime_type ?? null,
        title: body.title ?? null, metadata: body.metadata ?? {}, captured_at: body.captured_at ?? null,
      }).select().single();
      if (error) return json({ error: error.message }, 400);
      await sb.from("machine_connect_events").insert({ machine_id: machine.id, event_type: "evidence.received", actor_id: user.id, payload: { evidence_id: data.id, evidence_type: evidenceType } });
      return json({ evidence: data }, 201);
    }

    if (req.method === "GET" && action === "evidence") {
      const { data, error } = await sb.from("machine_connect_evidence").select("*").eq("machine_id", machine.id).order("created_at", { ascending: false }).limit(100);
      if (error) return json({ error: error.message }, 400);
      return json({ evidence: data ?? [] });
    }

    if (req.method === "POST" && action === "analyze") {
      const body = await req.json();
      const jobType = String(body.job_type ?? "MULTIMODAL").trim().toUpperCase();
      if (!allowedJobTypes.has(jobType)) return json({ error: "Unsupported job_type" }, 400);
      const requestedModel = body.requested_model ? String(body.requested_model).slice(0, 200) : null;
      const input = body.input && typeof body.input === "object" ? body.input : {};
      const { data, error } = await sb.from("machine_connect_analysis_jobs").insert({ machine_id: machine.id, owner_id: user.id, job_type: jobType, status: "QUEUED", input, requested_model: requestedModel }).select().single();
      if (error) return json({ error: error.message }, 400);
      await sb.from("machine_connect_events").insert({ machine_id: machine.id, event_type: "analysis.queued", actor_id: user.id, payload: { analysis_job_id: data.id, job_type: jobType } });
      return json({ job: data, execution: "QUEUED_FOR_MODEL_ORCHESTRATOR", physical_execution: false }, 202);
    }

    if (req.method === "GET" && action === "analysis") {
      const { data, error } = await sb.from("machine_connect_analysis_jobs").select("*").eq("machine_id", machine.id).order("created_at", { ascending: false }).limit(50);
      if (error) return json({ error: error.message }, 400);
      return json({ jobs: data ?? [] });
    }

    if (req.method === "GET" && action === "diagnostics") {
      const { data, error } = await sb.from("machine_connect_diagnoses").select("*").eq("machine_id", machine.id).order("created_at", { ascending: false }).limit(50);
      if (error) return json({ error: error.message }, 400);
      return json({ diagnoses: data ?? [] });
    }

    if (req.method === "GET" && action === "repair-plans") {
      const { data, error } = await sb.from("machine_connect_repair_plans").select("*").eq("machine_id", machine.id).order("created_at", { ascending: false }).limit(50);
      if (error) return json({ error: error.message }, 400);
      return json({ repair_plans: data ?? [] });
    }

    if (req.method === "POST" && action === "commands") {
      if (["OFFLINE", "LOCKED", "EMERGENCY_STOP", "CRITICAL"].includes(machine.state)) return json({ error: "Command rejected by safety state", state: machine.state }, 409);
      const body = await req.json();
      const command = String(body.action ?? "").trim();
      if (!command || !Array.isArray(machine.capabilities) || !machine.capabilities.includes(command)) return json({ error: "Capability not permitted" }, 403);
      const { data, error } = await sb.from("machine_connect_commands").insert({ machine_id: machine.id, action: command, parameters: body.parameters ?? {}, requested_by: user.id, status: "AUTHORIZED_FOR_GATEWAY" }).select().single();
      if (error) return json({ error: error.message }, 400);
      await sb.from("machine_connect_events").insert({ machine_id: machine.id, event_type: "command.authorized", actor_id: user.id, payload: { command_id: data.id, action: command } });
      return json({ command: data, next: "device_gateway", physical_execution: false }, 202);
    }

    if (req.method === "POST" && action === "emergency-stop") {
      const { data, error } = await sb.from("machine_connect_machines").update({ state: "EMERGENCY_STOP" }).eq("id", machine.id).select().single();
      if (error) return json({ error: error.message }, 400);
      await sb.from("machine_connect_events").insert({ machine_id: machine.id, event_type: "safety.emergency_stop", actor_id: user.id, payload: { source: "authenticated_api" } });
      return json({ machine: data, status: "EMERGENCY_STOP" });
    }
    return json({ error: "Route not found" }, 404);
  } catch (e) { return json({ error: e instanceof Error ? e.message : "Internal error" }, 500); }
});