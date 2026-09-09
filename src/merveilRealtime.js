import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dixfybqlepticyudikuz.supabase.co";
const SUPABASE_KEY = "sb_publishable_zOtxW1q_OCpiTunktzypw_14pQnQOh";

// Merveil uses the existing authenticated HTTP session as the source of truth.
// We intentionally do NOT create a second Supabase Auth session in the browser.
// /api/session?kind=realtime returns the current citizen JWT, which is then
// attached to the Realtime WebSocket.
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

let channel = null;
let reconnectTimer = null;
let refreshTimer = null;
let refreshHealthTimer = null;
let refreshEventTimer = null;
let started = false;
let connecting = false;
let lastEventAt = 0;
let lastStatus = "DISCONNECTED";
let activeUserId = null;

// Only citizen-facing Merveil AI data belongs here.
// Machine Connect tables stay in the separate Machine Connect architecture.
// High-volume telemetry/view/usage tables are deliberately excluded; they
// should use dedicated streams/analytics rather than fan-out Postgres Changes.
const TABLES = [
  // Passport / identity / citizen state
  "profiles",
  "presence",
  "citizen_status",
  "relationships",
  "connections",

  // Connect / messaging / calls
  "conversations",
  "messages",
  "calls",
  "devices",
  "e2ee_call_sessions",
  "merveil_call_signaling",
  "merveil_e2ee_conversations",
  "merveil_e2ee_devices",

  // World / PULSE
  "world_posts",
  "world_likes",
  "world_reactions",
  "world_saves",
  "world_supers",

  // Circles / communities
  "circles",
  "circle_members",
  "circle_posts",
  "entities",
  "forum_posts",

  // Investor feed
  "invest_posts",
  "invest_likes",

  // Arena / Merveil credits / rewards
  "arena_progress",
  "credit_ledger",
  "credit_wallets",
  "daily_rewards",
  "reward_claims",
  "user_wallets",
  "wallet_ledger",

  // Date Me
  "date_me_profiles",
  "date_me_introductions",

  // Property / services / jobs
  "properties",
  "property_likes",
  "property_supers",
  "property_inventories",
  "services",
  "service_likes",
  "service_requests",
  "jobs",
  "job_likes",
  "job_applications",

  // Events
  "events",
  "event_likes",
  "event_rsvps",

  // Sounds / media interactions
  "sounds",
  "sound_interactions",
  "sound_usage",

  // Citizen-visible notifications and support
  "merveil_notification_events",
  "merveil_notification_channels",
  "support_tickets",
];

const scheduleUiRefresh = () => {
  if (typeof window === "undefined" || refreshEventTimer) return;
  refreshEventTimer = window.setTimeout(() => {
    refreshEventTimer = null;
    // Existing Merveil screens use focus/online refresh paths. Coalescing the
    // event avoids a network refresh for every individual database change.
    window.dispatchEvent(new Event("focus"));
  }, 100);
};

const notify = (detail) => {
  if (typeof window === "undefined") return;
  const payload = { ...detail, received_at: Date.now() };
  lastEventAt = payload.received_at;
  window.dispatchEvent(new CustomEvent("merveil:realtime", { detail: payload }));
  scheduleUiRefresh();
};

const clearTimers = () => {
  if (typeof window === "undefined") return;
  if (reconnectTimer) window.clearTimeout(reconnectTimer);
  if (refreshTimer) window.clearTimeout(refreshTimer);
  if (refreshHealthTimer) window.clearTimeout(refreshHealthTimer);
  if (refreshEventTimer) window.clearTimeout(refreshEventTimer);
  reconnectTimer = null;
  refreshTimer = null;
  refreshHealthTimer = null;
  refreshEventTimer = null;
};

const removeChannel = async () => {
  const current = channel;
  channel = null;
  if (!current) return;
  try {
    await supabase.removeChannel(current);
  } catch {
    // Reconnect path will create a fresh channel.
  }
};

const scheduleReconnect = (delay = 1500) => {
  if (typeof window === "undefined" || reconnectTimer || !navigator.onLine) return;
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, delay);
};

const scheduleTokenRefresh = () => {
  if (typeof window === "undefined") return;
  if (refreshTimer) window.clearTimeout(refreshTimer);

  // Refresh before a normal short-lived JWT can expire. The refreshed token is
  // explicitly sent to Realtime so the existing WebSocket stays authorized.
  refreshTimer = window.setTimeout(() => {
    refreshTimer = null;
    connect(true);
  }, 45 * 60 * 1000);
};

const scheduleHealthCheck = () => {
  if (typeof window === "undefined") return;
  if (refreshHealthTimer) window.clearTimeout(refreshHealthTimer);
  refreshHealthTimer = window.setTimeout(() => {
    refreshHealthTimer = null;
    if (document.visibilityState === "visible" && navigator.onLine) connect();
    scheduleHealthCheck();
  }, 60 * 1000);
};

async function connect(force = false) {
  if (connecting || typeof window === "undefined" || !navigator.onLine) return;

  // A healthy channel does not need another HTTP session request. This is
  // important because realtime events can be frequent.
  if (channel && !force) {
    scheduleTokenRefresh();
    return;
  }

  connecting = true;

  try {
    // One Merveil login/session. No re-login and no browser-local duplicate
    // Supabase Auth session is required for Realtime.
    const response = await fetch("/api/session?kind=realtime", {
      credentials: "include",
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    const body = await response.json().catch(() => ({}));

    if (!response.ok || !body?.access_token || !body?.user_id) {
      lastStatus = response.status === 401 ? "AUTH_REQUIRED" : "TOKEN_UNAVAILABLE";
      await removeChannel();
      if (response.status >= 500) scheduleReconnect(3000);
      return;
    }

    const userId = body.user_id;
    if (activeUserId && activeUserId !== userId) await removeChannel();
    if (force) await removeChannel();

    await supabase.realtime.setAuth(body.access_token);
    activeUserId = userId;

    if (channel) {
      scheduleTokenRefresh();
      return;
    }

    const next = supabase.channel(`merveil:citizen:${userId}`);

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
        notify({
          table: "__connection__",
          event: "SUBSCRIBED",
          record: { user_id: userId },
        });
        scheduleTokenRefresh();
      }

      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
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
  scheduleHealthCheck();

  window.addEventListener("online", () => connect(true));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") connect();
  });

  window.addEventListener("beforeunload", () => {
    clearTimers();
    removeChannel();
  });
}

export function getMerveilRealtimeStatus() {
  return {
    connected: Boolean(channel),
    status: lastStatus,
    lastEventAt,
    userId: activeUserId,
  };
}
