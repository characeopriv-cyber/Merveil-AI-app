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
let lastStatus = "DISCONNECTED";

const TABLES = [
  // Identity / Passport / presence
  "profiles", "presence", "citizen_status", "relationships", "connections",
  // Connect / communication / calls
  "conversations", "messages", "calls", "devices", "device_telemetry",
  "e2ee_call_sessions", "merveil_call_signaling", "merveil_e2ee_conversations", "merveil_e2ee_devices",
  // World / PULSE / social feed
  "world_posts", "world_likes", "world_reactions", "world_saves", "world_supers", "world_post_views",
  // Community / circles / forums
  "circles", "circle_members", "circle_posts", "entity_communities", "entities", "forum_posts",
  // Invest
  "invest_posts", "invest_likes",
  // Arena / credits / rewards
  "arena_progress", "credit_ledger", "credit_wallets", "daily_rewards", "reward_claims", "user_wallets", "wallet_ledger",
  // Date Me
  "date_me_profiles", "date_me_introductions",
  // Properties / marketplace / services
  "properties", "property_likes", "property_supers", "property_inventories",
  "services", "service_likes", "service_requests",
  "jobs", "job_likes", "job_applications",
  // Events
  "events", "event_likes", "event_rsvps",
  // Sounds / media interactions
  "sounds", "sound_interactions", "sound_reports", "sound_usage",
  // Notifications / citizen-visible system state
  "merveil_notification_events", "merveil_notification_channels", "merveil_notification_provider_outbox",
  // Interface / developer-facing citizen discovery
  "developer_products", "interface_products", "interface_listings", "interface_reviews",
  // Support
  "support_tickets"
];

const notify = (detail) => {
  if (typeof window === "undefined") return;
  const payload = { ...detail, received_at: Date.now() };
  lastEventAt = payload.received_at;
  window.dispatchEvent(new CustomEvent("merveil:realtime", { detail: payload }));
  // Merveil screens already use focus/online refresh paths. This turns a
  // database change into an immediate snapshot invalidation without forcing
  // navigation, logout/login, or a full-page reload.
  window.dispatchEvent(new Event("focus"));
};

const clearTimers = () => {
  if (typeof window === "undefined") return;
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
  refreshTimer = window.setTimeout(() => {
    refreshTimer = null;
    connect(true);
  }, 45 * 60 * 1000);
};

async function connect(force = false) {
  if (connecting || typeof window === "undefined" || !navigator.onLine) return;
  connecting = true;

  try {
    // realtime is exposed through the existing authenticated session router.
    // Using the same session cookie avoids a second login/session in the app.
    const response = await fetch("/api/session?kind=realtime", {
      credentials: "include",
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    const body = await response.json().catch(() => ({}));

    if (!response.ok || !body?.access_token || !body?.user_id) {
      lastStatus = response.status === 401 ? "AUTH_REQUIRED" : "TOKEN_UNAVAILABLE";
      if (channel) {
        await supabase.removeChannel(channel);
        channel = null;
      }
      if (response.status >= 500) scheduleReconnect(3000);
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

    for (const table of TABLES) {
      next.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (change) => {
          notify({
            table,
            event: change.eventType,
            record: change.new ?? null,
            old: change.old ?? null,
          });
        }
      );
    }

    next.subscribe((status) => {
      lastStatus = status;
      if (status === "SUBSCRIBED") {
        channel = next;
        notify({ table: "__connection__", event: "SUBSCRIBED", record: { user_id: userId } });
        scheduleTokenRefresh();
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        if (channel === next) channel = null;
        scheduleReconnect(status === "TIMED_OUT" ? 2500 : 1500);
      }
    });
  } catch {
    lastStatus = "NETWORK_ERROR";
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

  // Periodic health check only reconnects the socket; it does not log out the
  // citizen or reload the application.
  window.setInterval(() => {
    if (document.visibilityState === "visible" && navigator.onLine) connect();
  }, 60 * 1000);
}

export function getMerveilRealtimeStatus() {
  return { connected: Boolean(channel), status: lastStatus, lastEventAt };
}
