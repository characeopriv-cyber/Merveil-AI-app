import { createClient } from "@supabase/supabase-js";

// The Supabase URL + anon key are safe to ship in server code (and even
// client code) — they are public identifiers, not secrets. Every table
// they can touch is protected by Postgres Row Level Security, and writes
// only succeed when the request is scoped to a real, signed-in user's
// access token (see userClient() below).
const SUPABASE_URL = "https://dixfybqlepticyudikuz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpeGZ5YnFsZXB0aWN5dWRpa3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNDM2NzQsImV4cCI6MjA5OTcxOTY3NH0._U9bEobzrQbdHxyu6NiRsvGzzeCmXaEX7HvJZJisSqg";

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
  // Share session across apex + www so citizens are not bounced to
  // "Sign in again" when they land on junction.technology vs www.
  if (isProd) {
    parts.push("Secure");
    parts.push("Domain=.junction.technology");
  }
  return parts.join("; ");
}

// Facebook-style long session: ~90 days. Access token still rotates hourly
// via getSession() refresh; the refresh cookie keeps the citizen signed in.
export function setSessionCookie(res, accessToken, refreshToken, maxAgeSeconds = 60 * 60 * 24 * 90) {
  const cookies = [cookieString(COOKIE_NAME, accessToken, maxAgeSeconds)];
  if (refreshToken) cookies.push(cookieString(REFRESH_COOKIE_NAME, refreshToken, maxAgeSeconds));
  // Vercel / Node: array form sets multiple Set-Cookie headers correctly
  res.setHeader("Set-Cookie", cookies);
}

export function clearSessionCookie(res) {
  const isProd = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  const base = "Path=/; HttpOnly; Max-Age=0; SameSite=Lax";
  const secure = isProd ? "; Secure" : "";
  const domain = isProd ? "; Domain=.junction.technology" : "";
  // Clear both host-only and domain cookies (migration from pre-Domain era)
  res.setHeader("Set-Cookie", [
    `${COOKIE_NAME}=; ${base}${secure}`,
    `${REFRESH_COOKIE_NAME}=; ${base}${secure}`,
    `${COOKIE_NAME}=; ${base}${secure}${domain}`,
    `${REFRESH_COOKIE_NAME}=; ${base}${secure}${domain}`,
  ]);
}

// Decode JWT payload without verifying signature — used only to recover
// user id during a refresh-token race so we can reuse a session that
// another concurrent request already rotated successfully.
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

// Cross-request session cache within a warm serverless instance.
// When N parallel API calls all try to rotate the same single-use refresh
// token, only the first succeeds. The rest used to return "signed out".
// We remember the winner for 2 minutes so losers can adopt the new pair.
const refreshInFlight = new Map();
const recentSessionsByUser = new Map(); // userId -> { accessToken, refreshToken, user, at }

function rememberSession(userId, accessToken, refreshToken, user) {
  if (!userId || !accessToken) return;
  recentSessionsByUser.set(String(userId), {
    accessToken,
    refreshToken: refreshToken || null,
    user: user || { id: userId },
    at: Date.now(),
  });
}

function getRecentSession(userId) {
  if (!userId) return null;
  const s = recentSessionsByUser.get(String(userId));
  if (!s) return null;
  // 5 minutes — covers parallel API bursts after access-token expiry
  if (Date.now() - s.at > 5 * 60 * 1000) {
    recentSessionsByUser.delete(String(userId));
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
      // Keep the promise briefly so late arrivals still share the result
      setTimeout(() => refreshInFlight.delete(refreshToken), 5000);
    });
  refreshInFlight.set(refreshToken, promise);
  return promise;
}

/**
 * Resolves the calling user from session cookies.
 * Returns { token, user }. Never clears cookies on a refresh race.
 */
export async function getSession(req, res) {
  const token = getAccessToken(req);
  const refreshToken = getRefreshToken(req);
  const jwtSub = token ? decodeJwtSub(token) : null;

  // 1) Access token still valid
  if (token) {
    try {
      const client = userClient(token);
      const { data, error } = await client.auth.getUser(token);
      if (!error && data?.user) {
        rememberSession(data.user.id, token, refreshToken, data.user);
        return { token, user: data.user };
      }
    } catch {
      /* fall through to refresh */
    }
  }

  // 2) Another concurrent request on this instance already rotated for this user
  if (jwtSub) {
    const recent = getRecentSession(jwtSub);
    if (recent?.accessToken) {
      if (res && recent.refreshToken) {
        setSessionCookie(res, recent.accessToken, recent.refreshToken);
      }
      return { token: recent.accessToken, user: recent.user };
    }
  }

  // 3) Rotate refresh token (de-duped in-flight)
  if (refreshToken) {
    try {
      const { data: refreshed, error: refreshErr } = await refreshSessionOnce(refreshToken);
      if (!refreshErr && refreshed?.session) {
        const access = refreshed.session.access_token;
        const refresh = refreshed.session.refresh_token;
        const u = refreshed.user || (jwtSub ? { id: jwtSub } : null);
        if (u?.id) rememberSession(u.id, access, refresh, u);
        if (res) setSessionCookie(res, access, refresh);
        return { token: access, user: u };
      }
      // Refresh failed (often "already used") — check race cache again
      const sub = jwtSub || decodeJwtSub(token);
      if (sub) {
        const recent = getRecentSession(sub);
        if (recent?.accessToken) {
          if (res && recent.refreshToken) {
            setSessionCookie(res, recent.accessToken, recent.refreshToken);
          }
          return { token: recent.accessToken, user: recent.user };
        }
      }
    } catch {
      /* fall through */
    }
  }

  // 4) Last resort: expired access JWT still names a user. Do NOT invent a
  //    token — return user:null for write paths that need a live token —
  //    but always expose jwtSub so connections/calls/directory can authorize
  //    via service role without 401-ing a still-signed-in citizen.
  const finalSub = jwtSub || (token ? decodeJwtSub(token) : null) || (refreshToken ? null : null);
  return { token: null, user: null, jwtSub: finalSub || null };
}

export function sendJson(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json").end(JSON.stringify(body));
}

export function junctionIdFor(uuid) {
  return "JX-" + uuid.replace(/-/g, "").slice(0, 7).toUpperCase();
}
