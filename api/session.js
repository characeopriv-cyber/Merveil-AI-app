import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { getSession, clearSessionCookie, sendJson } from "../lib/supabaseServer.js";

const SUPABASE_URL = "https://dixfybqlepticyudikuz.supabase.co";
const SUPABASE_KEY = "sb_publishable_zOtxwZ1q_OCpiTunktzypw_14pQnQOh";

function routeKind(req) {
  const raw = String(req.query?.kind || "").toLowerCase();
  if (["auth", "passport", "connect"].includes(raw)) return raw;
  const path = String(req.url || "").split("?")[0].replace(/\/+$/, "");
  if (path.endsWith("/auth-session")) return "auth";
  if (path.endsWith("/passport-session")) return "passport";
  if (path.endsWith("/connect-session")) return "connect";
  return "";
}

export default async function handler(req, res) {
  const kind = routeKind(req);

  if (kind === "auth") {
    if (req.method !== "GET" && req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return sendJson(res, 405, { error: "Method not allowed" });
    }
    try {
      const session = await getSession(req, res);
      res.setHeader("Cache-Control", "private, no-store, max-age=0");
      return sendJson(res, 200, {
        authenticated: Boolean(session?.user?.id),
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email || null,
          phone: session.user.phone || null,
        } : null,
      });
    } catch {
      clearSessionCookie(res);
      return sendJson(res, 401, { authenticated: false, user: null, error: "Session unavailable" });
    }
  }

  if (kind !== "passport" && kind !== "connect") {
    return sendJson(res, 404, { error: "Session route not found" });
  }
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const session = await getSession(req, res);
  const userId = session.user?.id;
  if (!userId || !session.token) {
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    return sendJson(res, 401, { authenticated: false, data: null, error: "Authentication required" });
  }

  const db = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${session.token}` } },
  });

  if (kind === "passport") {
    const { data, error } = await db.from("profiles")
      .select("id,name,junction_id,passport_tier,role_label,country,account_type,company_name,profession,languages,kyc_level,kyc_status,kyc_verified_at,avatar_url,merveil_credits")
      .eq("id", userId).maybeSingle();
    if (error) return sendJson(res, 500, { authenticated: true, data: null, error: "Passport unavailable" });
    if (!data) return sendJson(res, 404, { authenticated: true, data: null, error: "Passport not found" });
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    return sendJson(res, 200, { authenticated: true, data, request_id: crypto.randomUUID() });
  }

  const [{ data: profiles, error: profileError }, { data: connections, error: connectionError }, { data: presence, error: presenceError }, { data: conversations, error: conversationError }] = await Promise.all([
    db.from("profiles").select("id,name,avatar_url,role_label,profession,company_name,country,city,discoverable,suspended,kyc_status").eq("discoverable", true).eq("suspended", false).neq("id", userId).order("last_seen_at", { ascending: false, nullsFirst: false }).limit(100),
    db.from("connections").select("user_id,connected_user_id,status,created_at").or(`user_id.eq.${userId},connected_user_id.eq.${userId}`).eq("status", "accepted"),
    db.from("presence").select("user_id,status,updated_at").limit(500),
    db.from("conversations").select("id,participant_ids,context_label,created_at").contains("participant_ids", [userId]).order("created_at", { ascending: false }).limit(30),
  ]);
  if (profileError || connectionError || presenceError || conversationError) return sendJson(res, 500, { authenticated: true, error: "Connect unavailable" });
  const connectedIds = new Set((connections || []).map(c => c.user_id === userId ? c.connected_user_id : c.user_id));
  const presenceMap = new Map((presence || []).map(p => [p.user_id, p.status]));
  const citizens = (profiles || []).map(p => ({ id:p.id, name:p.name || "Merveil Citizen", avatar:p.avatar_url || null, role:p.role_label || p.profession || "Citizen", location:[p.city,p.country].filter(Boolean).join(", "), presence:presenceMap.get(p.id) || "offline", context:connectedIds.has(p.id)?"My Circle":"Discoverable citizen", connected:connectedIds.has(p.id), verified:p.kyc_status === "verified" }));
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  return sendJson(res, 200, { authenticated:true, citizens, circle_ids:[...connectedIds], conversations:(conversations || []).map(c=>({id:c.id,context_label:c.context_label||null,created_at:c.created_at,participant_count:Array.isArray(c.participant_ids)?c.participant_ids.length:0})), request_id:crypto.randomUUID() });
}
