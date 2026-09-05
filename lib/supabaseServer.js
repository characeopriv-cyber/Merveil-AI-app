import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dixfybqlepticyudikuz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9._U9bEobzrQbdHxyu6NiRsvGzzeCmXaEX7HvJZJisSqg";
const COOKIE_NAME = "jx_at";
const REFRESH_COOKIE_NAME = "jx_rt";

export function anonClient() { return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } }); }
export function userClient(accessToken) { return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false }, global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {} }); }
export function parseCookies(req) { const header = req.headers?.cookie || ""; const out = {}; header.split(";").forEach((part) => { const idx = part.indexOf("="); if (idx === -1) return; const k = part.slice(0, idx).trim(); const v = part.slice(idx + 1).trim(); if (k) out[k] = decodeURIComponent(v); }); return out; }
export function getAccessToken(req) { return parseCookies(req)[COOKIE_NAME] || null; }
export function getRefreshToken(req) { return parseCookies(req)[REFRESH_COOKIE_NAME] || null; }

// Session cookies are intentionally host-only. A cookie scoped to .junction.technology
// is not sent to Vercel's *.vercel.app deployment host, which breaks authenticated
// API calls when production is tested through a Vercel deployment URL. Host-only
// Secure HttpOnly cookies work on both the custom production domain and Vercel hosts
// without widening the cookie to unrelated subdomains.
function cookieString(name, value, maxAgeSeconds) {
  const isProd = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  const parts = [`${name}=${encodeURIComponent(value)}`, "Path=/", "HttpOnly", `Max-Age=${maxAgeSeconds}`, "SameSite=Lax"];
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
  res.setHeader("Set-Cookie", [`${COOKIE_NAME}=; ${base}${secure}`, `${REFRESH_COOKIE_NAME}=; ${base}${secure}`]);
}

// JWT decoding is retained only for correlation/debugging. It is NEVER an authentication decision.
export function decodeJwtPayload(token) { if (!token || typeof token !== "string") return null; try { const parts = token.split("."); if (parts.length < 2) return null; return JSON.parse(Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")); } catch { return null; } }
export function decodeJwtSub(token) { return decodeJwtPayload(token)?.sub || null; }

// Refresh-token coordination prevents concurrent refresh requests from invalidating each other's rotation.
// There is deliberately NO in-memory user/session cache keyed by an unverified JWT subject.
const refreshInFlight = new Map();
function refreshSessionOnce(refreshToken) { if (refreshInFlight.has(refreshToken)) return refreshInFlight.get(refreshToken); const promise = anonClient().auth.refreshSession({ refresh_token: refreshToken }).finally(() => { setTimeout(() => refreshInFlight.delete(refreshToken), 5000); }); refreshInFlight.set(refreshToken, promise); return promise; }

/**
 * Resolve an authenticated citizen.
 * Only Supabase Auth getUser() or a successful refresh may establish identity.
 * An expired, malformed, forged, or otherwise unverified JWT payload is never sufficient.
 */
export async function getSession(req, res) {
  const token = getAccessToken(req);
  const refreshToken = getRefreshToken(req);

  if (token) {
    try {
      const { data, error } = await userClient(token).auth.getUser(token);
      if (!error && data?.user) return { token, user: data.user, authenticated: true };
    } catch {}
  }

  // The only recovery path for an invalid/expired access token is the real HttpOnly refresh token.
  if (refreshToken) {
    try {
      const { data: refreshed, error: refreshErr } = await refreshSessionOnce(refreshToken);
      if (!refreshErr && refreshed?.session && refreshed?.user?.id) {
        const access = refreshed.session.access_token;
        const refresh = refreshed.session.refresh_token;
        const u = refreshed.user;
        if (res) setSessionCookie(res, access, refresh);
        return { token: access, user: u, authenticated: true, refreshed: true };
      }
    } catch {}
  }

  return { token: null, user: null, jwtSub: null, authenticated: false };
}

export function sendJson(res, status, body) { return res.status(status).setHeader("Content-Type", "application/json").end(JSON.stringify(body)); }
export function junctionIdFor(uuid) { return "JX-" + uuid.replace(/-/g, "").slice(0, 7).toUpperCase(); }
