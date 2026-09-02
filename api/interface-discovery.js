import { createClient } from "@supabase/supabase-js";
import { getSession, sendJson } from "../lib/supabaseServer.js";

const SUPABASE_URL = "https://dixfybqlepticyudikuz.supabase.co";
const ANON_KEY = "sb_publishable_zOtxwZ1q_OCpiTunktzypw_14pQnQOh";

function adminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  try {
    const session = await getSession(req, res);
    if (!session?.user?.id || !session.token) return sendJson(res, 401, { error: "Authentication required" });
    const svc = adminClient();
    if (req.method === "GET") {
      const limit = Math.min(50, Math.max(1, Number(req.query?.limit || 12)));
      const { data, error } = await svc.rpc("merveil_interface_discovery", { p_limit: limit });
      if (error) throw error;
      return sendJson(res, 200, { interfaces: data || [], algorithm: "merveil-discovery-v1" });
    }
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const interfaceId = body.interface_id;
    const eventType = String(body.event_type || "visit");
    const allowed = new Set(["visit", "interaction", "activate", "subscribe"]);
    if (!interfaceId || !allowed.has(eventType)) return sendJson(res, 400, { error: "Invalid discovery event" });
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${session.token}` } } });
    const { data, error } = await userClient.rpc("merveil_interface_record_event", { p_interface_id: interfaceId, p_event_type: eventType, p_source: body.source || "explore", p_metadata: body.metadata || {} });
    if (error) throw error;
    return sendJson(res, 200, { event_id: data });
  } catch (error) {
    console.error("interface-discovery", error);
    return sendJson(res, 500, { error: "Interface discovery unavailable" });
  }
}
