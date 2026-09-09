import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dixfybqlepticyudikuz.supabase.co";
const SUPABASE_KEY = "sb_publishable_zOtxwZ1q_OCpiTunktzypw_14pQnQOh";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { params: { eventsPerSecond: 20 } },
});

let channel = null;
let reconnectTimer = null;
let refreshTimer = null;
let started = false;
let connecting = false;
let lastEventAt = 0;

const notify = (detail) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("merveil:realtime", { detail }));
  // Existing screens already refresh on focus/online. Reuse that path so
  // realtime changes immediately invalidate their current server snapshots.
  window.dispatchEvent(new Event("focus"));
};

const clearTimers = () => {
  if (reconnectTimer) window.clearTimeout(reconnectTimer);
  if (refreshTimer) window.clearTimeout(refreshTimer);
  reconnectTimer = null;
  refreshTimer = null;
};

const scheduleReconnect = (delay = 1500) => {
  if (typeof window === "undefined" || reconnectTimer) return;
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, delay);
};

const scheduleTokenRefresh = () => {
  if (typeof window === "undefined") return;
  if (refreshTimer) window.clearTimeout(refreshTimer);
  // Refresh well before the short-lived realtime JWT expires.
  refreshTimer = window.setTimeout(() => {
    refreshTimer = null;
    connect(true);
  }, 45 * 60 * 1000);
};

async function connect(force = false) {
  if (connecting || typeof window === "undefined") return;
  if (!navigator.onLine) return;
  connecting = true;

  try {
    const response = await fetch("/api/realtime-token", {
      credentials: "include",
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    const body = await response.json().catch(() => ({}));

    if (!response.ok || !body?.access_token || !body?.user_id) {
      if (channel) {
        await supabase.removeChannel(channel);
        channel = null;
      }
      return;
    }

    if (force && channel) {
      await supabase.removeChannel(channel);
      channel = null;
    }

    await supabase.realtime.setAuth(body.access_token);

    if (channel) return;

    const userId = body.user_id;
    const next = supabase.channel(`merveil-live-${userId}`, {
      config: { broadcast: { self: false } },
    });

    const tables = [
      "profiles",
      "presence",
      "connections",
      "relationships",
      "conversations",
      "messages",
      "world_posts",
      "citizen_status",
      "entities",
      "entity_communities",
      "forum_posts",
      "calls",
      "devices",
      "device_telemetry",
      "e2ee_call_sessions",
      "support_tickets",
    ];

    // Subscribe once to the complete citizen-facing data surface. RLS on each
    // table remains the authorization boundary; the client never receives a
    // broader token than the server already grants it.
    for (const table of tables) {
      next.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          lastEventAt = Date.now();
          notify({ table, event: payload.eventType, record: payload.new, old: payload.old });
        }
      );
    }

    next.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel = next;
        notify({ table: "__connection__", event: "SUBSCRIBED" });
        scheduleTokenRefresh();
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        if (channel === next) channel = null;
        scheduleReconnect(1500);
      }
    });
  } catch {
    scheduleReconnect(2500);
  } finally {
    connecting = false;
  }
}

export function startMerveilRealtime() {
  if (started || typeof window === "undefined") return;
  started = true;

  connect();

  window.addEventListener("online", () => connect(true));
  window.addEventListener("focus", () => connect());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") connect();
  });

  // Keep the socket healthy without requiring logout/login.
  window.setInterval(() => {
    if (document.visibilityState === "visible" && navigator.onLine) connect();
  }, 60 * 1000);
}

export function getMerveilRealtimeStatus() {
  return {
    connected: Boolean(channel),
    lastEventAt,
  };
}
