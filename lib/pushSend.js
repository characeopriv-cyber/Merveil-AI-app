/**
 * Merveil server-side push delivery
 * - Native (Android/iOS Capacitor): FCM HTTP v1
 * - Web / PWA: Web Push (VAPID) via `web-push` when installed
 *
 * Env (Vercel / host):
 *   FIREBASE_SERVICE_ACCOUNT_JSON  — full service-account JSON string (FCM)
 *   FCM_PROJECT_ID                 — optional override if not in JSON
 *   VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT — Web Push
 */

import crypto from "crypto";

function parseServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || "";
  if (!raw) return null;
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

let cachedAccessToken = null;
let cachedAccessTokenExp = 0;

async function getGoogleAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && cachedAccessTokenExp > now + 60) return cachedAccessToken;

  const iat = now;
  const exp = now + 3600;
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claim = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat,
      exp,
    })
  ).toString("base64url");
  const unsigned = `${header}.${claim}`;
  const key = sa.private_key;
  const sig = crypto.createSign("RSA-SHA256").update(unsigned).sign(key, "base64url");
  const jwt = `${unsigned}.${sig}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "FCM OAuth token failed");
  }
  cachedAccessToken = data.access_token;
  cachedAccessTokenExp = now + (data.expires_in || 3600);
  return cachedAccessToken;
}

/**
 * Send one FCM message to a device token (Capacitor / native).
 */
export async function sendFcm({ token, title, body, data = {}, urgent = false }) {
  const sa = parseServiceAccount();
  if (!sa?.client_email || !sa?.private_key) {
    return { ok: false, error: "FIREBASE_SERVICE_ACCOUNT_JSON not configured" };
  }
  const projectId = process.env.FCM_PROJECT_ID || sa.project_id;
  if (!projectId) return { ok: false, error: "FCM project_id missing" };

  const accessToken = await getGoogleAccessToken(sa);
  const message = {
    message: {
      token,
      notification: { title: title || "Merveil AI", body: body || "" },
      data: Object.fromEntries(
        Object.entries({ ...data, title: title || "Merveil AI", body: body || "" }).map(([k, v]) => [
          k,
          typeof v === "string" ? v : JSON.stringify(v),
        ])
      ),
      android: {
        priority: urgent ? "HIGH" : "NORMAL",
        notification: {
          channelId: urgent ? "merveil_calls" : "merveil_default",
          sound: "default",
        },
      },
      apns: {
        headers: { "apns-priority": urgent ? "10" : "5" },
        payload: {
          aps: {
            alert: { title: title || "Merveil AI", body: body || "" },
            sound: "default",
            "content-available": 1,
          },
        },
      },
    },
  };

  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: result?.error?.message || `FCM ${res.status}`,
      stale: /NOT_FOUND|UNREGISTERED|INVALID_ARGUMENT/i.test(JSON.stringify(result)),
    };
  }
  return { ok: true, name: result.name };
}

/**
 * Send Web Push (browser / PWA) using web-push package if available.
 */
export async function sendWebPush({ endpoint, p256dh, auth, title, body, data = {}, urgent = false }) {
  const pub = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  // web-push requires mailto: or https: — bare emails throw "not a valid URL"
  let subject = String(process.env.VAPID_SUBJECT || "mailto:support@junction.technology").trim();
  if (subject && !/^mailto:/i.test(subject) && !/^https?:\/\//i.test(subject)) {
    subject = subject.includes("@") ? `mailto:${subject}` : "mailto:support@junction.technology";
  }
  if (!pub || !priv) return { ok: false, error: "VAPID keys not configured" };

  let webpush;
  try {
    webpush = (await import("web-push")).default;
  } catch {
    return { ok: false, error: "Install web-push: npm i web-push" };
  }
  webpush.setVapidDetails(subject, pub, priv);
  const payload = JSON.stringify({
    title: title || "Merveil AI",
    body: body || "",
    tag: data.tag || "merveil",
    urgent: !!urgent,
    data: data || {},
  });
  try {
    await webpush.sendNotification(
      { endpoint, keys: { p256dh, auth } },
      payload,
      { urgency: urgent ? "high" : "normal", TTL: urgent ? 60 : 3600 }
    );
    return { ok: true };
  } catch (e) {
    const status = e?.statusCode || e?.status;
    return {
      ok: false,
      error: e?.message || "Web Push failed",
      stale: status === 404 || status === 410,
    };
  }
}

/**
 * Deliver to all subscriptions for a user_id.
 * rows: push_subscriptions rows from Supabase
 */
export async function sendToSubscriptions(rows, { title, body, data = {}, urgent = false } = {}) {
  const results = [];
  for (const row of rows || []) {
    const platform = (row.platform || "web").toLowerCase();
    const isNative =
      platform === "android" ||
      platform === "ios" ||
      platform === "native" ||
      row.p256dh === "native" ||
      (row.endpoint || "").startsWith("native://");

    if (isNative) {
      const token = row.device_token || row.auth;
      if (!token) {
        results.push({ id: row.id, ok: false, error: "No device token" });
        continue;
      }
      const r = await sendFcm({ token, title, body, data, urgent });
      results.push({ id: row.id, platform: platform || "native", ...r });
    } else {
      const r = await sendWebPush({
        endpoint: row.endpoint,
        p256dh: row.p256dh,
        auth: row.auth,
        title,
        body,
        data,
        urgent,
      });
      results.push({ id: row.id, platform: "web", ...r });
    }
  }
  return results;
}

export function pushConfigured() {
  const sa = parseServiceAccount();
  const fcm = !!(sa?.client_email && sa?.private_key);
  const vapid = !!(process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) && !!process.env.VAPID_PRIVATE_KEY;
  const appCheck =
    process.env.APP_CHECK_ENFORCE === "1" ||
    process.env.APP_CHECK_ENFORCE === "true" ||
    process.env.FIREBASE_APP_CHECK_ENFORCE === "1";
  return { fcm, vapid, any: fcm || vapid, appCheck };
}

/**
 * Verify Firebase App Check token from client header X-Firebase-AppCheck.
 * Uses service account OAuth + Firebase App Check Admin API.
 * Set APP_CHECK_ENFORCE=1 on Vercel to reject invalid/missing tokens on sensitive routes.
 * Monitor mode (default): verify if present, never block if unset.
 */
export async function verifyAppCheckToken(token) {
  if (!token || typeof token !== "string") {
    return { ok: false, error: "missing_app_check_token" };
  }
  const sa = parseServiceAccount();
  const projectId = process.env.FCM_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || sa?.project_id;
  if (!sa?.client_email || !sa?.private_key || !projectId) {
    // Soft-pass when server not fully configured (dev)
    return { ok: true, skipped: true, reason: "app_check_not_configured" };
  }

  // OAuth token scoped for App Check verification
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claim = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.appcheck",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  ).toString("base64url");
  const unsigned = `${header}.${claim}`;
  const sig = crypto.createSign("RSA-SHA256").update(unsigned).sign(sa.private_key, "base64url");
  const jwt = `${unsigned}.${sig}`;

  const tokRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const tokData = await tokRes.json().catch(() => ({}));
  if (!tokRes.ok || !tokData.access_token) {
    return { ok: false, error: tokData.error_description || "app_check_oauth_failed" };
  }

  const verify = await fetch(
    `https://firebaseappcheck.googleapis.com/v1/projects/${projectId}:verifyAppCheckToken`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ appCheckToken: token }),
    }
  );
  const data = await verify.json().catch(() => ({}));
  if (!verify.ok) {
    return {
      ok: false,
      error: data?.error?.message || `app_check_verify_${verify.status}`,
    };
  }
  return {
    ok: true,
    appId: data.appId || data.token?.app_id || null,
    alreadyConsumed: !!data.alreadyConsumed,
  };
}

/** Enforce or monitor based on APP_CHECK_ENFORCE env. */
export async function requireAppCheck(req) {
  const enforce =
    process.env.APP_CHECK_ENFORCE === "1" ||
    process.env.APP_CHECK_ENFORCE === "true" ||
    process.env.FIREBASE_APP_CHECK_ENFORCE === "1";
  const header =
    req.headers?.["x-firebase-appcheck"] ||
    req.headers?.["X-Firebase-AppCheck"] ||
    "";
  if (!header) {
    if (enforce) return { ok: false, error: "App Check token required" };
    return { ok: true, skipped: true };
  }
  const result = await verifyAppCheckToken(String(header));
  if (!result.ok && enforce) return result;
  if (!result.ok && !enforce) return { ok: true, monitorFail: true, error: result.error };
  return result;
}
