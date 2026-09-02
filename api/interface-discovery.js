import { createClient } from "@supabase/supabase-js";
import { getSession, sendJson } from "../lib/supabaseServer.js";

const SUPABASE_URL = "https://dixfybqlepticyudikuz.supabase.co";
const ANON_KEY = "sb_publishable_zOtxwZ1q_OCpiTunktzypw_14pQnQOh";
const EVENT_TYPES = new Set(["visit", "interaction", "activate", "subscribe"]);

function adminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  try {
    const session = await getSession(req, res);
    if (!session?.user?.id || !session.token) {
      return sendJson(res, 401, { error: "Authentication required" });
    }

    const svc = adminClient();

    if (req.method === "GET") {
      const limit = Math.min(100, Math.max(1, Number(req.query?.limit || 50)));
      const { data, error } = await svc.rpc("merveil_unified_discovery", { p_limit: limit });
      if (error) throw error;
      return sendJson(res, 200, {
        items: data || [],
        algorithm: "merveil-unified-discovery-v1",
      });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const eventType = String(body.event_type || "visit");
    const catalogItemId = String(body.catalog_item_id || body.interface_id || "");

    if (!catalogItemId || !EVENT_TYPES.has(eventType)) {
      return sendJson(res, 400, { error: "Invalid discovery event" });
    }

    const { data: item, error: itemError } = await svc
      .from("merveil_discovery_catalog")
      .select("id,status")
      .eq("id", catalogItemId)
      .maybeSingle();

    if (itemError) throw itemError;
    if (!item || item.status !== "active") {
      return sendJson(res, 404, { error: "Discovery item not found" });
    }

    // The server derives the visitor from the authenticated session.
    // Client metadata is treated as context only; it cannot set identity.
    const safeMetadata = body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
      ? body.metadata
      : {};

    const { data, error } = await svc
      .from("merveil_discovery_events")
      .insert({
        catalog_item_id: item.id,
        visitor_profile_id: session.user.id,
        event_type: eventType,
        source: String(body.source || "discover").slice(0, 80),
        metadata: safeMetadata,
      })
      .select("id")
      .single();

    if (error) throw error;
    return sendJson(res, 200, { event_id: data.id });
  } catch (error) {
    console.error("interface-discovery", error);
    return sendJson(res, 500, { error: "Interface discovery unavailable" });
  }
}
