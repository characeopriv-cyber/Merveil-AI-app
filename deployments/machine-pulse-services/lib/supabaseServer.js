import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dixfybqlepticyudikuz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpeGZ5YnFsZXB0aWN5dWRpa3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNDM2NzQsImV4cCI6MjA5OTcxOTY3NH0._U9bEobzrQbdHxyu6NiRsvGzzeCmXaEX7HvJZJisSqg";

const COOKIE_NAME = "jx_at";
const REFRESH_COOKIE_NAME = "jx_rt";

export function anonClient() { return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } }); }
export function userClient(accessToken) { return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false }, global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {} }); }
export function parseCookies(req) { const header = req.headers?.cookie || ""; const out = {}; header.split(";").forEach((part) => { const idx = part.indexOf("="); if (idx === -1) return; const k = part.slice(0, idx).trim(); const v = part.slice(idx + 1).trim(); if (k) out[k] = decodeURIComponent(v); }); return out; }
export function getAccessToken(req) {
  if (req?.__merveilAuthChecked && !req.__merveilAuthenticated) return null;
  try {
    const h = req.headers?.authorization || req.headers?.Authorization || "";
    if (typeof h === "string" && h.toLowerCase().startsWith("bearer ")) {
      const t = h.slice(7).trim();
      if (t) return t;
    }
  } catch {}
  return parseCookies(req)[COOKIE_NAME] || null;
}
export function getRefreshToken(req) { return parseCookies(req)[REFRESH_COOKIE_NAME] || null; }
function cookieString(name, value, maxAgeSeconds) { const isProd = process.env.VERCEL === "1" || process.env.NODE_ENV === "production"; const parts = [`${name}=${encodeURIComponent(value)}`, "Path=/", "HttpOnly", `Max-Age=${maxAgeSeconds}`, "SameSite=Lax"]; if (isProd) { parts.push("Secure"); parts.push("Domain=.junction.technology"); } return parts.join("; "); }
export function setSessionCookie(res, accessToken, refreshToken, maxAgeSeconds = 60 * 60 * 24 * 90) { const cookies = [cookieString(COOKIE_NAME, accessToken, maxAgeSeconds)]; if (refreshToken) cookies.push(cookieString(REFRESH_COOKIE_NAME, refreshToken, maxAgeSeconds)); res.setHeader("Set-Cookie", cookies); }
export function clearSessionCookie(res) { const isProd = process.env.VERCEL === "1" || process.env.NODE_ENV === "production"; const base = "Path=/; HttpOnly; Max-Age=0; SameSite=Lax"; const secure = isProd ? "; Secure" : ""; const domain = isProd ? "; Domain=.junction.technology" : ""; res.setHeader("Set-Cookie", [`${COOKIE_NAME}=; ${base}${secure}`, `${REFRESH_COOKIE_NAME}=; ${base}${secure}`, `${COOKIE_NAME}=; ${base}${secure}${domain}`, `${REFRESH_COOKIE_NAME}=; ${base}${secure}${domain}`]); }
export function decodeJwtPayload(token) { if (!token || typeof token !== "string") return null; try { const parts = token.split("."); if (parts.length < 2) return null; const json = Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"); return JSON.parse(json); } catch { return null; } }
export function decodeJwtSub(token) { return decodeJwtPayload(token)?.sub || null; }
const refreshInFlight = new Map();
const recentSessionsByUser = new Map();
function rememberSession(userId, accessToken, refreshToken, user) { if (!userId || !accessToken) return; recentSessionsByUser.set(String(userId), { accessToken, refreshToken: refreshToken || null, user: user || { id: userId }, at: Date.now() }); }
function getRecentSession(userId) { if (!userId) return null; const s = recentSessionsByUser.get(String(userId)); if (!s) return null; if (Date.now() - s.at > 5 * 60 * 1000) { recentSessionsByUser.delete(String(userId)); return null; } return s; }
function refreshSessionOnce(refreshToken) { if (refreshInFlight.has(refreshToken)) return refreshInFlight.get(refreshToken); const anon = anonClient(); const promise = anon.auth.refreshSession({ refresh_token: refreshToken }).finally(() => { setTimeout(() => refreshInFlight.delete(refreshToken), 5000); }); refreshInFlight.set(refreshToken, promise); return promise; }
export async function getSession(req, res) {
  const token = getAccessToken(req);
  const refreshToken = getRefreshToken(req);
  const jwtSub = token ? decodeJwtSub(token) : null;
  const cookieToken = parseCookies(req)[COOKIE_NAME] || null;
  const tokenFromAuthorization = token && token !== cookieToken;
  if (token) {
    try {
      const client = userClient(token);
      const { data, error } = await client.auth.getUser(token);
      if (!error && data?.user) {
        if (res && tokenFromAuthorization) setSessionCookie(res, token, refreshToken || null);
        req.__merveilAuthChecked = true;
        req.__merveilAuthenticated = true;
        rememberSession(data.user.id, token, refreshToken, data.user);
        return { token, user: data.user };
      }
    } catch {}
  }
  if (jwtSub) {
    const recent = getRecentSession(jwtSub);
    if (recent?.accessToken) {
      if (res && recent.refreshToken) setSessionCookie(res, recent.accessToken, recent.refreshToken);
      req.__merveilAuthChecked = true;
      req.__merveilAuthenticated = true;
      return { token: recent.accessToken, user: recent.user };
    }
  }
  if (refreshToken) {
    try {
      const { data: refreshed, error: refreshErr } = await refreshSessionOnce(refreshToken);
      if (!refreshErr && refreshed?.session) {
        const access = refreshed.session.access_token;
        const refresh = refreshed.session.refresh_token;
        const u = refreshed.user || (jwtSub ? { id: jwtSub } : null);
        if (u?.id) rememberSession(u.id, access, refresh, u);
        if (res) setSessionCookie(res, access, refresh);
        req.__merveilAuthChecked = true;
        req.__merveilAuthenticated = true;
        return { token: access, user: u };
      }
      const sub = jwtSub || decodeJwtSub(token);
      if (sub) {
        const recent = getRecentSession(sub);
        if (recent?.accessToken) {
          if (res && recent.refreshToken) setSessionCookie(res, recent.accessToken, recent.refreshToken);
          req.__merveilAuthChecked = true;
          req.__merveilAuthenticated = true;
          return { token: recent.accessToken, user: recent.user };
        }
      }
    } catch {}
  }
  req.__merveilAuthChecked = true;
  req.__merveilAuthenticated = false;
  return { token: null, user: null, jwtSub: null };
}
export function sendJson(res, status, body) { res.status(status).setHeader("Content-Type", "application/json").end(JSON.stringify(body)); }
export function junctionIdFor(uuid) { return "JX-" + uuid.replace(/-/g, "").slice(0, 7).toUpperCase(); }
