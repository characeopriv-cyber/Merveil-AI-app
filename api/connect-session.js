import { createClient } from "@supabase/supabase-js";
import { getSession, sendJson } from "../lib/supabaseServer.js";

const URL = "https://dixfybqlepticyudikuz.supabase.co";
const KEY = "sb_publishable_zOtxwZ1q_OCpiTunktzypw_14pQnQOh";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { error: "Method not allowed" });
  }
  const session = await getSession(req, res);
  const userId = session.user?.id;
  if (!userId || !session.token) return sendJson(res, 401, { authenticated: false, error: "Authentication required" });

  const db = createClient(URL, KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${session.token}` } },
  });

  const [{ data: profiles, error: profileError }, { data: connections, error: connectionError }, { data: presence, error: presenceError }, { data: conversations, error: conversationError }] = await Promise.all([
    db.from("profiles").select("id,name,avatar_url,role_label,profession,company_name,country,city,discoverable,suspended,kyc_status").eq("discoverable", true).eq("suspended", false).neq("id", userId).order("last_seen_at", { ascending: false, nullsFirst: false }).limit(100),
    db.from("connections").select("user_id,connected_user_id,status,created_at").or(`user_id.eq.${userId},connected_user_id.eq.${userId}`).eq("status", "accepted"),
    db.from("presence").select("user_id,status,updated_at").in("user_id", [userId]),
    db.from("conversations").select("id,participant_ids,context_label,created_at").contains("participant_ids", [userId]).order("created_at", { ascending: false }).limit(30),
  ]);

  if (profileError || connectionError || presenceError || conversationError) return sendJson(res, 500, { authenticated: true, error: "Connect unavailable" });

  const connectedIds = new Set((connections || []).map(c => c.user_id === userId ? c.connected_user_id : c.user_id));
  const presenceMap = new Map((presence || []).map(p => [p.user_id, p.status]));
  const citizens = (profiles || []).map(p => ({
    id: p.id,
    name: p.name || "Merveil Citizen",
    avatar: p.avatar_url || null,
    role: p.role_label || p.profession || "Citizen",
    location: [p.city, p.country].filter(Boolean).join(", "),
    presence: presenceMap.get(p.id) || "offline",
    context: connectedIds.has(p.id) ? "My Circle" : "Discoverable citizen",
    connected: connectedIds.has(p.id),
    verified: p.kyc_status === "verified",
  }));

  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  return sendJson(res, 200, {
    authenticated: true,
    citizens,
    circle_ids: [...connectedIds],
    conversations: (conversations || []).map(c => ({ id: c.id, context_label: c.context_label || null, created_at: c.created_at, participant_count: Array.isArray(c.participant_ids) ? c.participant_ids.length : 0 })),
    request_id: crypto.randomUUID(),
  });
}
