import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dixfybqlepticyudikuz.supabase.co";
const SUPABASE_KEY = "sb_publishable_zOtxW1q_OCpiTunktzypw_14pQnQOh";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  realtime: { params: { eventsPerSecond: 10 } },
});

let state = { userId: null, notifications: [], unreadCount: 0, status: "DISCONNECTED" };
let channel = null;
let started = false;
let token = null;

function emit() {
  if (typeof window === "undefined") return;
  window.__merveilNotifications = { ...state, notifications: [...state.notifications] };
  window.dispatchEvent(new CustomEvent("merveil:notifications", { detail: window.__merveilNotifications }));
}

function normalize(row) {
  const payload = row?.payload && typeof row.payload === "object" ? row.payload : {};
  return {
    ...row,
    title: row.title || payload.title || "Merveil AI",
    body: row.body || payload.body || "New activity in Merveil",
    action_url: row.action_url || payload.url || "/",
    read_at: row.read_at || null,
  };
}

async function getRealtimeToken() {
  const response = await fetch("/api/session?kind=realtime", { credentials: "include", cache: "no-store" });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body?.access_token || !body?.user_id) return null;
  token = body.access_token;
  return body;
}

async function load(userId) {
  const { data, error } = await supabase
    .from("merveil_notification_events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  state.notifications = (data || []).map(normalize);
  state.unreadCount = state.notifications.filter((n) => !n.read_at).length;
  emit();
}

async function subscribe(userId) {
  if (channel) await supabase.removeChannel(channel);
  await supabase.realtime.setAuth(token);
  channel = supabase
    .channel(`merveil:notifications:${userId}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "merveil_notification_events", filter: `user_id=eq.${userId}` }, (change) => {
      const notification = normalize(change.new);
      state.notifications = [notification, ...state.notifications.filter((n) => n.id !== notification.id)].slice(0, 100);
      if (!notification.read_at) state.unreadCount += 1;
      state.status = "SUBSCRIBED";
      emit();
    })
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "merveil_notification_events", filter: `user_id=eq.${userId}` }, (change) => {
      const next = normalize(change.new);
      const previous = state.notifications.find((n) => n.id === next.id);
      state.notifications = state.notifications.map((n) => (n.id === next.id ? next : n));
      if (previous && !previous.read_at && next.read_at) state.unreadCount = Math.max(0, state.unreadCount - 1);
      if (previous && previous.read_at && !next.read_at) state.unreadCount += 1;
      emit();
    })
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "merveil_notification_events", filter: `user_id=eq.${userId}` }, (change) => {
      const previous = state.notifications.find((n) => n.id === change.old?.id);
      state.notifications = state.notifications.filter((n) => n.id !== change.old?.id);
      if (previous && !previous.read_at) state.unreadCount = Math.max(0, state.unreadCount - 1);
      emit();
    })
    .subscribe((status) => {
      state.status = status;
      emit();
    });
}

export async function startMerveilNotifications() {
  if (started || typeof window === "undefined") return;
  started = true;

  try {
    const auth = await getRealtimeToken();
    if (!auth) return;
    state.userId = auth.user_id;
    await load(auth.user_id);
    await subscribe(auth.user_id);
    await registerMerveilPush(false);
  } catch (error) {
    state.status = "ERROR";
    emit();
    console.warn("Merveil notifications unavailable", error);
  }
}

export async function markMerveilNotificationRead(id) {
  if (!id) return;
  await supabase.from("merveil_notification_events").update({ read_at: new Date().toISOString(), status: "read" }).eq("id", id).eq("user_id", state.userId);
}

export async function markAllMerveilNotificationsRead() {
  if (!state.userId) return;
  await supabase.from("merveil_notification_events").update({ read_at: new Date().toISOString(), status: "read" }).eq("user_id", state.userId).is("read_at", null);
}

export async function deleteMerveilNotification(id) {
  if (!id) return;
  await supabase.from("merveil_notification_events").delete().eq("id", id).eq("user_id", state.userId);
}

function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function registerMerveilPush(requestPermission = false) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return false;
  const permission = requestPermission ? await Notification.requestPermission() : Notification.permission;
  if (permission !== "granted") return false;

  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    const keyResponse = await fetch("/api/push?action=vapid-public", { credentials: "include" });
    const keyBody = await keyResponse.json().catch(() => ({}));
    if (!keyBody.enabled || !keyBody.publicKey) return false;
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyBody.publicKey),
    });
  }

  const p256dh = subscription.getKey("p256dh");
  const authKey = subscription.getKey("auth");
  if (!p256dh || !authKey) return false;

  const encode = (key) => btoa(String.fromCharCode(...new Uint8Array(key)));
  const response = await fetch("/api/push?action=subscribe", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      platform: "web",
      subscription: { endpoint: subscription.endpoint, keys: { p256dh: encode(p256dh), auth: encode(authKey) } },
    }),
  });
  return response.ok;
}

export function getMerveilNotifications() {
  return { ...state, notifications: [...state.notifications] };
}
