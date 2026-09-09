import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dixfybqlepticyudikuz.supabase.co";
const SUPABASE_KEY = "sb_publishable_zOtxW1q_OCpiTunktzypw_14pQnQOh";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

let activeUserId = null;
let initialized = false;

async function getRealtimeSession() {
  const response = await fetch("/api/session?kind=realtime", {
    credentials: "include",
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body?.access_token || !body?.user_id) {
    throw new Error(response.status === 401 ? "AUTH_REQUIRED" : "TOKEN_UNAVAILABLE");
  }
  await supabase.realtime.setAuth(body.access_token);
  activeUserId = body.user_id;
  return body.user_id;
}

export async function getMerveilConversationFeed() {
  const userId = activeUserId || await getRealtimeSession();
  const { data, error } = await supabase.rpc("get_merveil_user_conversations", {
    p_user_id: userId,
  });
  if (error) throw error;
  return data || [];
}

export async function markMerveilConversationRead(conversationId) {
  if (!conversationId) return;
  await getRealtimeSession();
  const { error } = await supabase.rpc("mark_merveil_conversation_read", {
    p_conversation_id: conversationId,
  });
  if (error) throw error;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("merveil:conversation-read", {
      detail: { conversation_id: conversationId },
    }));
  }
}

export async function getMerveilReelsFeed(limit = 20) {
  const userId = activeUserId || await getRealtimeSession();
  const { data, error } = await supabase.rpc("get_merveil_reels_feed", {
    p_user_id: userId,
    p_limit: Math.min(50, Math.max(1, Number(limit) || 20)),
  });
  if (error) throw error;
  return data || [];
}

export async function preflightMerveilProductionFeeds() {
  try {
    await getRealtimeSession();
    const [conversations, reels] = await Promise.all([
      getMerveilConversationFeed(),
      getMerveilReelsFeed(5),
    ]);
    const result = {
      ok: true,
      userId: activeUserId,
      conversations: conversations.length,
      reels: reels.length,
      checkedAt: new Date().toISOString(),
    };
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("merveil:production-feeds", { detail: result }));
    }
    return result;
  } catch (error) {
    const result = {
      ok: false,
      error: error?.message || "PRODUCTION_FEED_PREFLIGHT_FAILED",
      checkedAt: new Date().toISOString(),
    };
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("merveil:production-feeds", { detail: result }));
    }
    return result;
  }
}

export function startMerveilProductionFeeds() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  // Preflight only: screens can call the exported feed methods when rendered.
  // This does not replace the existing session/auth flow or expose credentials.
  preflightMerveilProductionFeeds();
}
