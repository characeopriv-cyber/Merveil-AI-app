import { createClient } from "@supabase/supabase-js";

// The Supabase URL + anon key are safe to ship in server code (and even
// client code) — they are public identifiers, not secrets. Every table
// they can touch is protected by Postgres Row Level Security, and writes
// only succeed when the request is scoped to a real, signed-in user's
// access token (see userClient() below). There is no service-role key
// anywhere in this project on purpose.
const SUPABASE_URL = "https://dixfybqlepticyudikuz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpeGZ5YnFsZXB0aWN5dWRpa3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNDM2NzQsImV4cCI6MjA5OTcxOTY3NH0._U9bEobzrQbdHxyu6NiRsvGzzeCmXaEX7HvJZJisSqg";

const COOKIE_NAME = "jx_at";
const REFRESH_COOKIE_NAME = "jx_rt";

// Anonymous client — used for public reads and for signIn/signUp calls
// themselves (which don't need a prior session).
export function anonClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// A client scoped to one signed-in user's access token, so every
// PostgREST call it makes runs with that user's auth.uid() for RLS.
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

// Supabase access tokens expire after ~1 hour. Sessions used to just die
// silently at that point (every write would 401 while the UI still showed
// the user as "logged in", from stale localStorage). Setting both cookies
// here, and refreshing automatically in getSession() below, fixes that.
export function setSessionCookie(res, accessToken, refreshToken, maxAgeSeconds = 60 * 60 * 24 * 30) {
  const cookies = [cookieString(COOKIE_NAME, accessToken, maxAgeSeconds)];
  if (refreshToken) cookies.push(cookieString(REFRESH_COOKIE_NAME, refreshToken, maxAgeSeconds));
  res.setHeader("Set-Cookie", cookies);
}

export function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", [
    `${COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`,
    `${REFRESH_COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`,
  ]);
}

// Resolves the calling user (if any) from the session cookies. Returns
// { token, user, refreshed } — refreshed is a new {accessToken,
// refreshToken} pair the caller (router.js) should re-set as cookies if
// present, since the original access token had expired and was silently
// renewed using the refresh token.
//
// De-dupes concurrent refreshes of the SAME refresh token. On app open
// (or tab focus) the frontend fires a couple dozen requests in parallel
// (session check, profile views, circles, likes, connections, etc). If
// the access token happens to be expired at that moment, every one of
// those requests would otherwise independently call refreshSession()
// with the same refresh token at nearly the same instant. Supabase
// refresh tokens are single-use/rotating, so only the first of those
// racing calls actually succeeds — the rest get an "already used"
// error and the citizen sees a false "session expired", forcing them
// to sign out and back in, even though their session was genuinely
// still valid. Sharing one in-flight refresh across those concurrent
// requests (on the same warm serverless instance) fixes that.
const inFlightRefresh = new Map(); // refreshToken -> Promise<{session,user}|null>
function refreshWithDedupe(refreshToken) {
  const existing = inFlightRefresh.get(refreshToken);
  if (existing) return existing;
  const p = (async () => {
    const anon = anonClient();
    const { data, error } = await anon.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data?.session) return null;
    return { session: data.session, user: data.user };
  })();
  inFlightRefresh.set(refreshToken, p);
  // Clear shortly after settling rather than instantly — covers requests
  // that land a few milliseconds apart rather than perfectly together.
  p.finally(() => setTimeout(() => inFlightRefresh.delete(refreshToken), 3000));
  return p;
}

export async function getSession(req, res) {
  const token = getAccessToken(req);
  if (!token) return { token: null, user: null };
  const client = userClient(token);
  const { data, error } = await client.auth.getUser(token);
  if (!error && data?.user) return { token, user: data.user };

  // Access token invalid/expired — try the refresh token before giving up.
  const refreshToken = getRefreshToken(req);
  if (!refreshToken) return { token: null, user: null };
  const refreshed = await refreshWithDedupe(refreshToken);
  if (!refreshed) return { token: null, user: null };

  if (res) setSessionCookie(res, refreshed.session.access_token, refreshed.session.refresh_token);
  return { token: refreshed.session.access_token, user: refreshed.user };
}

export function sendJson(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json").end(JSON.stringify(body));
}

export function junctionIdFor(uuid) {
  return "JX-" + uuid.replace(/-/g, "").slice(0, 7).toUpperCase();
}
