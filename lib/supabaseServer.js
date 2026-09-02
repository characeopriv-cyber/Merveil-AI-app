import { createClient } from "@supabase/supabase-js";

// The Supabase URL + publishable key are safe to ship in server code (and even
// client code) — they are public identifiers, not secrets. Every table
// they can touch is protected by Postgres Row Level Security, and writes
// only succeed when the request is scoped to a real, signed-in user's
// access token (see userClient() below).
const SUPABASE_URL = "https://dixfybqlepticyudikuz.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_zOtxwZ1q_OCpiTunktzypw_14pQnQOh";

const COOKIE_NAME = "jx_at";
const REFRESH_COOKIE_NAME = "jx_rt";

export function anonClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function userClient(accessToken) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : {},
  });
}

export function parseCookies(req) {
  const header = req.headers?.cookie || "";
  const out = {};
  header.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

export function getAccessToken(req) {
  return parseCookies(req)[COOKIE_NAME] || null;
}

export function getRefreshToken(req) {
  return parseCookies(req)[REFRESH_COOKIE_NAME] || null;
}

function cookieString(name, value, maxAgeSeconds) {
  const isProd = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    `Max-Age=${maxAgeSeconds}`,
    "SameSite=Lax",
  ];
  if (isProd) parts.push("Secure");
  return parts.join("; ");
}

export function setSessionCookie(res, accessToken, refreshToken, maxAgeSeconds = 60 * 60 * 24 * 90) {
  const cookies = [cookieString(COOKIE_NAME, accessToken, maxAgeSeconds)];
  if (refreshToken) cookies.push(cookieString(REFRESH_COOKIE_NAME, refreshToken, maxAgeSeconds));
  res.setHeader("Set-Cookie", cookies);
}

export function clearSessionCookie(res) {
  const isProd = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  const base = "Path=/; HttpOnly; Max-Age=0; SameSite=Lax";
  const secure = isProd ? "; Secure" : "";
  res.setHeader("Set-Cookie", [
    `${COOKIE_NAME}=; ${base}${secure}`,
    `${REFRESH_COOKIE_NAME}=; ${base}${secure}`,
  ]);
}

export function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const json = Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function decodeJwtSub(token) {
  const payload = decodeJwtPayload(token);
  return payload?.sub || null;
}

// Short-lived recovery cache keyed by the exact access token that was already
// verified by Supabase Auth. Never key this cache by an unverified JWT subject:
// a caller can forge a JWT payload even when they cannot forge its signature.
const refreshInFlight = new Map();
const recentSessionsByToken = new Map();

function rememberSession(accessToken, refreshToken, user) {
  if (!accessToken || !user?.id) return;
  recentSessionsByToken.set(String(accessToken), {
    accessToken,
    refreshToken: refreshToken || null,
    user,
    at: Date.now(),
  });
}

function getRecentSession(accessToken) {
  if (!accessToken) return null;
  const s = recentSessionsByToken.get(String(accessToken));
  if (!s) return null;
  if (Date.now() - s.at > 120000) {
    recentSessionsByToken.delete(String(accessToken));
    return null;
  }
  return s;
}

function refreshSessionOnce(refreshToken) {
  if (refreshInFlight.has(refreshToken)) return refreshInFlight.get(refreshToken);
  const anon = anonClient();
  const promise = anon.auth
    .refreshSession({ refresh_token: refreshToken })
    .finally(() => {
      setTimeout(() => refreshInFlight.delete(refreshToken), 5000);
    });
  refreshInFlight.set(refreshToken, promise);
  return promise;
}

export async function getSession(req, res) {
  const token = getAccessToken(req);
  const refreshToken = getRefreshToken(req);

  // Primary path: ask Supabase Auth to verify the access token. This is the
  // only path that establishes a fresh trusted user identity.
  if (token) {
    try {
      const client = userClient(token);
      const { data, error } = await client.auth.getUser(token);
      if (!error && data?.user) {
        rememberSession(token, refreshToken, data.user);
        return { token, user: data.user };
      }
    } catch {
      /* fall through to short recovery / refresh */
    }

    // Reliability recovery is permitted only for the exact token that was
    // previously verified, never for an arbitrary token sharing its `sub`.
    const recent = getRecentSession(token);
    if (recent?.accessToken) {
      if (res && recent.refreshToken) setSessionCookie(res, recent.accessToken, recent.refreshToken);
      return { token: recent.accessToken, user: recent.user };
    }
  }

  // Refresh path: a valid refresh token can rotate the access/refresh pair.
  if (refreshToken) {
    try {
      const { data: refreshed, error: refreshErr } = await refreshSessionOnce(refreshToken);
      if (!refreshErr && refreshed?.session) {
        const access = refreshed.session.access_token;
        const refresh = refreshed.session.refresh_token;
        const u = refreshed.user || null;
        if (u?.id) rememberSession(access, refresh, u);
        if (res) setSessionCookie(res, access, refresh);
        return { token: access, user: u };
      }
    } catch {
      /* fall through */
    }

    // A refresh token that can no longer be rotated should not leave stale
    // authentication cookies behind. The next request then starts cleanly.
    if (res) clearSessionCookie(res);
  }

  return { token: null, user: null };
}

export function sendJson(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json").end(JSON.stringify(body));
}

export function junctionIdFor(uuid) {
  return "JX-" + uuid.replace(/-/g, "").slice(0, 7).toUpperCase();
}
