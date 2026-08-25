import formidable from "formidable";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import {
  anonClient,
  userClient,
  getSession,
  setSessionCookie,
  clearSessionCookie,
  sendJson,
  junctionIdFor,
} from "../lib/supabaseServer.js";

// Admin client for account confirmation only — separate from the shared
// lib so this fix doesn't depend on lib/supabaseServer.js also being
// updated. Uses the same service-role key the rest of the backend relies
// on (Supabase's standard env var names).
function adminClient() {
  // Same project URL as lib/supabaseServer.js — this is a public
  // identifier, not a secret (see the comment there), so it's hardcoded
  // here too rather than depending on a Vercel env var that may not be
  // set under any of the names this used to check.
  const url = "https://dixfybqlepticyudikuz.supabase.co";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE;
  if (!key) {
    // Fail with something a human can actually act on instead of the raw
    // Supabase SDK error ("supabaseUrl is required") that gave no clue
    // which variable was missing.
    throw new Error(
      "Server misconfiguration: missing SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables."
    );
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// ================================================================
// ADMIN IDENTITY & RBAC — completely separate from citizen auth.
// Citizens authenticate via Supabase Auth (getSession/anonClient/
// userClient above). Admins authenticate here, against the
// admin_users/admin_roles/admin_sessions tables, with their own
// cookie, their own token, their own permission model. Nothing in
// this block ever touches or trusts a citizen session, and nothing
// in the citizen-facing routes below ever grants admin access.
//
// Passwords/session tokens use Node's built-in scrypt + timing-safe
// compare — no new npm dependency (bcrypt) needed for this.
// ================================================================
const ADMIN_COOKIE = "merveil_admin_session";
const ADMIN_SESSION_HOURS = 12;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return crypto.timingSafeEqual(candidate, expected);
}

function newToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function newActivationCode() {
  // MV-XXXX-XXXX-XXXX — 3x2 random bytes = 48 bits of entropy, combined
  // with the rate limit on the activate action below. One-time, cleared
  // immediately on use, 72h expiry.
  const part = () => crypto.randomBytes(2).toString("hex").toUpperCase();
  return `MV-${part()}-${part()}-${part()}`;
}

function parseCookies(req) {
  const raw = req.headers.cookie || "";
  const out = {};
  raw.split(";").forEach((p) => {
    const idx = p.indexOf("=");
    if (idx === -1) return;
    out[p.slice(0, idx).trim()] = decodeURIComponent(p.slice(idx + 1).trim());
  });
  return out;
}

function setAdminCookie(res, token) {
  const maxAge = ADMIN_SESSION_HOURS * 60 * 60;
  res.setHeader(
    "Set-Cookie",
    `${ADMIN_COOKIE}=${token}; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`
  );
}

function clearAdminCookie(res) {
  res.setHeader("Set-Cookie", `${ADMIN_COOKIE}=; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
}

// Resolves the admin session cookie into { admin, role, permissions } or
// null. Every protected admin-auth/console action calls this first.
async function getAdminSession(req) {
  const cookies = parseCookies(req);
  const token = cookies[ADMIN_COOKIE];
  if (!token) return null;
  const svc = adminClient();
  const tokenHash = hashToken(token);
  const { data: session } = await svc
    .from("admin_sessions")
    .select("id, admin_id, expires_at, revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (!session || session.revoked_at) return null;
  if (new Date(session.expires_at).getTime() < Date.now()) return null;
  const { data: admin } = await svc
    .from("admin_users")
    .select("id, email, name, status, role_id, mfa_enabled")
    .eq("id", session.admin_id)
    .maybeSingle();
  if (!admin || admin.status !== "active") return null;
  const { data: role } = await svc
    .from("admin_roles")
    .select("key, name, permissions")
    .eq("id", admin.role_id)
    .maybeSingle();
  return { admin, sessionId: session.id, role: role?.key, roleName: role?.name, permissions: role?.permissions || [] };
}

function hasPermission(ctx, perm) {
  if (!ctx) return false;
  return ctx.permissions.includes("*") || ctx.permissions.includes(perm);
}

async function writeAdminAudit(adminId, action, { targetType = null, targetId = null, details = null, riskLevel = "low" } = {}) {
  const svc = adminClient();
  await svc.from("admin_audit_log").insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
    risk_level: riskLevel,
  }).catch(() => {});
}

async function logSecurityEvent(userId, eventType, { severity = "info", description = null, metadata = null } = {}) {
  const svc = adminClient();
  await svc.from("security_events").insert({
    user_id: userId,
    event_type: eventType,
    severity,
    description,
    metadata,
  }).catch(() => {});
}

function parseUserAgent(ua) {
  ua = ua || "";
  let os = "Unknown OS";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/iPhone|iPad/i.test(ua)) os = "iOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Mac OS X/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";
  let browser = "Unknown browser";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  const deviceType = /Mobi|Android|iPhone/i.test(ua) ? "mobile" : "desktop";
  return { os, browser, deviceType, deviceName: `${browser} on ${os}` };
}

// Called right after a citizen session is created (login or register).
// Never allowed to block or fail the actual sign-in — this is telemetry
// for the Device & Session Center (doc 2 §19) and Security Center (doc 1
// §14/16), not a gate.
async function recordUserSession(req, userId, sessionToken) {
  try {
    const svc = adminClient();
    const ua = req.headers["user-agent"] || "";
    const { os, browser, deviceType, deviceName } = parseUserAgent(ua);
    const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || null;
    await svc.from("user_sessions").insert({
      user_id: userId,
      session_token_hash: sessionToken ? hashToken(sessionToken) : null,
      device_name: deviceName,
      device_type: deviceType,
      browser,
      os,
      ip,
    });
    await svc.from("security_events").insert({
      user_id: userId,
      event_type: "login",
      severity: "info",
      description: `Signed in from ${deviceName}`,
      ip,
      device_info: { userAgent: ua },
    });
  } catch (e) {
    /* telemetry only — never block a real login over this */
  }
}

// One catch-all function handles every /api/* route this app needs
// (auth, properties, services, conversations, circles, events, people).
// Keeping it as a single function (plus the separate assistant.js) is
// what keeps this project under Vercel Hobby's 12-function cap.
export const config = { api: { bodyParser: false } };

async function readBody(req) {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("application/json")) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString("utf8");
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return null; // multipart handled separately via formidable
}

function randomCircleCode(name) {
  return (
    name.trim().slice(0, 3).toUpperCase() +
    Math.floor(Math.random() * 90 + 10)
  );
}

function ticketCode() {
  return "JX-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

// People naturally type prices with commas ("1,850,000") — plain Number()
// returns NaN for that, which silently became 0 before. This strips
// anything that isn't a digit or minus sign first.
function toNumber(v) {
  if (v == null || v === "") return null;
  const cleaned = String(v).replace(/[^0-9.-]/g, "");
  const n = Number(cleaned);
  return isNaN(n) ? null : n;
}

// Simple abuse guard: no more than 8 login/register attempts per
// identifier (email) in a 10-minute window. Not bulletproof (no IP
// tracking without extra infra), but it stops naive scripted guessing.
async function checkRateLimit(anon, identifier, limit = 8) {
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await anon
    .from("auth_attempts")
    .select("*", { count: "exact", head: true })
    .eq("identifier", identifier)
    .gt("created_at", since);
  await anon.from("auth_attempts").insert({ identifier });
  return (count || 0) < limit;
}

// Shared client-IP extraction — same pattern used for register/admin rate
// limiting, pulled out here so the view-counter gates below (and any
// future caller) don't each re-implement it slightly differently.
function getClientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown").split(",")[0].trim();
}

// Server-side AI usage enforcement — the daily Passport-tier limit
// (Ordinary 10 / Services 25 / Investor effectively unlimited) was
// previously only checked by the frontend before calling this. Anyone
// bypassing the UI could call an AI-backed endpoint directly, unlimited
// times, at real Anthropic API cost. Every endpoint that calls the AI
// must call this first and stop on `allowed: false`.
async function checkAiUsageAllowed(sb, userId) {
  const { data: profile } = await sb.from("profiles").select("passport_tier").eq("id", userId).maybeSingle();
  const tier = profile?.passport_tier || "ordinary";
  const LIMITS = { ordinary: 10, services: 25, investor: 100000 };
  const limit = LIMITS[tier] ?? LIMITS.ordinary;
  const { data } = await sb.from("ai_usage").select("message_count").eq("user_id", userId).eq("usage_date", new Date().toISOString().slice(0, 10)).maybeSingle();
  const used = data?.message_count || 0;
  return { allowed: used < limit, used, limit, tier };
}

function mapProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    bio: row.bio,
    junction_id: row.junction_id,
    avatar_url: row.avatar_url,
    background_id: row.background_id,
    passport_tier: row.passport_tier,
    role_label: row.role_label,
    city: row.city,
    profession: row.profession,
    company_name: row.company_name,
    skills: row.skills || [],
    languages: row.languages || [],
    portfolio_url: row.portfolio_url,
    website_url: row.website_url,
  };
}

// currentUser (post-login/register) is read directly with camelCase keys
// everywhere in the app (currentUser.passportTier, .junctionId, etc.) —
// this mapper matches that, distinct from mapProfile() above which
// matches what the PATCH /people?action=profile response is expected
// to look like (patchUser() in the frontend remaps that one manually).
function mapAuthUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    bio: row.bio,
    junctionId: row.junction_id,
    avatarUrl: row.avatar_url,
    backgroundId: row.background_id,
    passportTier: row.passport_tier,
    roleLabel: row.role_label,
    isAdmin: !!row.is_admin,
    discoverable: row.discoverable !== false,
    country: row.country || null,
    // Professional Passport progressive-completion fields (see
    // passportCompletionOf() in App.jsx) — additive, doesn't change
    // any field already relied on elsewhere.
    city: row.city || null,
    profession: row.profession || null,
    companyName: row.company_name || null,
    accountType: row.account_type || null,
    skills: row.skills || [],
    languages: row.languages || [],
    portfolioUrl: row.portfolio_url || null,
    websiteUrl: row.website_url || null,
  };
}

export default async function handler(req, res) {
  try {
    // Derived straight from the URL rather than req.query.path — the
    // latter only works if this file's name matches character-for-
    // character (including the literal "..."), which is fragile when
    // edited/renamed through a mobile browser. This is robust to that.
    const urlPath = (req.url || "").split("?")[0];
    const segments = urlPath.replace(/^\/?api\/?/, "").split("/").filter(Boolean).map((s) => decodeURIComponent(s));
    const resource = segments[0] || "";
    const method = req.method;
    const { token, user } = await getSession(req, res);
    const sb = token ? userClient(token) : anonClient();

    // ---------------------------------------------------------- /api/auth
    if (resource === "auth") {
      const sub = segments[1];
      const anon = anonClient();

      // GET /api/auth/session — restores currentUser from the real
      // httpOnly session cookie on app load. Previously the frontend's
      // only source of truth for "am I signed in" was a localStorage
      // cache written at sign-in time; if that cache was ever missing,
      // cleared, or out of sync with the actual cookie (different
      // browser profile, cleared site data, a race in the OAuth-bridge
      // effect on first load, etc.) the person had a perfectly valid
      // session server-side but the app didn't know it — so every
      // guarded action (like, comment, chat…) re-prompted Google
      // sign-in even though they were already signed in. This endpoint
      // is the actual source of truth the frontend should check first.
      if (sub === "session" && method === "GET") {
        if (!user) return sendJson(res, 200, { user: null });
        const { data: profile } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
        return sendJson(res, 200, { user: profile ? mapAuthUser(profile) : null });
      }

      if (sub === "login" && method === "POST") {
        const body = await readBody(req);
        let { email, password, phone } = body || {};
        if (!email && phone) {
          const digits = String(phone).replace(/[^0-9]/g, "");
          email = `phone_${digits}@users.junction.technology`;
        }
        if (!email || !password) return sendJson(res, 400, { error: "Phone or email, and password are required." });
        const okRate = await checkRateLimit(anon, email.toLowerCase());
        if (!okRate) return sendJson(res, 429, { error: "Too many attempts — wait a few minutes and try again." });
        const { data, error } = await anon.auth.signInWithPassword({ email, password });
        if (error || !data?.session) {
          return sendJson(res, 401, { error: error?.message || "Invalid email or password." });
        }
        setSessionCookie(res, data.session.access_token, data.session.refresh_token);
        await recordUserSession(req, data.user.id, data.session.access_token);
        const authed = userClient(data.session.access_token);
        let { data: profile } = await authed.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
        if (!profile) {
          const { count: existingCount } = await anon.from("profiles").select("*", { count: "exact", head: true });
          const { data: created } = await authed
            .from("profiles")
            .insert({
              id: data.user.id,
              email: email.startsWith("phone_") ? null : email,
              name: email.startsWith("phone_") ? "Merveil Member" : email.split("@")[0],
              junction_id: junctionIdFor(data.user.id),
              passport_tier: "ordinary",
              is_admin: !existingCount || existingCount === 0,
            })
            .select()
            .maybeSingle();
          profile = created;
        }
        return sendJson(res, 200, { user: mapAuthUser(profile) });
      }

      if (sub === "oauth-bridge" && method === "POST") {
        // Google/Apple sign-in happens client-side via Supabase directly
        // (that's how OAuth redirects work) — this exchanges that session
        // for our own cookie, so every other endpoint keeps working
        // exactly as it does for phone/email login. Same profile-bootstrap
        // logic as /api/auth/login above, just triggered by a token pair
        // instead of a password.
        const body = await readBody(req);
        const { access_token, refresh_token } = body || {};
        if (!access_token || !refresh_token) return sendJson(res, 400, { error: "Missing OAuth session." });
        const authed = userClient(access_token);
        const { data: authData, error: userErr } = await authed.auth.getUser();
        if (userErr || !authData?.user) return sendJson(res, 401, { error: "Invalid or expired OAuth session." });
        const u = authData.user;
        setSessionCookie(res, access_token, refresh_token);
        await recordUserSession(req, u.id, access_token);
        let { data: profile } = await authed.from("profiles").select("*").eq("id", u.id).maybeSingle();
        if (!profile) {
          const { count: existingCount } = await anon.from("profiles").select("*", { count: "exact", head: true });
          const displayName = u.user_metadata?.full_name || u.user_metadata?.name || (u.email ? u.email.split("@")[0] : "Merveil Member");
          const { data: created } = await authed
            .from("profiles")
            .insert({
              id: u.id,
              email: u.email || null,
              name: displayName,
              avatar_url: u.user_metadata?.avatar_url || u.user_metadata?.picture || null,
              junction_id: junctionIdFor(u.id),
              passport_tier: "ordinary",
              is_admin: !existingCount || existingCount === 0,
            })
            .select()
            .maybeSingle();
          profile = created;
        }
        return sendJson(res, 200, { user: mapAuthUser(profile) });
      }

      if (sub === "login" && method === "DELETE") {
        clearSessionCookie(res);
        return sendJson(res, 200, { ok: true });
      }

      if (sub === "register" && method === "POST") {
        const body = await readBody(req);
        let { email, password, name, country, age, accountType, companyName, phone, website: hp } = body || {};
        const usingPhone = !email && !!phone;

        // Honeypot: this field is invisible in the real form, so only a
        // bot that auto-fills every input would ever populate it. Reply
        // with a generic success-shaped error rather than explaining why,
        // so the bot doesn't learn what tripped it.
        if (hp) return sendJson(res, 400, { error: "Registration failed. Please try again." });

        // Per-IP registration limit — the per-email limit below only
        // stops repeated attempts on ONE address; this stops one source
        // spinning up many different fake accounts (mass signup abuse).
        const clientIp = String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown").split(",")[0].trim();
        const okIpRate = await checkRateLimit(anon, `register_ip_${clientIp}`);
        if (!okIpRate) return sendJson(res, 429, { error: "Too many accounts created from this connection — wait a few minutes and try again." });

        if (usingPhone) {
          // Phone-based signup: no confirmation step of any kind, immediate
          // login, as requested — a reliable stopgap until proper phone/SMS
          // verification is set up with an engineer. Internally this still
          // rides on Supabase's email/password auth (the mechanism already
          // proven to work), using a synthetic address derived from the
          // phone number so no real email or confirmation is ever involved.
          const digits = String(phone).replace(/[^0-9]/g, "");
          if (digits.length < 8) return sendJson(res, 400, { error: "Enter a valid phone number." });
          email = `phone_${digits}@users.junction.technology`;
        }

        if (!email || !password || !name) return sendJson(res, 400, { error: "Name, phone or email, and password are required." });
        if (!country) return sendJson(res, 400, { error: "Select your country to continue." });
        if (!age || Number(age) < 18) return sendJson(res, 400, { error: "You must be 18 or older to register." });
        if ((accountType === "agent" || accountType === "company") && !companyName) {
          return sendJson(res, 400, { error: "Company name is required for agent/company accounts." });
        }
        const okRate = await checkRateLimit(anon, email.toLowerCase());
        if (!okRate) return sendJson(res, 429, { error: "Too many attempts — wait a few minutes and try again." });
        const { data, error } = await anon.auth.signUp({
          email,
          password,
          options: usingPhone ? undefined : { emailRedirectTo: "https://www.junction.technology" },
        });
        if (error) {
          if (usingPhone && /registered/i.test(error.message)) {
            return sendJson(res, 400, { error: "That phone number is already registered — try signing in instead." });
          }
          return sendJson(res, 400, { error: error.message });
        }

        let session = data.session;
        let userId = data.user?.id;

        if (!session) {
          // "Confirm email" is enabled on the project, which normally means
          // waiting for an emailed link — but that link depends on a Supabase
          // dashboard "Redirect URLs" setting we can't change from here, and
          // it's been landing on a broken default. Rather than send a user
          // into a dead end on their very first action in the app, confirm
          // the account immediately server-side (admin API) and sign them in
          // directly. No email link is involved in the flow at all now.
          try {
            const admin = adminClient();
            await admin.auth.admin.updateUserById(userId, { email_confirm: true });
            const { data: signInData, error: signInErr } = await anon.auth.signInWithPassword({ email, password });
            if (signInErr || !signInData?.session) {
              return sendJson(res, 400, { error: "Account created — please sign in." });
            }
            session = signInData.session;
            userId = signInData.user.id;
          } catch (e) {
            return sendJson(res, 400, {
              error: "Account created — check your inbox to confirm your email, then sign in.",
            });
          }
        }

        setSessionCookie(res, session.access_token, session.refresh_token);
        await recordUserSession(req, userId, session.access_token);
        const authed = userClient(session.access_token);
        const { count: existingCount } = await anon.from("profiles").select("*", { count: "exact", head: true });
        const isFirstUser = !existingCount || existingCount === 0;
        const { data: profile, error: profileErr } = await authed
          .from("profiles")
          .insert({
            id: userId,
            email: usingPhone ? null : email,
            name,
            junction_id: junctionIdFor(userId),
            passport_tier: "ordinary",
            is_admin: isFirstUser,
            country,
            age: Number(age),
            account_type: accountType || "individual",
            company_name: companyName || null,
            phone: phone || null,
          })
          .select()
          .maybeSingle();
        if (profileErr) return sendJson(res, 400, { error: profileErr.message });

        // Persistent welcome message from Merveil AI — not just a toast, so
        // there's a permanent, checkable record that every user was told
        // this is a pre-launch test phase.
        try {
          const admin = adminClient();
          const MERVEIL_AI_ID = "00000000-0000-0000-0000-000000000001";
          const { data: aiProfile } = await admin.from("profiles").select("id").eq("id", MERVEIL_AI_ID).maybeSingle();
          if (!aiProfile) {
            await admin.from("profiles").insert({
              id: MERVEIL_AI_ID,
              email: "ai@junction.technology",
              name: "Merveil AI",
              junction_id: "JCT-AI-0001",
              passport_tier: "investor",
              is_admin: false,
              discoverable: false,
            });
          }
          const { data: convo } = await admin
            .from("conversations")
            .insert({ participant_ids: [userId, MERVEIL_AI_ID] })
            .select()
            .maybeSingle();
          if (convo?.id) {
            await admin.from("messages").insert({
              conversation_id: convo.id,
              sender_id: MERVEIL_AI_ID,
              body:
                `Welcome to Merveil, ${name}! I'm Merveil AI, here to help you find property, ` +
                `connect with verified people, and get things done across the platform. Explore Pulse, ` +
                `Connect, Souk, Work, and Passport — everything is live and yours to try.\n\n` +
                `A quick note: Merveil is currently in test phase #001, ahead of our official public ` +
                `launch. Some features are still being refined. Enjoy exploring, and thank you for being ` +
                `one of our first citizens.`,
            });
          }
        } catch (e) {
          // Never block a successful signup on the welcome message.
        }

        return sendJson(res, 200, { user: mapAuthUser(profile) });
      }

      return sendJson(res, 404, { error: "Not found" });
    }

    // ---------------------------------------------------- /api/properties
    if (resource === "properties") {
      const action = req.query.action;

      if (method === "POST" && action === "inventory-ai-parse") {
        if (!user) return sendJson(res, 401, { error: "Sign in required." });
        const usage = await checkAiUsageAllowed(sb, user.id);
        if (!usage.allowed) {
          return sendJson(res, 429, { error: `Daily Merveil AI limit reached (${usage.used}/${usage.limit}) for your Passport tier. Try again tomorrow or upgrade your Passport.` });
        }
        const form = formidable({ maxFileSize: 20 * 1024 * 1024 });
        const [, files] = await form.parse(req);
        const file = files.file?.[0];
        if (!file) return sendJson(res, 400, { error: "No file uploaded." });

        const mimetype = file.mimetype || "";
        const filename = (file.originalFilename || "").toLowerCase();
        const fs = await import("fs");
        const buffer = fs.readFileSync(file.filepath);

        const isXlsx = mimetype.includes("spreadsheet") || mimetype.includes("excel") || /\.(xlsx|xls)$/.test(filename);
        const isDocx = mimetype.includes("wordprocessingml") || mimetype === "application/msword" || /\.(docx|doc)$/.test(filename);

        let contentBlock;
        if (mimetype === "application/pdf") {
          contentBlock = { type: "document", source: { type: "base64", media_type: "application/pdf", data: buffer.toString("base64") } };
        } else if (mimetype.startsWith("image/")) {
          contentBlock = { type: "image", source: { type: "base64", media_type: mimetype, data: buffer.toString("base64") } };
        } else if (isXlsx) {
          // Claude's document API doesn't read Excel natively — extract the
          // sheet contents to plain text first using the xlsx package (must
          // be added as a project dependency: npm install xlsx).
          try {
            const XLSX = await import("xlsx");
            const wb = XLSX.read(buffer, { type: "buffer" });
            const sheetsText = wb.SheetNames.map((name) => {
              const sheet = wb.Sheets[name];
              return `--- Sheet: ${name} ---\n${XLSX.utils.sheet_to_csv(sheet)}`;
            }).join("\n\n");
            contentBlock = { type: "text", text: `Spreadsheet contents:\n\n${sheetsText}` };
          } catch (e) {
            return sendJson(res, 500, { error: "Excel reading isn't set up on the server yet — the 'xlsx' package needs to be added as a dependency." });
          }
        } else if (isDocx) {
          // Same situation for Word docs — extract to plain text using
          // mammoth (must be added as a project dependency: npm install mammoth).
          try {
            const mammoth = await import("mammoth");
            const result = await mammoth.extractRawText({ buffer });
            contentBlock = { type: "text", text: `Document contents:\n\n${result.value}` };
          } catch (e) {
            return sendJson(res, 500, { error: "Word doc reading isn't set up on the server yet — the 'mammoth' package needs to be added as a dependency." });
          }
        } else {
          return sendJson(res, 400, {
            error: "Merveil AI can read PDFs, Excel, Word docs, and photos/scans of a rent roll or sale sheet.",
          });
        }

        if (!process.env.ANTHROPIC_API_KEY) {
          return sendJson(res, 500, { error: "AI document reading isn't configured on the server yet (missing ANTHROPIC_API_KEY)." });
        }

        const prompt =
          "You are Merveil's inventory analyst. This document is a rent roll, sale sheet, or property/unit list — " +
          "possibly messy, handwritten, or a photo of a printed page. Extract every unit or property row you can find " +
          "into a JSON array. For each unit, include ONLY these fields, using null for anything not present or not " +
          "legible: unitNumber, unitType (e.g. Studio, 1BR, 2BR, Office, Villa, Retail), price (number, no currency " +
          "symbols or commas), bedrooms (number), bathrooms (number), sqft (number), floor, status (\"available\" or " +
          "\"occupied\" — infer from a tenant name being present), tenantName, leaseStart (YYYY-MM-DD if present), " +
          "leaseEnd (YYYY-MM-DD if present), lastRenewalType. " +
          "Respond with ONLY the raw JSON array — no markdown, no code fences, no explanation, no surrounding text.";

        let aiRes;
        try {
          aiRes = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "x-api-key": process.env.ANTHROPIC_API_KEY,
              "anthropic-version": "2023-06-01",
              "content-type": "application/json",
            },
            body: JSON.stringify({
              model: "claude-sonnet-4-6",
              max_tokens: 4096,
              messages: [{ role: "user", content: [contentBlock, { type: "text", text: prompt }] }],
            }),
          });
        } catch (e) {
          return sendJson(res, 502, { error: "Couldn't reach Merveil AI — try again in a moment." });
        }
        const aiData = await aiRes.json();
        if (!aiRes.ok) {
          return sendJson(res, 502, { error: aiData?.error?.message || "Merveil AI couldn't read this file." });
        }
        const text = (aiData.content || []).find((c) => c.type === "text")?.text || "";
        let units;
        try {
          const cleaned = text.replace(/```json|```/g, "").trim();
          units = JSON.parse(cleaned);
          if (!Array.isArray(units)) throw new Error("not an array");
        } catch (e) {
          return sendJson(res, 502, {
            error: "Merveil AI read the file but couldn't structure it into units — try a clearer scan, or a CSV export instead.",
          });
        }
        // Fill in occupancyStatus from status/tenantName the same way manual CSV rows are, so
        // downstream lease-intelligence logic (vacancy/renewal stats) works identically either way.
        units = units.map((u) => ({ ...u, occupancyStatus: u.tenantName ? "occupied" : "vacant" }));
        await sb.rpc("increment_ai_usage", { uid: user.id }).catch(() => {});
        return sendJson(res, 200, { units, fileName: file.originalFilename, unitCount: units.length });
      }

      if (method === "GET" && action === "inventory") {
        if (req.query.id) {
          const { data: inventory, error } = await anonClient().from("property_inventories").select("*").eq("id", req.query.id).maybeSingle();
          if (error) return sendJson(res, 400, { error: error.message });
          const { data: units } = await sb.from("inventory_units").select("*").eq("inventory_id", req.query.id).order("created_at");
          return sendJson(res, 200, { inventory, units: units || [] });
        }
        const { data, error } = await anonClient().from("property_inventories").select("*").order("created_at", { ascending: false });
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { inventories: data || [] });
      }

      if (method === "POST" && action === "inventory") {
        if (!user) return sendJson(res, 401, { error: "Sign in to publish an inventory." });
        const body = await readBody(req);
        const units = Array.isArray(body.units) ? body.units : [];
        const prices = units.map((u) => Number(u.price)).filter((n) => !isNaN(n) && n > 0);
        const { data: inv, error } = await sb
          .from("property_inventories")
          .insert({
            owner_id: user.id,
            name: body.name,
            inventory_type: body.inventoryType || "rent",
            emirate: body.emirate,
            area: body.area,
            breakdown_mode: body.breakdownMode || "inventory",
            unit_count: units.length,
            price_min: prices.length ? Math.min(...prices) : null,
            price_max: prices.length ? Math.max(...prices) : null,
            source_file_name: body.sourceFileName || null,
            parse_notes: body.parseNotes || null,
          })
          .select()
          .maybeSingle();
        if (error) return sendJson(res, 400, { error: error.message });
        if (units.length) {
          const rows = units.map((u) => ({
            inventory_id: inv.id,
            unit_number: u.unitNumber || null,
            unit_type: u.unitType || null,
            price: Number(u.price) || null,
            bedrooms: u.bedrooms != null ? Number(u.bedrooms) : null,
            bathrooms: u.bathrooms != null ? Number(u.bathrooms) : null,
            sqft: u.sqft != null ? Number(u.sqft) : null,
            tenant_name: u.tenantName || null,
            lease_start: u.leaseStart || null,
            lease_end: u.leaseEnd || null,
            occupancy_status: u.occupancyStatus || (u.tenantName ? "occupied" : "vacant"),
            last_renewal_type: u.lastRenewalType || null,
            raw: u,
          }));
          await sb.from("inventory_units").insert(rows);
        }
        return sendJson(res, 200, { id: inv.id, ...inv });
      }

      if (method === "POST" && action === "view") {
        const body = await readBody(req);
        if (!body.propertyId) return sendJson(res, 400, { error: "propertyId required" });
        // 60/10min per IP is generous enough that no real person browsing
        // reels ever hits it — this only stops a bot/script hammering one
        // listing's view count. Never fails the request either way; a
        // rate-limited view just isn't counted, silently.
        if (await checkRateLimit(anonClient(), `view_property_${getClientIp(req)}`, 60)) {
          await anonClient().rpc("increment_property_views", { pid: body.propertyId });
        }
        return sendJson(res, 200, { ok: true });
      }

      if (method === "POST" && action === "like") {
        if (!user) return sendJson(res, 401, { error: "Sign in to like listings." });
        const body = await readBody(req);
        if (!body.propertyId) return sendJson(res, 400, { error: "propertyId required" });
        const { data, error } = await sb.rpc("toggle_property_like", { pid: body.propertyId }).maybeSingle();
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { liked: data.liked, likesCount: data.likes_count });
      }

      // SUPER — distinct from Like (see toggle_property_super migration
      // notes). Same shape as the like endpoints above on purpose, so the
      // frontend can treat them as parallel actions.
      if (method === "POST" && action === "super") {
        if (!user) return sendJson(res, 401, { error: "Sign in to SUPER a listing." });
        const body = await readBody(req);
        if (!body.propertyId) return sendJson(res, 400, { error: "propertyId required" });
        const { data, error } = await sb.rpc("toggle_property_super", { pid: body.propertyId }).maybeSingle();
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { supered: data.supered, superCount: data.super_count });
      }

      if (method === "GET" && action === "supers") {
        if (!user) return sendJson(res, 200, { superedIds: [] });
        const { data } = await sb.from("property_supers").select("property_id").eq("user_id", user.id);
        return sendJson(res, 200, { superedIds: (data || []).map((r) => r.property_id) });
      }

      if (method === "GET" && action === "likes") {
        if (!user) return sendJson(res, 200, { likedIds: [] });
        const { data } = await sb.from("property_likes").select("property_id").eq("user_id", user.id);
        return sendJson(res, 200, { likedIds: (data || []).map((r) => r.property_id) });
      }

      if (method === "GET") {
        const { data, error } = await anonClient().from("properties").select("*").order("created_at", { ascending: false }).limit(200);
        if (error) return sendJson(res, 400, { error: error.message });
        const mapped = (data || []).map((p) => ({
          ...p,
          type: p.listing_type || "Sale",
          priceFreq: p.listing_type === "Rent" ? "yr" : undefined,
          ownerId: p.owner_id,
          isLive: true,
        }));
        return sendJson(res, 200, { properties: mapped });
      }

      if (method === "POST") {
        if (!user) return sendJson(res, 401, { error: "Sign in to post a property." });
        const okRate = await checkRateLimit(anonClient(), `property_post_${user.id}`, 20);
        if (!okRate) return sendJson(res, 429, { error: "Too many property posts — wait a few minutes." });
        const body = await readBody(req);
        const { data, error } = await sb
          .from("properties")
          .insert({
            owner_id: user.id,
            title: body.title,
            area: body.area,
            emirate: body.emirate,
            price: toNumber(body.price) || 0,
            listing_type: body.type === "Rent" ? "Rent" : "Sale",
            category: body.category || "Apartment",
            price_frequency: body.type === "Rent" ? "year" : null,
            beds: body.beds !== "" && body.beds != null ? Number(body.beds) : null,
            baths: body.baths !== "" && body.baths != null ? Number(body.baths) : null,
            sqft: body.sqft !== "" && body.sqft != null ? Number(body.sqft) : null,
            furnished: body.furnished || null,
            service_charge: body.serviceCharge || null,
            description: body.description || null,
            photo_url: body.photoUrls?.[0] || body.photoUrl || null,
            photo_urls: body.photoUrls || (body.photoUrl ? [body.photoUrl] : null),
            video_url: body.videoUrl || null,
            media_type: body.mediaType || (body.videoUrl ? "video" : "photo"),
            music_track_id: body.musicTrackId || null,
            visibility: body.visibility === "investor" ? "investor" : "public",
            is_developer_project: !!body.isDeveloperProject,
            developer_name: body.developerName || null,
            handover_date: body.handoverDate || null,
            payment_plan: body.paymentPlan || null,
            unit_types_available: body.unitTypesAvailable || null,
            floor: body.floor || null,
            zoning: body.zoning || null,
            jv_open: !!body.jvOpen,
            jv_terms: body.jvTerms || null,
          })
          .select()
          .maybeSingle();
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { property: { ...data, type: data.listing_type || "Sale", priceFreq: data.listing_type === "Rent" ? "yr" : undefined, ownerId: data.owner_id, isLive: true } });
      }

      if (method === "PATCH") {
        if (!user) return sendJson(res, 401, { error: "Sign in to edit this listing." });
        const body = await readBody(req);
        const { id, ...fields } = body;
        const { error } = await sb
          .from("properties")
          .update({
            title: fields.title,
            area: fields.area,
            emirate: fields.emirate,
            price: toNumber(fields.price) || 0,
            listing_type: fields.type === "Rent" ? "Rent" : fields.type === "Sale" ? "Sale" : undefined,
            category: fields.category || undefined,
            price_frequency: fields.type === "Rent" ? "year" : fields.type === "Sale" ? null : undefined,
            beds: fields.beds !== "" && fields.beds != null ? Number(fields.beds) : null,
            baths: fields.baths !== "" && fields.baths != null ? Number(fields.baths) : null,
            sqft: fields.sqft !== "" && fields.sqft != null ? Number(fields.sqft) : null,
            furnished: fields.furnished || null,
            service_charge: fields.serviceCharge || null,
            description: fields.description || null,
            photo_url: fields.photoUrls?.[0] || null,
            photo_urls: fields.photoUrls || null,
          })
          .eq("id", id);
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { ok: true });
      }

      if (method === "DELETE") {
        if (!user) return sendJson(res, 401, { error: "Sign in required." });
        const body = await readBody(req);
        const { error } = await sb.from("properties").delete().eq("id", body.id).eq("owner_id", user.id);
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { ok: true });
      }

      return sendJson(res, 404, { error: "Not found" });
    }

    // ------------------------------------------------------- /api/services
    if (resource === "services") {
      const action = req.query.action;

      if (method === "POST" && action === "view") {
        const body = await readBody(req);
        if (!body.serviceId) return sendJson(res, 400, { error: "serviceId required" });
        if (await checkRateLimit(anonClient(), `view_service_${getClientIp(req)}`, 60)) {
          await anonClient().rpc("increment_service_views", { sid: body.serviceId });
        }
        return sendJson(res, 200, { ok: true });
      }

      if (method === "POST" && action === "like") {
        if (!user) return sendJson(res, 401, { error: "Sign in to like services." });
        const body = await readBody(req);
        if (!body.serviceId) return sendJson(res, 400, { error: "serviceId required" });
        const { data, error } = await sb.rpc("toggle_service_like", { sid: body.serviceId }).maybeSingle();
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { liked: data.liked, likesCount: data.likes_count });
      }

      if (method === "GET" && action === "likes") {
        if (!user) return sendJson(res, 200, { likedIds: [] });
        const { data } = await sb.from("service_likes").select("service_id").eq("user_id", user.id);
        return sendJson(res, 200, { likedIds: (data || []).map((r) => r.service_id) });
      }

      if (method === "GET") {
        const { data, error } = await anonClient().from("services").select("*").order("created_at", { ascending: false }).limit(200);
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { services: (data || []).map((s) => ({ ...s, ownerId: s.owner_id, isLive: true })) });
      }
      if (method === "POST") {
        if (!user) return sendJson(res, 401, { error: "Sign in to publish a service." });
        const body = await readBody(req);
        const { data, error } = await sb
          .from("services")
          .insert({
            owner_id: user.id,
            title: body.title,
            category: body.category,
            area: body.area,
            price_text: body.priceText,
            description: body.description,
            photo_url: body.photoUrls?.[0] || null,
            photo_urls: body.photoUrls || null,
            video_url: body.videoUrl || null,
            media_type: body.mediaType || (body.videoUrl ? "video" : "photo"),
            music_track_id: body.musicTrackId || null,
          })
          .select()
          .maybeSingle();
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { service: { ...data, ownerId: data.owner_id, isLive: true } });
      }
      return sendJson(res, 404, { error: "Not found" });
    }

    // --------------------------------------------------- /api/conversations
    if (resource === "conversations") {
      const action = req.query.action;
      const convId = segments[1];

      // /api/conversations/:id/messages
      if (convId && segments[2] === "messages") {
        if (method === "GET") {
          if (!user) return sendJson(res, 401, { error: "Sign in required." });
          const { data: convo } = await sb.from("conversations").select("participant_ids").eq("id", convId).maybeSingle();
          if (!convo || !(convo.participant_ids || []).map(String).includes(String(user.id))) {
            return sendJson(res, 403, { error: "Not a participant in this conversation." });
          }
          const { data, error } = await sb.from("messages").select("*").eq("conversation_id", convId).order("created_at").limit(500);
          if (error) return sendJson(res, 400, { error: error.message });
          return sendJson(res, 200, { messages: data || [] });
        }
        if (method === "POST") {
          if (!user) return sendJson(res, 401, { error: "Sign in to send messages." });
          const okRate = await checkRateLimit(anonClient(), `msg_${user.id}`, 60);
          if (!okRate) return sendJson(res, 429, { error: "You're sending messages too fast — wait a moment." });
          const { data: convo } = await sb.from("conversations").select("participant_ids").eq("id", convId).maybeSingle();
          if (!convo || !(convo.participant_ids || []).map(String).includes(String(user.id))) {
            return sendJson(res, 403, { error: "Not a participant in this conversation." });
          }
          const body = await readBody(req);
          const text = (body.body ?? "").toString().slice(0, 4000);
          const { data, error } = await sb
            .from("messages")
            .insert({
              conversation_id: convId,
              sender_id: user.id,
              type: body.type || "text",
              body: text || null,
              media_url: body.mediaUrl ?? null,
              media_meta: body.mediaMeta ?? null,
            })
            .select()
            .maybeSingle();
          if (error) return sendJson(res, 400, { error: error.message });
          // Touch conversation so list sort stays cheap if last_message columns exist
          try {
            await sb.from("conversations").update({
              last_body: text || null,
              last_message_at: new Date().toISOString(),
            }).eq("id", convId);
          } catch {}
          return sendJson(res, 200, { message: data });
        }
        if (method === "PATCH" && req.query.action === "edit") {
          if (!user) return sendJson(res, 401, { error: "Sign in required." });
          const body = await readBody(req);
          if (!body.messageId || !body.body?.trim()) return sendJson(res, 400, { error: "messageId and body required" });
          const { data, error } = await sb
            .from("messages")
            .update({ body: body.body.trim(), edited_at: new Date().toISOString() })
            .eq("id", body.messageId)
            .eq("sender_id", user.id) // can only edit your own messages
            .select()
            .maybeSingle();
          if (error) return sendJson(res, 400, { error: error.message });
          if (!data) return sendJson(res, 403, { error: "You can only edit your own messages." });
          return sendJson(res, 200, { message: data });
        }
        if (method === "PATCH") {
          if (!user) return sendJson(res, 401, { error: "Sign in required." });
          const { data: rows } = await sb.from("messages").select("id, read_by").eq("conversation_id", convId);
          for (const row of rows || []) {
            const readBy = row.read_by || [];
            if (!readBy.includes(user.id)) {
              await sb.from("messages").update({ read_by: [...readBy, user.id] }).eq("id", row.id);
            }
          }
          return sendJson(res, 200, { ok: true });
        }
        if (method === "DELETE") {
          if (!user) return sendJson(res, 401, { error: "Sign in required." });
          const body = await readBody(req);
          if (!body.messageId) return sendJson(res, 400, { error: "messageId required" });
          const { error, count } = await sb
            .from("messages")
            .delete({ count: "exact" })
            .eq("id", body.messageId)
            .eq("sender_id", user.id); // can only delete your own messages
          if (error) return sendJson(res, 400, { error: error.message });
          if (!count) return sendJson(res, 403, { error: "You can only delete your own messages." });
          return sendJson(res, 200, { ok: true });
        }
        return sendJson(res, 404, { error: "Not found" });
      }

      // /api/conversations/:id — delete a whole conversation (must be a participant)
      if (convId && !segments[2] && method === "DELETE") {
        if (!user) return sendJson(res, 401, { error: "Sign in required." });
        const { data: convo } = await sb.from("conversations").select("participant_ids").eq("id", convId).maybeSingle();
        if (!convo || !(convo.participant_ids || []).includes(user.id)) {
          return sendJson(res, 403, { error: "Not a participant in this conversation." });
        }
        await sb.from("messages").delete().eq("conversation_id", convId);
        const { error } = await sb.from("conversations").delete().eq("id", convId);
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { ok: true });
      }

      if (method === "GET" && action === "presence") {
        const ids = (req.query.userIds || "").split(",").filter(Boolean);
        if (!ids.length) return sendJson(res, 200, { presence: {} });
        const { data } = await sb.from("presence").select("*").in("user_id", ids);
        const presence = {};
        // 90s window — heartbeats fire ~12–15s; stale rows flip offline quickly
        // for real-time feel while tolerating a missed beat.
        const cutoff = Date.now() - 90 * 1000;
        for (const row of data || []) {
          const fresh = row.updated_at && new Date(row.updated_at).getTime() > cutoff;
          const st = (row.status || "online").toLowerCase();
          if (!fresh || st === "offline" || st === "away") {
            presence[row.user_id] = "offline";
          } else if (st === "busy") {
            presence[row.user_id] = "busy";
          } else {
            presence[row.user_id] = "online";
          }
        }
        return sendJson(res, 200, { presence });
      }

      if (method === "POST" && action === "presence") {
        if (!user) return sendJson(res, 200, { ok: true });
        const body = await readBody(req);
        const raw = String(body.status || "online").toLowerCase();
        const status = ["online", "busy", "offline", "away"].includes(raw) ? raw : "online";
        await sb.from("presence").upsert(
          { user_id: user.id, status, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
        return sendJson(res, 200, { ok: true });
      }

      if (method === "GET" && action === "unread-count") {
        if (!user) return sendJson(res, 200, { count: 0 });
        const { data: convos } = await sb.from("conversations").select("id").contains("participant_ids", [user.id]);
        const ids = (convos || []).map((c) => c.id);
        if (!ids.length) return sendJson(res, 200, { count: 0 });
        const { data: msgs } = await sb.from("messages").select("conversation_id, sender_id, read_by").in("conversation_id", ids);
        const unreadConvos = new Set();
        for (const m of msgs || []) {
          if (m.sender_id !== user.id && !(m.read_by || []).includes(user.id)) unreadConvos.add(m.conversation_id);
        }
        return sendJson(res, 200, { count: unreadConvos.size });
      }

      if (method === "GET" && action === "profiles") {
        const ids = (req.query.ids || "").split(",").filter(Boolean);
        if (!ids.length) return sendJson(res, 200, { profiles: {} });
        const { data } = await sb.from("profiles").select("id,name,avatar_url").in("id", ids);
        const profiles = {};
        for (const row of data || []) profiles[row.id] = { name: row.name, avatar_url: row.avatar_url };
        return sendJson(res, 200, { profiles });
      }

      if (method === "GET" && action === "lookup") {
        const email = req.query.email;
        const { data } = await sb.from("profiles").select("id,name,email").eq("email", email).maybeSingle();
        return sendJson(res, 200, { user: data || null });
      }

      // Directory: browse ALL Merveil citizens (no friend requirement).
      // Live presence: online if heartbeat within 5 minutes. Online users first.
      if (method === "GET" && action === "directory") {
        if (!user) return sendJson(res, 200, { users: [] });
        const q = (req.query.q || "").trim().toLowerCase();
        // Show every citizen — friendship is not required to see presence
        // or start a conversation. discoverable opt-out still respected if
        // the column is explicitly false; null/true both appear.
        let query = sb.from("profiles")
          .select("id,name,avatar_url,role_label,passport_tier,discoverable")
          .neq("id", user.id)
          .limit(300);
        const { data: people, error } = await query;
        if (error) return sendJson(res, 400, { error: error.message });
        const visible = (people || []).filter((p) => p.discoverable !== false);
        const ids = visible.map((p) => p.id);
        let presenceMap = {};
        const cutoff = Date.now() - 5 * 60 * 1000; // 5 min window so presence is visible
        if (ids.length) {
          const { data: pres } = await sb.from("presence").select("*").in("user_id", ids);
          for (const row of pres || []) {
            const fresh = row.updated_at && new Date(row.updated_at).getTime() > cutoff;
            const st = (row.status || "online").toLowerCase();
            presenceMap[row.user_id] = fresh
              ? (st === "offline" ? "offline" : st === "busy" ? "busy" : "online")
              : "offline";
          }
        }
        let list = visible.map((p) => ({
          id: p.id,
          name: p.name,
          avatar_url: p.avatar_url,
          role_label: p.role_label,
          passport_tier: p.passport_tier,
          status: presenceMap[p.id] || "offline",
        }));
        if (q) list = list.filter((p) => (p.name || "").toLowerCase().includes(q));
        list.sort((a, b) => {
          const rank = { online: 0, busy: 1, away: 2, offline: 3 };
          return (rank[a.status] ?? 3) - (rank[b.status] ?? 3);
        });
        return sendJson(res, 200, { users: list });
      }

      if (method === "GET") {
        if (!user) return sendJson(res, 200, { conversations: [] });
        const { data: convos, error } = await sb
          .from("conversations")
          .select("*")
          .contains("participant_ids", [user.id])
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) return sendJson(res, 400, { error: error.message });
        // SCALE FIX: batch last-message + unread in 2 queries instead of
        // 2N. Critical for 50–100 concurrent Connect users.
        const ids = (convos || []).map((c) => c.id);
        let lastByConvo = {};
        let unreadByConvo = {};
        if (ids.length) {
          const { data: recentMsgs } = await sb
            .from("messages")
            .select("conversation_id, body, created_at, sender_id, read_by, read_at")
            .in("conversation_id", ids)
            .order("created_at", { ascending: false })
            .limit(Math.min(ids.length * 40, 2000));
          for (const m of recentMsgs || []) {
            if (!lastByConvo[m.conversation_id]) {
              lastByConvo[m.conversation_id] = m;
            }
            const readBy = m.read_by || [];
            const isUnread = m.sender_id !== user.id && !readBy.includes(user.id) && !m.read_at;
            if (isUnread) unreadByConvo[m.conversation_id] = (unreadByConvo[m.conversation_id] || 0) + 1;
          }
        }
        const withLast = (convos || []).map((c) => {
          const last = lastByConvo[c.id];
          return {
            ...c,
            last_body: last?.body || c.last_body || null,
            last_message_at: last?.created_at || c.last_message_at || c.created_at,
            last_sender_id: last?.sender_id || null,
            unread_count: unreadByConvo[c.id] || 0,
          };
        });
        withLast.sort((a, b) => {
          const ta = new Date(a.last_message_at || 0).getTime();
          const tb = new Date(b.last_message_at || 0).getTime();
          return tb - ta;
        });
        return sendJson(res, 200, { conversations: withLast });
      }

      if (method === "POST") {
        if (!user) return sendJson(res, 401, { error: "Sign in required." });
        const okRate = await checkRateLimit(anonClient(), `convo_create_${user.id}`, 30);
        if (!okRate) return sendJson(res, 429, { error: "Too many new conversations — slow down a moment." });
        const body = await readBody(req);
        const participantIds = [...new Set((body.participantIds || []).map(String))].filter(Boolean);
        if (participantIds.length < 2) {
          return sendJson(res, 400, { error: "Need at least two participants." });
        }
        if (!participantIds.map(String).includes(String(user.id))) {
          return sendJson(res, 403, { error: "You must be a participant in the conversation." });
        }
        // Reuse existing 1:1 conversation so messaging the same citizen
        // from Pulse/World/Connect never creates duplicate threads.
        if (participantIds.length === 2) {
          const [a, b] = participantIds;
          const { data: existingList } = await sb
            .from("conversations")
            .select("*")
            .contains("participant_ids", [a])
            .limit(200);
          const existing = (existingList || []).find((c) => {
            const ids = (c.participant_ids || []).map(String);
            return ids.length === 2 && ids.includes(a) && ids.includes(b);
          });
          if (existing) {
            return sendJson(res, 200, { conversation: existing, reused: true });
          }
        }
        const { data, error } = await sb.from("conversations").insert({ participant_ids: participantIds }).select().maybeSingle();
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { conversation: data, reused: false });
      }

      // Smart Conversation Center — real archive + category label, not
      // decorative UI tabs.
      if (method === "PATCH" && convId && action === "archive") {
        if (!user) return sendJson(res, 401, { error: "Sign in required." });
        const { data: conv } = await sb.from("conversations").select("archived_by").eq("id", convId).maybeSingle();
        const current = conv?.archived_by || [];
        const isArchived = current.includes(user.id);
        const next = isArchived ? current.filter((id) => id !== user.id) : [...current, user.id];
        const { error } = await sb.from("conversations").update({ archived_by: next }).eq("id", convId);
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { archived: !isArchived });
      }

      if (method === "PATCH" && convId && action === "label") {
        if (!user) return sendJson(res, 401, { error: "Sign in required." });
        const body = await readBody(req);
        const { error } = await sb.from("conversations").update({ context_label: body.label || null }).eq("id", convId);
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { ok: true });
      }

      return sendJson(res, 404, { error: "Not found" });
    }

    // -------------------------------------------------------- /api/circles
    if (resource === "circles") {
      const code = segments[1];

      if (code && segments[2] === "countries") {
        const { data: circle } = await sb.from("circles").select("id").eq("code", code).maybeSingle();
        if (!circle) return sendJson(res, 200, { countries: [] });
        const { data: members } = await sb
          .from("circle_members")
          .select("profiles(country)")
          .eq("circle_id", circle.id);
        const counts = {};
        for (const m of members || []) {
          const c = m.profiles?.country;
          if (c) counts[c] = (counts[c] || 0) + 1;
        }
        const countries = Object.entries(counts).map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count);
        return sendJson(res, 200, { countries });
      }

      if (code && segments[2] === "posts") {
        if (method === "GET") {
          const { data: circle } = await sb.from("circles").select("id").eq("code", code).maybeSingle();
          if (!circle) return sendJson(res, 200, { posts: [] });
          const { data: posts } = await sb.from("circle_posts").select("*").eq("circle_id", circle.id).order("created_at", { ascending: false });
          return sendJson(res, 200, { posts: posts || [] });
        }
        if (method === "POST") {
          if (!user) return sendJson(res, 401, { error: "Sign in to post in this circle." });
          const body = await readBody(req);
          let { data: circle } = await sb.from("circles").select("id").eq("code", code).maybeSingle();
          if (!circle) return sendJson(res, 404, { error: "Circle not found." });
          const { data, error } = await sb
            .from("circle_posts")
            .insert({ circle_id: circle.id, title: body.title, type: body.type || "announcement", author_id: user.id })
            .select()
            .maybeSingle();
          if (error) return sendJson(res, 400, { error: error.message });
          return sendJson(res, 200, { post: data });
        }
        return sendJson(res, 404, { error: "Not found" });
      }

      if (method === "GET" && req.query.userId) {
        if (!user) return sendJson(res, 200, { circles: [] });
        const { data: memberships } = await sb.from("circle_members").select("circle_id").eq("user_id", user.id);
        const ids = (memberships || []).map((m) => m.circle_id);
        if (!ids.length) return sendJson(res, 200, { circles: [] });
        const { data: circles } = await sb.from("circles").select("*").in("id", ids);
        return sendJson(res, 200, { circles: circles || [] });
      }

      if (method === "GET") {
        const { data: circles, error } = await anonClient().from("circles").select("*").order("created_at", { ascending: false });
        if (error) return sendJson(res, 400, { error: error.message });
        const withTotals = await Promise.all(
          (circles || []).map(async (c) => {
            const { count } = await sb.from("circle_members").select("*", { count: "exact", head: true }).eq("circle_id", c.id);
            return { ...c, total: count || 0 };
          })
        );
        return sendJson(res, 200, { circles: withTotals });
      }

      if (method === "POST" && req.query.action === "join") {
        if (!user) return sendJson(res, 401, { error: "Sign in to join a circle." });
        const body = await readBody(req);
        const { data: circle } = await sb.from("circles").select("id").eq("code", body.code).maybeSingle();
        if (!circle) return sendJson(res, 404, { error: "Circle not found." });
        const { error } = await sb.from("circle_members").upsert({ circle_id: circle.id, user_id: user.id });
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { ok: true });
      }

      if (method === "POST") {
        if (!user) return sendJson(res, 401, { error: "Sign in to create a circle." });
        const body = await readBody(req);
        const code = randomCircleCode(body.name || "CIR");
        const { data, error } = await sb
          .from("circles")
          .insert({ code, name: body.name, flag: body.flag || null, created_by: user.id })
          .select()
          .maybeSingle();
        if (error) return sendJson(res, 400, { error: error.message });
        await sb.from("circle_members").insert({ circle_id: data.id, user_id: user.id }).catch(() => {});
        return sendJson(res, 200, { circle: data });
      }

      return sendJson(res, 404, { error: "Not found" });
    }

    // --------------------------------------------------------- /api/events
    if (resource === "events") {
      if (method === "GET") {
        const status = req.query.status || "upcoming";
        const { data, error } = await anonClient().from("events").select("*").eq("status", status).order("starts_at", { ascending: true });
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { events: data || [] });
      }

      if (method === "POST") {
        if (!user) return sendJson(res, 401, { error: "Sign in to create an event." });
        const body = await readBody(req);
        const { data, error } = await sb
          .from("events")
          .insert({
            organizer_id: user.id,
            title: body.title,
            category: body.category,
            description: body.description,
            venue_name: body.venueName,
            area: body.area,
            starts_at: body.startsAt,
            capacity: body.capacity,
            price_aed: body.priceAed || 0,
            organizer_tier: body.organizerTier,
            ai_plan: body.aiPlan,
            concierge_requested: !!body.conciergeRequested,
            marketing_requested: !!body.marketingRequested,
            status: "upcoming",
          })
          .select()
          .maybeSingle();
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { event: data });
      }

      if (method === "PATCH") {
        const body = await readBody(req);
        if (body.action === "rsvp") {
          if (!user) return sendJson(res, 401, { error: "Sign in to RSVP." });
          const code = ticketCode();
          const { error } = await sb.from("event_rsvps").insert({ event_id: body.eventId, user_id: user.id, ticket_code: code });
          if (error) {
            if (error.code === "23505") return sendJson(res, 200, { ticket: { ticket_code: code, already: true } });
            return sendJson(res, 400, { error: error.message });
          }
          const { data: newCount } = await sb.rpc("increment_event_rsvp_count", { eid: body.eventId });
          return sendJson(res, 200, { ticket: { ticket_code: code, goingCount: newCount } });
        }
        return sendJson(res, 400, { error: "Unknown action" });
      }

      if (method === "POST" && req.query.action === "view") {
        const body = await readBody(req);
        if (!body.eventId) return sendJson(res, 400, { error: "eventId required" });
        await anonClient().rpc("increment_event_views", { eid: body.eventId });
        return sendJson(res, 200, { ok: true });
      }

      if (method === "POST" && req.query.action === "like") {
        if (!user) return sendJson(res, 401, { error: "Sign in to like events." });
        const body = await readBody(req);
        if (!body.eventId) return sendJson(res, 400, { error: "eventId required" });
        const { data, error } = await sb.rpc("toggle_event_like", { eid: body.eventId }).maybeSingle();
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { liked: data.liked, likesCount: data.likes_count });
      }

      if (method === "GET" && req.query.action === "likes") {
        if (!user) return sendJson(res, 200, { likedIds: [] });
        const { data } = await sb.from("event_likes").select("event_id").eq("user_id", user.id);
        return sendJson(res, 200, { likedIds: (data || []).map((r) => r.event_id) });
      }

      return sendJson(res, 404, { error: "Not found" });
    }

    // ----------------------------------------------------- /api/notifications
    if (resource === "notifications" && req.query.action === "counts" && method === "GET") {
      const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const countSince = async (table) => {
        const { count } = await sb.from(table).select("*", { count: "exact", head: true }).gt("created_at", since48h);
        return count || 0;
      };
      const [events, jobs] = await Promise.all([countSince("events"), countSince("jobs")]);
      return sendJson(res, 200, { events, jobs });
    }

    // -------------------------------------------------- /api/privacy-center
    // Doc 2 §21 — "No hidden data experience." Assembles what's actually
    // stored about this citizen from the real tables, for them to see and
    // export. Nothing here is summarized or hidden from them.
    if (resource === "privacy-center") {
      if (!user) return sendJson(res, 401, { error: "Sign in required." });
      if (method === "GET") {
        const [{ data: profile }, { data: settings }, { data: sessions }, { data: events }, { count: connectionsCount }, { count: reportsFiled }] = await Promise.all([
          sb.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          sb.from("citizen_settings").select("*").eq("user_id", user.id).maybeSingle(),
          sb.from("user_sessions").select("id, device_name, ip, created_at, last_active_at, revoked_at").eq("user_id", user.id),
          sb.from("security_events").select("id, event_type, severity, description, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
          sb.from("connections").select("*", { count: "exact", head: true }).or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`),
          sb.from("reports").select("*", { count: "exact", head: true }).eq("reporter_id", user.id),
        ]);
        return sendJson(res, 200, {
          profile: profile || null,
          settings: settings || null,
          sessions: sessions || [],
          securityEvents: events || [],
          connectionsCount: connectionsCount || 0,
          reportsFiled: reportsFiled || 0,
        });
      }
      return sendJson(res, 404, { error: "Not found" });
    }

    // ------------------------------------------------------ /api/neighborhoods
    // Replaces the old hardcoded totalMembers/publicN/privateN numbers and
    // mockNationalityMix() with real aggregation. New app, so these will
    // mostly show zero right now — that's correct, not a bug. An empty
    // "be the first to join" state is honest; an invented 12,400 is not.
    if (resource === "neighborhoods") {
      const action = req.query.action;

      if (action === "stats" && method === "GET") {
        const { data: members } = await sb.from("neighborhood_members").select("user_id, neighborhood_id, visibility");
        const userIds = [...new Set((members || []).map((m) => m.user_id))];
        let countryByUser = {};
        if (userIds.length) {
          const { data: profs } = await sb.from("profiles").select("id, country").in("id", userIds);
          (profs || []).forEach((p) => { countryByUser[p.id] = p.country; });
        }
        const byNeighborhood = {};
        (members || []).forEach((m) => {
          const b = (byNeighborhood[m.neighborhood_id] ||= { total: 0, public: 0, private: 0, countries: {} });
          b.total++;
          if (m.visibility === "private") b.private++; else b.public++;
          const c = countryByUser[m.user_id];
          if (c) b.countries[c] = (b.countries[c] || 0) + 1;
        });
        Object.values(byNeighborhood).forEach((b) => {
          b.nationalities = Object.entries(b.countries).map(([country, count]) => ({ country, count })).sort((a, c) => c.count - a.count).slice(0, 8);
          delete b.countries;
        });
        return sendJson(res, 200, { byNeighborhood });
      }

      if (action === "my-memberships" && method === "GET") {
        if (!user) return sendJson(res, 200, { memberships: [] });
        const { data } = await sb.from("neighborhood_members").select("neighborhood_id, visibility").eq("user_id", user.id);
        return sendJson(res, 200, { memberships: data || [] });
      }

      if (action === "join" && method === "POST") {
        if (!user) return sendJson(res, 401, { error: "Sign in required." });
        const body = await readBody(req);
        if (!body.neighborhoodId) return sendJson(res, 400, { error: "neighborhoodId required." });
        const visibility = body.visibility === "private" ? "private" : "public";
        const { error } = await sb.from("neighborhood_members").upsert(
          { user_id: user.id, neighborhood_id: body.neighborhoodId, visibility },
          { onConflict: "user_id,neighborhood_id" }
        );
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { ok: true });
      }

      if (action === "leave" && method === "POST") {
        if (!user) return sendJson(res, 401, { error: "Sign in required." });
        const body = await readBody(req);
        if (!body.neighborhoodId) return sendJson(res, 400, { error: "neighborhoodId required." });
        const { error } = await sb.from("neighborhood_members").delete().eq("user_id", user.id).eq("neighborhood_id", body.neighborhoodId);
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { ok: true });
      }

      return sendJson(res, 404, { error: "Not found" });
    }

    // ---------------------------------------------------------- /api/reports
    // Trust & Safety report intake (doc 3 §37). Citizens can only ever
    // create and read their own reports — reviewing/deciding is admin-only,
    // via /api/console below.
    if (resource === "reports") {
      if (!user) return sendJson(res, 401, { error: "Sign in required." });
      if (method === "POST") {
        const body = await readBody(req);
        const { targetType, targetId, category, description } = body || {};
        if (!targetType || !targetId || !category) return sendJson(res, 400, { error: "targetType, targetId, and category are required." });
        const okRate = await checkRateLimit(anonClient(), `report_${user.id}`);
        if (!okRate) return sendJson(res, 429, { error: "Too many reports submitted — wait a few minutes and try again." });
        const { error } = await sb.from("reports").insert({
          reporter_id: user.id,
          target_type: targetType,
          target_id: String(targetId),
          category,
          description: description || null,
        });
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { ok: true });
      }
      if (method === "GET") {
        const { data, error } = await sb.from("reports").select("id, target_type, target_id, category, status, created_at").eq("reporter_id", user.id).order("created_at", { ascending: false });
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { reports: data || [] });
      }
      return sendJson(res, 404, { error: "Not found" });
    }

    // ---------------------------------------------------------- /api/reauth
    // Doc 1 §13/14 — "smart re-authentication" and "risk-based session
    // protection". Honest scope: this is the real web equivalent (password
    // re-verification, no new session/cookie issued) rather than faking
    // WebAuthn/biometric prompts without the server-side signature
    // verification that would make them actually secure. Upgrading to a
    // real platform-authenticator (Face/fingerprint) flow later is a
    // separate, deliberate addition — it needs a vetted WebAuthn library,
    // not a hand-rolled one, since getting that crypto wrong is worse
    // than not having it.
    if (resource === "reauth") {
      if (!user) return sendJson(res, 401, { error: "Sign in required." });
      if (method === "POST") {
        const body = await readBody(req);
        if (!body.password) return sendJson(res, 400, { error: "Password required." });
        const svc = adminClient();
        const anon = anonClient();
        const okRate = await checkRateLimit(anon, `reauth_${user.id}`);
        if (!okRate) return sendJson(res, 429, { error: "Too many attempts — wait a few minutes and try again." });
        const { data: authUser } = await svc.auth.admin.getUserById(user.id);
        const email = authUser?.user?.email;
        if (!email) return sendJson(res, 400, { error: "Could not verify this account." });
        const { error } = await anon.auth.signInWithPassword({ email, password: body.password });
        if (error) {
          await logSecurityEvent(user.id, "reauth_failed", { severity: "elevated", description: "Failed re-authentication on a sensitive screen." });
          return sendJson(res, 401, { error: "Incorrect password." });
        }
        await logSecurityEvent(user.id, "reauth", { severity: "info", description: "Re-authenticated for a sensitive screen or after returning to Merveil." });
        return sendJson(res, 200, { ok: true, reauthAt: new Date().toISOString() });
      }
      return sendJson(res, 404, { error: "Not found" });
    }

    // -------------------------------------------------- /api/citizen-settings
    // The real backend for the Citizen Control Center (doc 2). One row
    // per citizen, owner-scoped by RLS — sb here is already the citizen's
    // own authenticated client, so this can't touch anyone else's row.
    if (resource === "citizen-settings") {
      if (!user) return sendJson(res, 401, { error: "Sign in required." });
      if (method === "GET") {
        const { data, error } = await sb.from("citizen_settings").select("*").eq("user_id", user.id).maybeSingle();
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { settings: data || null });
      }
      if (method === "POST" || method === "PUT") {
        const body = await readBody(req);
        const allowed = ["language", "accessibility", "ai_preferences", "notification_preferences", "opportunity_preferences", "connection_preferences", "call_preferences", "passport_visibility", "privacy_preferences", "automation_rules"];
        const patch = { user_id: user.id, updated_at: new Date().toISOString() };
        for (const k of allowed) if (body[k] !== undefined) patch[k] = body[k];
        if (JSON.stringify(patch).length > 20000) return sendJson(res, 400, { error: "Settings payload too large." });
        const { data, error } = await sb.from("citizen_settings").upsert(patch, { onConflict: "user_id" }).select().maybeSingle();
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { settings: data });
      }
      return sendJson(res, 404, { error: "Not found" });
    }

    // ------------------------------------------------------- /api/my-sessions
    // Citizen-facing Device & Session Center (doc 2 §19) — "Sign out of
    // this device" is real: it revokes the row, same table the Admin
    // Security panel reads from.
    if (resource === "my-sessions") {
      if (!user) return sendJson(res, 401, { error: "Sign in required." });
      if (method === "GET") {
        const { data, error } = await sb.from("user_sessions").select("id, device_name, device_type, browser, os, ip, created_at, last_active_at, revoked_at").eq("user_id", user.id).order("last_active_at", { ascending: false });
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { sessions: data || [] });
      }
      if (method === "POST" && req.query.action === "revoke") {
        const body = await readBody(req);
        if (!body.sessionId) return sendJson(res, 400, { error: "sessionId required." });
        const { error } = await sb.from("user_sessions").update({ revoked_at: new Date().toISOString() }).eq("id", body.sessionId).eq("user_id", user.id);
        if (error) return sendJson(res, 400, { error: error.message });
        await logSecurityEvent(user.id, "session_self_revoked", { severity: "low", description: "Citizen signed out a device from Settings." });
        return sendJson(res, 200, { ok: true });
      }
      return sendJson(res, 404, { error: "Not found" });
    }

    // ------------------------------------------------------- /api/date-me
    // The romantic connection dimension inside Connect.
    //  - Nobody appears in discovery unless they explicitly turned Date Me
    //    on — never automatic from "single" in Passport.
    //  - Non-members (their own Date Me is off) see that people exist but
    //    get no identity: no name, no photo, no user_id — redacted here
    //    server-side, not just hidden in the UI.
    //  - Only Online/Offline — presence's "busy" collapses into "online"
    //    here, since Date Me deliberately has no Busy state.
    //  - No direct-message/follow/connect. The only action is asking
    //    Merveil to introduce two people; only the target's explicit
    //    accept opens a conversation.
    //  - Compatibility is computed from what both people actually filled
    //    in, with an honest per-dimension breakdown — not a single
    //    fabricated percentage from an opaque model.
    //  - 7 active introductions per calendar month, enforced here.
    if (resource === "date-me") {
      if (!user) return sendJson(res, 401, { error: "Sign in required." });
      const svc = adminClient();
      const action = req.query.action || "";
      const monthKey = () => new Date().toISOString().slice(0, 7) + "-01";

      const ensureOwnRow = async () => {
        const { data } = await sb.from("date_me_profiles").select("*").eq("user_id", user.id).maybeSingle();
        if (data) {
          if (data.introductions_reset_at < monthKey()) {
            const { data: reset } = await sb.from("date_me_profiles")
              .update({ introductions_used: 0, introductions_reset_at: monthKey() })
              .eq("user_id", user.id).select().maybeSingle();
            return reset || data;
          }
          return data;
        }
        const { data: created, error } = await sb.from("date_me_profiles")
          .insert({ user_id: user.id, introductions_reset_at: monthKey() }).select().maybeSingle();
        if (error) throw new Error(error.message);
        return created;
      };

      const jaccard = (a = [], b = []) => {
        const A = new Set(a || []), B = new Set(b || []);
        if (A.size === 0 && B.size === 0) return null;
        const inter = [...A].filter((x) => B.has(x)).length;
        const union = new Set([...A, ...B]).size;
        return union === 0 ? null : inter / union;
      };
      const INTENT_ADJACENCY = {
        serious: { serious: 1, marriage: 0.85, long_term: 0.85, dating_first: 0.35, open: 0.4 },
        marriage: { serious: 0.85, marriage: 1, long_term: 0.7, dating_first: 0.15, open: 0.25 },
        long_term: { serious: 0.85, marriage: 0.7, long_term: 1, dating_first: 0.4, open: 0.45 },
        dating_first: { serious: 0.35, marriage: 0.15, long_term: 0.4, dating_first: 1, open: 0.75 },
        open: { serious: 0.4, marriage: 0.25, long_term: 0.45, dating_first: 0.75, open: 1 },
      };
      const strength = (v) => (v == null ? "Not enough data" : v >= 0.8 ? "Very strong" : v >= 0.6 ? "Strong" : v >= 0.4 ? "Good" : v >= 0.2 ? "Some overlap" : "Weak");
      function computeCompatibility(a, b) {
        const dims = [];
        const intentScore = a.intention && b.intention ? (INTENT_ADJACENCY[a.intention]?.[b.intention] ?? 0.5) : null;
        dims.push({ key: "intention", label: "Relationship intention", icon: "❤️", score: intentScore });
        const geoKeys = ["same_city", "same_country", "international", "long_distance", "relocation", "travel"];
        dims.push({ key: "geography", label: "Geographic feasibility", icon: "📍", score: jaccard(geoKeys.filter(k => a.geography?.[k]), geoKeys.filter(k => b.geography?.[k])) });
        dims.push({ key: "lifestyle", label: "Lifestyle", icon: "🌍", score: jaccard(a.lifestyle, b.lifestyle) });
        dims.push({ key: "communication", label: "Communication", icon: "💬", score: jaccard(a.communication, b.communication) });
        dims.push({ key: "values", label: "Values & goals", icon: "🎯", score: jaccard(a.values?.prefer, b.values?.prefer) });

        const challenges = [];
        const aBreak = a.values?.deal_breaker || [], bBreak = b.values?.deal_breaker || [];
        const aTraits = new Set([...(a.lifestyle || []), ...(a.communication || []), ...(a.values?.prefer || [])]);
        const bTraits = new Set([...(b.lifestyle || []), ...(b.communication || []), ...(b.values?.prefer || [])]);
        let dealbreakerHit = false;
        for (const d of aBreak) if (bTraits.has(d)) { challenges.push(`They list "${d}" as important — you've marked it a deal-breaker.`); dealbreakerHit = true; }
        for (const d of bBreak) if (aTraits.has(d)) { challenges.push(`You list "${d}" as important — they've marked it a deal-breaker.`); dealbreakerHit = true; }

        const weights = { intention: 0.3, geography: 0.2, lifestyle: 0.25, communication: 0.15, values: 0.1 };
        let weightedSum = 0, weightTotal = 0;
        for (const d of dims) { if (d.score == null) continue; weightedSum += d.score * weights[d.key]; weightTotal += weights[d.key]; }
        let pct = weightTotal > 0 ? Math.round((weightedSum / weightTotal) * 100) : null;
        if (dealbreakerHit && pct != null) pct = Math.min(pct, 35);
        for (const d of dims) if (d.score != null && d.score < 0.3) challenges.push(`${d.label} looks like a stretch based on what you've both shared.`);
        return { score: pct, dealbreakerHit, breakdown: dims.map(d => ({ ...d, strength: strength(d.score), score: d.score == null ? null : Math.round(d.score * 100) })), challenges: challenges.slice(0, 3) };
      }

      const presenceFor = async (ids) => {
        if (!ids.length) return {};
        const { data } = await svc.from("presence").select("user_id, status").in("user_id", ids);
        const map = {};
        for (const row of data || []) map[row.user_id] = row.status === "offline" ? "offline" : "online";
        return map;
      };

      if (method === "GET" && (action === "" || action === "profile")) {
        const mine = await ensureOwnRow();
        return sendJson(res, 200, { profile: mine, introductionsRemaining: Math.max(0, 7 - (mine.introductions_used || 0)) });
      }

      if (method === "POST" && action === "update") {
        const body = await readBody(req);
        const allowed = ["active", "relationship_status", "open_to_dating", "intention", "photos", "bio", "geography", "lifestyle", "communication", "values"];
        const patch = { user_id: user.id, updated_at: new Date().toISOString() };
        for (const k of allowed) if (body[k] !== undefined) patch[k] = body[k];
        if (Array.isArray(patch.photos) && patch.photos.length > 6) return sendJson(res, 400, { error: "Up to 6 Date Me photos." });
        await ensureOwnRow();
        const { data, error } = await sb.from("date_me_profiles").update(patch).eq("user_id", user.id).select().maybeSingle();
        if (error) return sendJson(res, 400, { error: error.message });
        await logSecurityEvent(user.id, "date_me_profile_updated", { severity: "info", description: "Citizen updated their Date Me Passport." });
        return sendJson(res, 200, { profile: data });
      }

      if (method === "POST" && action === "relationship") {
        const body = await readBody(req);
        const { data, error } = await sb.from("date_me_profiles")
          .update({ relationship_active: !!body.inRelationship, updated_at: new Date().toISOString() })
          .eq("user_id", user.id).select().maybeSingle();
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { profile: data });
      }

      if (method === "GET" && action === "discover") {
        const mine = await ensureOwnRow();
        const { data: pool, error } = await svc.from("date_me_profiles")
          .select("user_id, intention, geography, lifestyle, communication, values, photos, bio, updated_at")
          .eq("active", true).eq("relationship_active", false).neq("user_id", user.id).limit(60);
        if (error) return sendJson(res, 400, { error: error.message });

        if (!mine.active) {
          const presenceMap = await presenceFor((pool || []).map(p => p.user_id));
          return sendJson(res, 200, {
            member: false,
            teaser: (pool || []).slice(0, 12).map(p => ({ online: presenceMap[p.user_id] || "offline", intention: p.intention })),
            message: "This person is available for a Merveil Date Me introduction. Activate Date Me to discover compatible people and let Merveil introduce you.",
          });
        }

        const ids = (pool || []).map(p => p.user_id);
        const [{ data: profilesRows }, presenceMap] = await Promise.all([
          svc.from("profiles").select("id, name, avatar_url, age, city, country, profession").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
          presenceFor(ids),
        ]);
        const byId = Object.fromEntries((profilesRows || []).map(p => [p.id, p]));
        const results = (pool || []).map(p => {
          const identity = byId[p.user_id];
          if (!identity) return null;
          const compat = computeCompatibility(mine, p);
          return {
            id: p.user_id, name: identity.name, photo: p.photos?.[0] || identity.avatar_url || null,
            age: identity.age || null, location: [identity.city, identity.country].filter(Boolean).join(", "),
            profession: identity.profession || null, intention: p.intention, bio: p.bio,
            online: presenceMap[p.user_id] || "offline", compatibility: compat.score,
          };
        }).filter(Boolean).sort((a, b) => (b.compatibility || 0) - (a.compatibility || 0));
        return sendJson(res, 200, { member: true, profiles: results, introductionsRemaining: Math.max(0, 7 - (mine.introductions_used || 0)) });
      }

      if (method === "GET" && action === "view") {
        const targetId = req.query.userId;
        if (!targetId) return sendJson(res, 400, { error: "userId required." });
        const mine = await ensureOwnRow();
        if (!mine.active) return sendJson(res, 403, { error: "Activate Date Me to view full profiles." });
        const [{ data: theirs }, { data: identity }, presenceMap] = await Promise.all([
          svc.from("date_me_profiles").select("*").eq("user_id", targetId).maybeSingle(),
          svc.from("profiles").select("id, name, avatar_url, age, city, country, profession, company_name, languages, skills").eq("id", targetId).maybeSingle(),
          presenceFor([targetId]),
        ]);
        if (!theirs || !theirs.active || theirs.relationship_active) return sendJson(res, 404, { error: "This profile isn't available right now." });
        const compat = computeCompatibility(mine, theirs);
        return sendJson(res, 200, {
          profile: {
            id: targetId, name: identity?.name,
            photos: theirs.photos?.length ? theirs.photos : [identity?.avatar_url].filter(Boolean),
            age: identity?.age, location: [identity?.city, identity?.country].filter(Boolean).join(", "),
            profession: identity?.profession, company: identity?.company_name, languages: identity?.languages,
            bio: theirs.bio, intention: theirs.intention, lifestyle: theirs.lifestyle,
            communication: theirs.communication, geography: theirs.geography, online: presenceMap[targetId] || "offline",
          },
          compatibility: compat,
        });
      }

      if (method === "POST" && action === "introduce") {
        const body = await readBody(req);
        const targetId = body.targetId;
        if (!targetId || targetId === user.id) return sendJson(res, 400, { error: "A valid target is required." });
        const mine = await ensureOwnRow();
        if (!mine.active) return sendJson(res, 403, { error: "Activate Date Me first." });
        if ((mine.introductions_used || 0) >= 7) return sendJson(res, 429, { error: "You've used all 7 active introductions this month. Merveil keeps this limited on purpose — quality over volume." });
        const { data: theirs } = await svc.from("date_me_profiles").select("*").eq("user_id", targetId).maybeSingle();
        if (!theirs || !theirs.active || theirs.relationship_active) return sendJson(res, 404, { error: "This person isn't available for an introduction right now." });
        const { data: existing } = await svc.from("date_me_introductions").select("id, status")
          .or(`and(initiator_id.eq.${user.id},target_id.eq.${targetId}),and(initiator_id.eq.${targetId},target_id.eq.${user.id})`)
          .in("status", ["pending", "accepted"]).maybeSingle();
        if (existing) return sendJson(res, 409, { error: existing.status === "accepted" ? "You're already connected through Date Me." : "Merveil has already proposed this introduction." });
        const compat = computeCompatibility(mine, theirs);
        if (compat.dealbreakerHit) {
          return sendJson(res, 200, { declinedByMerveil: true, reason: "I don't recommend an introduction right now — there's a real conflict between what one of you has ruled out and what the other considers important." });
        }
        const { data: intro, error } = await svc.from("date_me_introductions")
          .insert({ initiator_id: user.id, target_id: targetId, status: "pending", compatibility_score: compat.score, compatibility_breakdown: compat.breakdown })
          .select().maybeSingle();
        if (error) return sendJson(res, 400, { error: error.message });
        await sb.from("date_me_profiles").update({ introductions_used: (mine.introductions_used || 0) + 1 }).eq("user_id", user.id);
        return sendJson(res, 200, { introduction: intro });
      }

      if (method === "GET" && action === "introductions") {
        const { data, error } = await svc.from("date_me_introductions").select("*")
          .or(`initiator_id.eq.${user.id},target_id.eq.${user.id}`).order("created_at", { ascending: false });
        if (error) return sendJson(res, 400, { error: error.message });
        const otherIds = [...new Set((data || []).map(i => (i.initiator_id === user.id ? i.target_id : i.initiator_id)))];
        const { data: identities } = otherIds.length ? await svc.from("profiles").select("id, name, avatar_url").in("id", otherIds) : { data: [] };
        const byId = Object.fromEntries((identities || []).map(p => [p.id, p]));
        const rows = (data || []).map(i => {
          const otherId = i.initiator_id === user.id ? i.target_id : i.initiator_id;
          return {
            id: i.id, direction: i.initiator_id === user.id ? "sent" : "received", status: i.status,
            compatibilityScore: i.compatibility_score, compatibilityBreakdown: i.compatibility_breakdown,
            conversationId: i.conversation_id, createdAt: i.created_at,
            other: byId[otherId] ? { id: otherId, name: byId[otherId].name, avatarUrl: byId[otherId].avatar_url } : null,
          };
        });
        return sendJson(res, 200, { introductions: rows });
      }

      if (method === "POST" && action === "respond") {
        const body = await readBody(req);
        const { introId, decision } = body || {};
        if (!introId || !["accept", "decline"].includes(decision)) return sendJson(res, 400, { error: "introId and a valid decision are required." });
        const { data: intro } = await sb.from("date_me_introductions").select("*").eq("id", introId).eq("target_id", user.id).eq("status", "pending").maybeSingle();
        if (!intro) return sendJson(res, 404, { error: "No pending introduction found." });
        if (decision === "decline") {
          await sb.from("date_me_introductions").update({ status: "declined", responded_at: new Date().toISOString() }).eq("id", introId);
          return sendJson(res, 200, { status: "declined" });
        }
        const { data: convo, error: convoErr } = await svc.from("conversations")
          .insert({ participant_ids: [intro.initiator_id, intro.target_id], context_label: "date_me" }).select().maybeSingle();
        if (convoErr) return sendJson(res, 400, { error: convoErr.message });
        await sb.from("date_me_introductions").update({ status: "accepted", responded_at: new Date().toISOString(), conversation_id: convo.id }).eq("id", introId);
        return sendJson(res, 200, { status: "accepted", conversationId: convo.id });
      }

      return sendJson(res, 404, { error: "Not found" });
    }

    // ------------------------------------------------------ /api/admin-auth
    // Private admin identity. Never linked from citizen UI, never trusts
    // a citizen session. Separate cookie, separate token, separate table.
    // TEMPORARY DIAGNOSTIC — remove once the service-role key issue is
    // confirmed fixed. Raw fetch straight to Supabase's REST API (bypassing
    // the JS client) so we see the actual HTTP status/body it returns for
    // this key, not a possibly-swallowed client-side error shape.
    if (resource === "diag" && req.query.action === "svc-check") {
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || "";
      const out = { hasEnvVar: !!key, keyLength: key.length, keyPrefix: key.slice(0, 12), keyLooksLikeJwt: key.split(".").length === 3 };
      try {
        const r = await fetch("https://dixfybqlepticyudikuz.supabase.co/rest/v1/admin_users?select=id&limit=1", {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
        });
        out.httpStatus = r.status;
        out.body = await r.text();
      } catch (e) {
        out.fetchThrew = e.message;
      }
      return sendJson(res, 200, out);
    }

    if (resource === "admin-auth") {
      const svc = adminClient();
      const action = req.query.action;

      if (action === "activate" && method === "POST") {
        const body = await readBody(req);
        const { activationCode, password, name } = body || {};
        if (!activationCode || !password) return sendJson(res, 400, { error: "Activation code and password are required." });
        if (String(password).length < 12) return sendJson(res, 400, { error: "Admin passwords must be at least 12 characters." });
        const okRate = await checkRateLimit(anonClient(), `admin_activate_${String(req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim()}`);
        if (!okRate) return sendJson(res, 429, { error: "Too many attempts — wait a few minutes and try again." });
        const { data: pending, error: pendingErr } = await svc
          .from("admin_users")
          .select("id, activation_expires_at, status, name")
          .eq("activation_code", activationCode)
          .maybeSingle();
        // BUG FIX (Aug 2026): this used to only look at `pending` and
        // ignore `error`, so a broken/misconfigured service-role key (the
        // query itself failing, not just finding no row) showed the exact
        // same "Invalid or already-used activation code" message as a
        // genuinely wrong code — impossible to tell apart. Now a real
        // query failure surfaces honestly instead of hiding behind that.
        if (pendingErr) {
          console.error("[admin-auth/activate] admin_users lookup failed:", pendingErr.message);
          return sendJson(res, 500, { error: "Server error — please try again in a moment." });
        }
        if (!pending) return sendJson(res, 400, { error: "Invalid or already-used activation code." });
        if (pending.status !== "pending") return sendJson(res, 400, { error: "This account is already activated." });
        if (!pending.activation_expires_at || new Date(pending.activation_expires_at).getTime() < Date.now()) {
          return sendJson(res, 400, { error: "This activation code has expired. Ask a Super Admin to issue a new one." });
        }
        await svc.from("admin_users").update({
          password_hash: hashPassword(password),
          name: name || pending.name,
          status: "active",
          activation_code: null,
          activation_expires_at: null,
        }).eq("id", pending.id);
        await writeAdminAudit(pending.id, "account_activated", { targetType: "admin_user", targetId: pending.id });
        return sendJson(res, 200, { ok: true });
      }

      if (action === "login" && method === "POST") {
        const body = await readBody(req);
        const { email, password } = body || {};
        if (!email || !password) return sendJson(res, 400, { error: "Email and password are required." });
        const anon = anonClient();
        const okRate = await checkRateLimit(anon, `admin_${String(email).toLowerCase()}`);
        if (!okRate) return sendJson(res, 429, { error: "Too many attempts — wait a few minutes and try again." });
        const { data: admin, error: adminErr } = await svc
          .from("admin_users")
          .select("id, email, name, password_hash, status, role_id")
          .eq("email", String(email).toLowerCase())
          .maybeSingle();
        // Same fix as activate above — a broken service-role key should
        // never look identical to "wrong password."
        if (adminErr) {
          console.error("[admin-auth/login] admin_users lookup failed:", adminErr.message);
          return sendJson(res, 500, { error: "Server error — please try again in a moment." });
        }
        if (!admin || admin.status !== "active" || !verifyPassword(password, admin.password_hash)) {
          if (admin) await writeAdminAudit(admin.id, "login_failed", { riskLevel: "medium" });
          return sendJson(res, 401, { error: "Invalid credentials." });
        }
        const token = newToken();
        const expiresAt = new Date(Date.now() + ADMIN_SESSION_HOURS * 60 * 60 * 1000).toISOString();
        await svc.from("admin_sessions").insert({
          admin_id: admin.id,
          token_hash: hashToken(token),
          expires_at: expiresAt,
          ip: String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || null,
          device_info: { userAgent: req.headers["user-agent"] || null },
        });
        await svc.from("admin_users").update({ last_login_at: new Date().toISOString() }).eq("id", admin.id);
        await writeAdminAudit(admin.id, "login", { riskLevel: "low" });
        setAdminCookie(res, token);
        const { data: role } = await svc.from("admin_roles").select("key, name, permissions").eq("id", admin.role_id).maybeSingle();
        return sendJson(res, 200, { admin: { id: admin.id, email: admin.email, name: admin.name, role: role?.key, roleName: role?.name, permissions: role?.permissions || [] } });
      }

      if (action === "logout" && method === "POST") {
        const ctx = await getAdminSession(req);
        if (ctx) {
          await svc.from("admin_sessions").update({ revoked_at: new Date().toISOString() }).eq("id", ctx.sessionId);
          await writeAdminAudit(ctx.admin.id, "logout");
        }
        clearAdminCookie(res);
        return sendJson(res, 200, { ok: true });
      }

      if (action === "me" && method === "GET") {
        const ctx = await getAdminSession(req);
        if (!ctx) return sendJson(res, 401, { error: "Not signed in." });
        return sendJson(res, 200, { admin: { id: ctx.admin.id, email: ctx.admin.email, name: ctx.admin.name, role: ctx.role, roleName: ctx.roleName, permissions: ctx.permissions } });
      }

      return sendJson(res, 404, { error: "Not found" });
    }

    // ---------------------------------------------------------- /api/console
    // RBAC-gated admin data endpoints. Every branch checks a specific
    // permission string — see admin_roles.permissions (doc 3, §20).
    if (resource === "console") {
      const ctx = await getAdminSession(req);
      if (!ctx) return sendJson(res, 401, { error: "Admin sign-in required." });
      const svc = adminClient();
      const action = req.query.action;

      if (action === "overview" && method === "GET") {
        if (!hasPermission(ctx, "analytics.read") && ctx.role !== "super_admin") return sendJson(res, 403, { error: "Not authorized." });
        const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const [{ count: totalCitizens }, { count: newCitizens }, { count: suspended }, { count: activeSessions }, { data: recentEvents }] = await Promise.all([
          svc.from("profiles").select("*", { count: "exact", head: true }),
          svc.from("profiles").select("*", { count: "exact", head: true }).gt("created_at", since7d),
          svc.from("profiles").select("*", { count: "exact", head: true }).eq("suspended", true),
          svc.from("user_sessions").select("*", { count: "exact", head: true }).is("revoked_at", null),
          svc.from("security_events").select("severity").gt("created_at", since24h),
        ]);
        const bySeverity = { info: 0, low: 0, elevated: 0, high: 0, critical: 0 };
        (recentEvents || []).forEach((e) => { if (bySeverity[e.severity] != null) bySeverity[e.severity]++; });
        return sendJson(res, 200, { totalCitizens: totalCitizens || 0, newCitizens7d: newCitizens || 0, suspended: suspended || 0, activeSessions: activeSessions || 0, securityEvents24h: bySeverity });
      }

      // AI monitoring — real numbers off ai_usage, the same table every
      // usage-limit check in the app reads from. No cost/token estimate
      // shown, on purpose: this app never records per-message token
      // counts, so a AED-cost figure here would be a guess dressed up as
      // a number. Message counts and per-tier breakdown are real.
      if (action === "ai-usage" && method === "GET") {
        if (!hasPermission(ctx, "analytics.read") && ctx.role !== "super_admin") return sendJson(res, 403, { error: "Not authorized." });
        const today = new Date().toISOString().slice(0, 10);
        const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const [{ data: todayRows }, { data: weekRows }] = await Promise.all([
          svc.from("ai_usage").select("user_id, message_count").eq("usage_date", today),
          svc.from("ai_usage").select("user_id, message_count, usage_date").gte("usage_date", since7d),
        ]);
        const totalToday = (todayRows || []).reduce((s, r) => s + (r.message_count || 0), 0);
        const uniqueUsersToday = new Set((todayRows || []).map((r) => r.user_id)).size;
        const totalWeek = (weekRows || []).reduce((s, r) => s + (r.message_count || 0), 0);

        const topIds = [...(todayRows || [])].sort((a, b) => (b.message_count || 0) - (a.message_count || 0)).slice(0, 10).map((r) => r.user_id);
        const { data: topProfiles } = topIds.length
          ? await svc.from("profiles").select("id, name, junction_id, passport_tier").in("id", topIds)
          : { data: [] };
        const profileMap = Object.fromEntries((topProfiles || []).map((p) => [p.id, p]));
        const topUsers = (todayRows || [])
          .sort((a, b) => (b.message_count || 0) - (a.message_count || 0))
          .slice(0, 10)
          .map((r) => ({ ...profileMap[r.user_id], messageCount: r.message_count }));

        const byTier = {};
        for (const r of todayRows || []) {
          const tier = profileMap[r.user_id]?.passport_tier;
          // topProfiles only covers the top 10 — for a full tier
          // breakdown we need every today-active user's tier, so fetch
          // the rest separately rather than silently under-counting.
        }
        const allTodayIds = [...new Set((todayRows || []).map((r) => r.user_id))];
        const { data: allTodayProfiles } = allTodayIds.length
          ? await svc.from("profiles").select("id, passport_tier").in("id", allTodayIds)
          : { data: [] };
        const tierMap = Object.fromEntries((allTodayProfiles || []).map((p) => [p.id, p.passport_tier || "ordinary"]));
        const tierCounts = {};
        for (const r of todayRows || []) {
          const tier = tierMap[r.user_id] || "ordinary";
          tierCounts[tier] = (tierCounts[tier] || 0) + (r.message_count || 0);
        }

        return sendJson(res, 200, { totalToday, uniqueUsersToday, totalWeek, byTier: tierCounts, topUsers });
      }

      if (action === "citizens" && method === "GET") {
        if (!hasPermission(ctx, "support.accounts.read") && ctx.role !== "super_admin") return sendJson(res, 403, { error: "Not authorized." });
        const q = (req.query.q || "").trim();
        let query = svc.from("profiles").select("id, name, email, junction_id, passport_tier, is_admin, suspended, country, created_at, last_seen_at").order("created_at", { ascending: false }).limit(50);
        if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,junction_id.ilike.%${q}%`);
        const { data, error } = await query;
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { citizens: data || [] });
      }

      if (action === "citizen-status" && method === "POST") {
        if (!hasPermission(ctx, "support.cases.update") && ctx.role !== "super_admin") return sendJson(res, 403, { error: "Not authorized." });
        const body = await readBody(req);
        const { citizenId, suspended } = body || {};
        if (!citizenId) return sendJson(res, 400, { error: "citizenId required." });
        await svc.from("profiles").update({ suspended: !!suspended, suspended_at: suspended ? new Date().toISOString() : null }).eq("id", citizenId);
        await writeAdminAudit(ctx.admin.id, suspended ? "citizen_suspended" : "citizen_restored", { targetType: "citizen", targetId: citizenId, riskLevel: "medium" });
        await logSecurityEvent(citizenId, "admin_action", { severity: "elevated", description: suspended ? "Account suspended by admin." : "Account restored by admin." });
        return sendJson(res, 200, { ok: true });
      }

      if (action === "security-events" && method === "GET") {
        if (!hasPermission(ctx, "security.alerts.read") && ctx.role !== "super_admin") return sendJson(res, 403, { error: "Not authorized." });
        const { data, error } = await svc.from("security_events").select("id, user_id, event_type, severity, description, created_at").order("created_at", { ascending: false }).limit(100);
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { events: data || [] });
      }

      if (action === "sessions" && method === "GET") {
        if (!hasPermission(ctx, "security.sessions.read") && ctx.role !== "super_admin") return sendJson(res, 403, { error: "Not authorized." });
        const { data, error } = await svc.from("user_sessions").select("id, user_id, device_name, device_type, browser, os, ip, created_at, last_active_at, revoked_at").order("last_active_at", { ascending: false }).limit(100);
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { sessions: data || [] });
      }

      if (action === "revoke-session" && method === "POST") {
        if (!hasPermission(ctx, "security.sessions.revoke") && ctx.role !== "super_admin") return sendJson(res, 403, { error: "Not authorized." });
        const body = await readBody(req);
        if (!body.sessionId) return sendJson(res, 400, { error: "sessionId required." });
        await svc.from("user_sessions").update({ revoked_at: new Date().toISOString() }).eq("id", body.sessionId);
        await writeAdminAudit(ctx.admin.id, "session_revoked", { targetType: "user_session", targetId: body.sessionId, riskLevel: "medium" });
        return sendJson(res, 200, { ok: true });
      }

      if (action === "audit-log" && method === "GET") {
        if (!hasPermission(ctx, "audit.read") && ctx.role !== "super_admin") return sendJson(res, 403, { error: "Not authorized." });
        const { data, error } = await svc.from("admin_audit_log").select("id, admin_id, action, target_type, target_id, details, risk_level, created_at").order("created_at", { ascending: false }).limit(100);
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { log: data || [] });
      }

      if (action === "reports" && method === "GET") {
        if (!hasPermission(ctx, "safety.reports.read") && ctx.role !== "super_admin") return sendJson(res, 403, { error: "Not authorized." });
        const statusFilter = req.query.status || null;
        let query = svc.from("reports").select("id, reporter_id, target_type, target_id, category, description, status, priority, resolution_note, created_at, resolved_at").order("created_at", { ascending: false }).limit(100);
        if (statusFilter) query = query.eq("status", statusFilter);
        const { data, error } = await query;
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { reports: data || [] });
      }

      if (action === "report-decision" && method === "POST") {
        if (!hasPermission(ctx, "safety.cases.update") && ctx.role !== "super_admin") return sendJson(res, 403, { error: "Not authorized." });
        const body = await readBody(req);
        const { reportId, status, resolutionNote } = body || {};
        if (!reportId || !status) return sendJson(res, 400, { error: "reportId and status are required." });
        if (!["reviewing", "action_taken", "dismissed"].includes(status)) return sendJson(res, 400, { error: "Invalid status." });
        const patch = { status, assigned_admin_id: ctx.admin.id };
        if (resolutionNote) patch.resolution_note = resolutionNote;
        if (status === "action_taken" || status === "dismissed") patch.resolved_at = new Date().toISOString();
        const { error } = await svc.from("reports").update(patch).eq("id", reportId);
        if (error) return sendJson(res, 400, { error: error.message });
        await writeAdminAudit(ctx.admin.id, `report_${status}`, { targetType: "report", targetId: reportId, riskLevel: status === "action_taken" ? "high" : "low" });
        return sendJson(res, 200, { ok: true });
      }

      if (action === "fraud-signals" && method === "GET") {
        if (!hasPermission(ctx, "fraud.cases.read") && !hasPermission(ctx, "fraud.risk.read") && ctx.role !== "super_admin") return sendJson(res, 403, { error: "Not authorized." });
        // Explainable, rule-based signals computed from data that already
        // exists — not a black-box score. Doc 3 §43 is explicit that risk
        // scoring must come with named signals, so that's what this
        // returns: exactly which rule fired and why, per account.
        const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        const [{ data: sessions }, { data: failedEvents }, { data: openReports }, { data: newAccounts }] = await Promise.all([
          svc.from("user_sessions").select("user_id, ip").not("ip", "is", null).gt("created_at", since30d),
          svc.from("security_events").select("user_id").in("event_type", ["login_failed", "reauth_failed"]).gt("created_at", since30d),
          svc.from("reports").select("target_id").eq("target_type", "profile").neq("status", "dismissed"),
          svc.from("profiles").select("id").gt("created_at", since48h),
        ]);

        const ipMap = {};
        (sessions || []).forEach((s) => { (ipMap[s.ip] ||= new Set()).add(s.user_id); });
        const sharedIpUsers = new Set();
        Object.values(ipMap).forEach((set) => { if (set.size >= 2) set.forEach((u) => sharedIpUsers.add(u)); });

        const failCounts = {};
        (failedEvents || []).forEach((e) => { if (e.user_id) failCounts[e.user_id] = (failCounts[e.user_id] || 0) + 1; });

        const reportCounts = {};
        (openReports || []).forEach((r) => { reportCounts[r.target_id] = (reportCounts[r.target_id] || 0) + 1; });

        const newIds = new Set((newAccounts || []).map((a) => a.id));

        const allIds = new Set([...sharedIpUsers, ...Object.keys(failCounts), ...Object.keys(reportCounts)]);
        let cases = [...allIds].map((id) => {
          const signals = [];
          let score = 0;
          if (sharedIpUsers.has(id)) { signals.push("Shares a device/network with another Merveil account"); score += 30; }
          if (failCounts[id] >= 3) { signals.push(`${failCounts[id]} failed sign-in/re-auth attempts in the last 30 days`); score += 25; }
          if (reportCounts[id] >= 2) { signals.push(`${reportCounts[id]} open citizen reports against this profile`); score += 35; }
          if (newIds.has(id) && (failCounts[id] || reportCounts[id])) { signals.push("Account is under 48 hours old and already flagged"); score += 20; }
          return { userId: id, score: Math.min(score, 100), signals };
        }).filter((c) => c.score > 0).sort((a, b) => b.score - a.score).slice(0, 50);

        if (cases.length) {
          const { data: names } = await svc.from("profiles").select("id, name, email, junction_id, suspended").in("id", cases.map((c) => c.userId));
          const nameMap = Object.fromEntries((names || []).map((n) => [n.id, n]));
          cases = cases.map((c) => ({ ...c, profile: nameMap[c.userId] || null }));
        }
        return sendJson(res, 200, { cases });
      }

      if (action === "property-signals" && method === "GET") {
        if (!hasPermission(ctx, "property.read") && ctx.role !== "super_admin") return sendJson(res, 403, { error: "Not authorized." });
        const { data: props } = await svc.from("properties").select("id, owner_id, title, area, price, created_at").order("created_at", { ascending: false }).limit(500);
        const groups = {};
        (props || []).forEach((p) => {
          const key = `${(p.title || "").trim().toLowerCase()}|${(p.area || "").trim().toLowerCase()}`;
          if (!key.trim()) return;
          (groups[key] ||= []).push(p);
        });
        let cases = Object.values(groups)
          .filter((g) => new Set(g.map((p) => p.owner_id)).size >= 2)
          .map((g) => ({
            title: g[0].title,
            area: g[0].area,
            listingIds: g.map((p) => p.id),
            ownerCount: new Set(g.map((p) => p.owner_id)).size,
            signals: [`Same title + area posted by ${new Set(g.map((p) => p.owner_id)).size} different accounts`],
          }))
          .sort((a, b) => b.ownerCount - a.ownerCount)
          .slice(0, 50);
        return sendJson(res, 200, { cases });
      }

      if (action === "platform-stats" && method === "GET") {
        if (!hasPermission(ctx, "analytics.read") && ctx.role !== "super_admin") return sendJson(res, 403, { error: "Not authorized." });
        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const count = async (table, filters = {}) => {
          let q = svc.from(table).select("*", { count: "exact", head: true });
          for (const [k, v] of Object.entries(filters)) q = q.gt(k, v);
          const { count: n } = await q;
          return n || 0;
        };
        const [usersTotal, users24h, users7d, properties, services, jobs, jobApplications, circles, events, messages24h] = await Promise.all([
          count("profiles"), count("profiles", { created_at: since24h }), count("profiles", { created_at: since7d }),
          count("properties"), count("services"), count("jobs"), count("job_applications"), count("circles"), count("events"),
          count("messages", { created_at: since24h }),
        ]);
        const { data: recentUsers } = await svc.from("profiles").select("id,name,email,country,created_at").order("created_at", { ascending: false }).limit(10);
        const { data: recentProperties } = await svc.from("properties").select("id,title,area,price,created_at").order("created_at", { ascending: false }).limit(10);
        return sendJson(res, 200, {
          totals: { users: usersTotal, properties, services, jobs, jobApplications, circles, events },
          activity: { users24h, users7d, messages24h },
          recent: { users: recentUsers || [], properties: recentProperties || [] },
        });
      }

      if (action === "sponsored" && method === "GET") {
        if (ctx.role !== "super_admin") return sendJson(res, 403, { error: "Super Admin only." });
        const { data, error } = await svc.from("sponsored_slots").select("*, properties(id,title,area,price,photo_url,photo_urls)").order("created_at", { ascending: false });
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { slots: data || [] });
      }

      if (action === "sponsored" && method === "POST") {
        if (ctx.role !== "super_admin") return sendJson(res, 403, { error: "Super Admin only." });
        const body = await readBody(req);
        if (!body.developerName || !body.headline) return sendJson(res, 400, { error: "developerName and headline required" });
        const { data, error } = await svc.from("sponsored_slots").insert({
          property_id: body.propertyId || null,
          developer_name: body.developerName,
          headline: body.headline,
          badge_label: body.badgeLabel || "Sponsored",
          placement: body.placement === "investor" ? "investor" : "feed",
          created_by: null,
        }).select().maybeSingle();
        if (error) return sendJson(res, 400, { error: error.message });
        await writeAdminAudit(ctx.admin.id, "sponsored_slot_created", { targetType: "sponsored_slot", targetId: data.id });
        return sendJson(res, 200, { slot: data });
      }

      if (action === "sponsored" && method === "PATCH") {
        if (ctx.role !== "super_admin") return sendJson(res, 403, { error: "Super Admin only." });
        const body = await readBody(req);
        if (!body.id) return sendJson(res, 400, { error: "id required" });
        const { error } = await svc.from("sponsored_slots").update({ active: !!body.active }).eq("id", body.id);
        if (error) return sendJson(res, 400, { error: error.message });
        await writeAdminAudit(ctx.admin.id, "sponsored_slot_toggled", { targetType: "sponsored_slot", targetId: body.id });
        return sendJson(res, 200, { ok: true });
      }

      if (action === "sponsored" && method === "DELETE") {
        if (ctx.role !== "super_admin") return sendJson(res, 403, { error: "Super Admin only." });
        const body = await readBody(req);
        if (!body.id) return sendJson(res, 400, { error: "id required" });
        const { error } = await svc.from("sponsored_slots").delete().eq("id", body.id);
        if (error) return sendJson(res, 400, { error: error.message });
        await writeAdminAudit(ctx.admin.id, "sponsored_slot_deleted", { targetType: "sponsored_slot", targetId: body.id, riskLevel: "medium" });
        return sendJson(res, 200, { ok: true });
      }

      if (action === "admins" && method === "GET") {
        if (ctx.role !== "super_admin") return sendJson(res, 403, { error: "Super Admin only." });
        const { data, error } = await svc.from("admin_users").select("id, email, name, status, role_id, mfa_enabled, created_at, last_login_at, admin_roles(key, name)").order("created_at", { ascending: false });
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { admins: data || [] });
      }

      if (action === "create-admin" && method === "POST") {
        if (ctx.role !== "super_admin") return sendJson(res, 403, { error: "Super Admin only." });
        const body = await readBody(req);
        const { email, name, roleKey } = body || {};
        if (!email || !name || !roleKey) return sendJson(res, 400, { error: "email, name, and roleKey are required." });
        const { data: role } = await svc.from("admin_roles").select("id").eq("key", roleKey).maybeSingle();
        if (!role) return sendJson(res, 400, { error: "Unknown role." });
        const activationCode = newActivationCode();
        const { data: created, error } = await svc.from("admin_users").insert({
          email: String(email).toLowerCase(),
          name,
          role_id: role.id,
          password_hash: "",
          status: "pending",
          activation_code: activationCode,
          activation_expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          created_by: ctx.admin.id,
        }).select().maybeSingle();
        if (error) return sendJson(res, 400, { error: error.message });
        await writeAdminAudit(ctx.admin.id, "admin_created", { targetType: "admin_user", targetId: created.id, riskLevel: "high" });
        // Activation code is returned once, here, to the Super Admin only —
        // it is never stored anywhere in plaintext logs or emailed by this
        // endpoint. Deliver it to the new admin out-of-band.
        return sendJson(res, 200, { admin: created, activationCode });
      }

      // Real call metadata for admin visibility (doc 3 §12-13) — never the
      // audio/video itself, just what the admin console already surfaces
      // for every other resource: who, when, how long, what status.
      if (action === "calls-recent" && method === "GET") {
        if (!hasPermission(ctx, "security.sessions.read") && !hasPermission(ctx, "analytics.read") && ctx.role !== "super_admin") {
          return sendJson(res, 403, { error: "Not authorized." });
        }
        const { data, error } = await svc.from("calls")
          .select("id, caller_id, receiver_id, type, status, created_at, connected_at, ended_at, duration_seconds")
          .order("created_at", { ascending: false }).limit(100);
        if (error) return sendJson(res, 400, { error: error.message });
        const ids = [...new Set((data || []).flatMap((c) => [c.caller_id, c.receiver_id]))];
        const { data: profiles } = ids.length
          ? await svc.from("profiles").select("id, name, junction_id").in("id", ids)
          : { data: [] };
        const nameMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
        const calls = (data || []).map((c) => ({ ...c, caller: nameMap[c.caller_id] || null, receiver: nameMap[c.receiver_id] || null }));
        return sendJson(res, 200, { calls });
      }

      if (action === "call-restrict" && method === "POST") {
        if (!hasPermission(ctx, "support.cases.update") && ctx.role !== "super_admin") return sendJson(res, 403, { error: "Not authorized." });
        const body = await readBody(req);
        const { citizenId, level, reason, expiresInHours } = body || {};
        if (!citizenId || !["normal", "voice_only", "disabled"].includes(level)) {
          return sendJson(res, 400, { error: "citizenId and a valid level ('normal'|'voice_only'|'disabled') are required." });
        }
        if (level !== "normal" && !reason) return sendJson(res, 400, { error: "A reason is required when restricting an account." });
        const patch = {
          call_restriction: level,
          call_restriction_reason: level === "normal" ? null : reason,
          call_restriction_expires_at: level !== "normal" && expiresInHours ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString() : null,
          call_restricted_by: level === "normal" ? null : ctx.admin.id,
          call_restricted_at: level === "normal" ? null : new Date().toISOString(),
        };
        const { error } = await svc.from("profiles").update(patch).eq("id", citizenId);
        if (error) return sendJson(res, 400, { error: error.message });
        await writeAdminAudit(ctx.admin.id, "call_restriction_set", { targetType: "citizen", targetId: citizenId, riskLevel: level === "disabled" ? "high" : "medium", details: { level, reason } });
        return sendJson(res, 200, { ok: true });
      }

      return sendJson(res, 404, { error: "Not found" });
    }

    // ----------------------------------------------------------- /api/admin
    // NOTE: the old /api/admin route (gated only by a citizen-session
    // is_admin flag) has been removed on purpose — that was the exact
    // "citizen identity == admin identity" pattern doc 3 says not to
    // have. Its two real capabilities (platform stats, sponsored slot
    // management) now live under /api/console, gated by the real admin
    // RBAC session instead. See action=platform-stats and
    // action=sponsored below, inside the /api/console block.

    // ------------------------------------------------------ /api/assistant
    // Merveil AI chat — YOUR API (OpenAI-compatible). Not Anthropic.
    // Env (server only):
    //   AI_API_URL  — e.g. https://api.x.ai/v1  or https://your-host/v1
    //                 or full .../chat/completions
    //   AI_API_KEY  — Bearer token
    //   AI_MODEL    — model id (optional)
    // Aliases: XAI_API_URL / XAI_API_KEY / XAI_MODEL
    if (resource === "assistant" && method === "POST") {
      if (!user) return sendJson(res, 401, { error: "Sign in required." });
      const body = await readBody(req);
      const { system, messages, maxTokens } = body || {};
      if (!Array.isArray(messages) || messages.length === 0) {
        return sendJson(res, 400, { error: "`messages` must be a non-empty array" });
      }

      const usage = await checkAiUsageAllowed(sb, user.id);
      if (!usage.allowed) {
        return sendJson(res, 429, {
          error: `Daily Merveil AI limit reached (${usage.used}/${usage.limit}) for your Passport tier. Try again tomorrow or upgrade your Passport.`,
        });
      }

      const apiUrl = (process.env.AI_API_URL || process.env.XAI_API_URL || "").replace(/\/$/, "");
      const apiKey = process.env.AI_API_KEY || process.env.XAI_API_KEY || "";
      const model = process.env.AI_MODEL || process.env.XAI_MODEL || "grok-2-latest";

      if (!apiUrl || !apiKey) {
        return sendJson(res, 500, {
          error:
            "Merveil AI is not configured. Set AI_API_URL and AI_API_KEY (or XAI_API_URL / XAI_API_KEY) on the server, then redeploy.",
        });
      }

      const systemText =
        typeof system === "string" && system.trim()
          ? system.slice(0, 12000)
          : "You are Merveil AI, a helpful assistant inside the Merveil UAE super-app for real estate, jobs, services, and networking. Be concise and useful. Never pretend to be a human.";

      const safeMessages = messages
        .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-20)
        .map((m) => ({ role: m.role, content: String(m.content).slice(0, 8000) }));
      if (!safeMessages.length) {
        return sendJson(res, 400, { error: "No valid user/assistant messages." });
      }

      const chatMessages = [{ role: "system", content: systemText }, ...safeMessages];
      const endpoint = apiUrl.includes("/chat/completions") ? apiUrl : `${apiUrl}/chat/completions`;

      try {
        const upstream = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: chatMessages,
            max_tokens: Math.min(Number(maxTokens) || 600, 2048),
            temperature: 0.7,
          }),
        });

        if (!upstream.ok) {
          const errText = await upstream.text();
          console.error("AI API error:", upstream.status, errText.slice(0, 500));
          return sendJson(res, upstream.status >= 500 ? 502 : upstream.status, {
            error:
              upstream.status === 429
                ? "Merveil AI is busy — try again in a moment."
                : `Merveil AI error (${upstream.status}). Check AI_API_URL / AI_API_KEY / model.`,
          });
        }

        const data = await upstream.json();
        let reply =
          data?.choices?.[0]?.message?.content ||
          data?.reply ||
          data?.content ||
          data?.message ||
          "";
        if (typeof reply !== "string") reply = JSON.stringify(reply);
        reply = String(reply).trim();

        await sb.rpc("increment_ai_usage", { uid: user.id }).catch(() => {});

        return sendJson(res, 200, { reply: reply || "I didn't catch that — try asking again." });
      } catch (err) {
        console.error("Assistant request failed:", err.message);
        return sendJson(res, 500, { error: `Couldn't reach Merveil AI — ${err.message}` });
      }
    }

    // ------------------------------------------------------ /api/assistant-usage
    // Merveil AI costs real money per message (Anthropic API), so usage is
    // capped by Passport tier: Ordinary gets a small daily allowance, Services
    // gets more, Investor is effectively unlimited. Frontend may check before
    // calling /api/assistant; the assistant route also enforces server-side.
    if (resource === "assistant-usage") {
      if (!user) return sendJson(res, 401, { error: "Sign in required." });
      const { data: profile } = await sb.from("profiles").select("passport_tier").eq("id", user.id).maybeSingle();
      const tier = profile?.passport_tier || "ordinary";
      const LIMITS = { ordinary: 10, services: 25, investor: 100000 };
      const limit = LIMITS[tier] ?? LIMITS.ordinary;

      if (method === "GET" && req.query.action === "check") {
        const { data } = await sb.from("ai_usage").select("message_count").eq("user_id", user.id).eq("usage_date", new Date().toISOString().slice(0, 10)).maybeSingle();
        const used = data?.message_count || 0;
        return sendJson(res, 200, { allowed: used < limit, used, limit, tier });
      }

      if (method === "POST" && req.query.action === "log") {
        const { data: newCount } = await sb.rpc("increment_ai_usage", { uid: user.id });
        return sendJson(res, 200, { used: newCount, limit });
      }

      return sendJson(res, 404, { error: "Not found" });
    }

    // -------------------------------------------------- /api/sponsored (public read)
    if (resource === "sponsored" && method === "GET") {
      const placement = req.query.placement === "investor" ? "investor" : "feed";
      const { data, error } = await anonClient()
        .from("sponsored_slots")
        .select("*, properties(id,title,area,price,photo_url,photo_urls)")
        .eq("placement", placement)
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) return sendJson(res, 400, { error: error.message });
      return sendJson(res, 200, { slots: data || [] });
    }
    if (resource === "music" && method === "GET") {
      const { data, error } = await anonClient().from("music_tracks").select("*").order("genre");
      if (error) return sendJson(res, 400, { error: error.message });
      return sendJson(res, 200, { tracks: data || [] });
    }

    // ----------------------------------------------------------- /api/jobs
    if (resource === "jobs") {
      const action = req.query.action;

      if (method === "GET" && action === "likes") {
        if (!user) return sendJson(res, 200, { likedIds: [] });
        const { data } = await sb.from("job_likes").select("job_id").eq("user_id", user.id);
        return sendJson(res, 200, { likedIds: (data || []).map((r) => r.job_id) });
      }

      if (method === "GET") {
        const { data, error } = await anonClient().from("jobs").select("*").order("created_at", { ascending: false }).limit(200);
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { jobs: data || [] });
      }

      if (method === "POST" && action === "view") {
        const body = await readBody(req);
        if (!body.jobId) return sendJson(res, 400, { error: "jobId required" });
        if (await checkRateLimit(anonClient(), `view_job_${getClientIp(req)}`, 60)) {
          await anonClient().rpc("increment_job_views", { jid: body.jobId });
        }
        return sendJson(res, 200, { ok: true });
      }

      if (method === "POST" && action === "like") {
        if (!user) return sendJson(res, 401, { error: "Sign in to like jobs." });
        const body = await readBody(req);
        if (!body.jobId) return sendJson(res, 400, { error: "jobId required" });
        const { data, error } = await sb.rpc("toggle_job_like", { jid: body.jobId }).maybeSingle();
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { liked: data.liked, likesCount: data.likes_count });
      }

      if (method === "POST" && action === "apply") {
        if (!user) return sendJson(res, 401, { error: "Sign in to apply." });
        const body = await readBody(req);
        const { error } = await sb.from("job_applications").upsert({
          job_id: body.jobId,
          applicant_id: user.id,
          message: body.message || null,
        });
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { ok: true });
      }

      if (method === "POST") {
        if (!user) return sendJson(res, 401, { error: "Sign in to post a job." });
        const body = await readBody(req);
        const { data, error } = await sb
          .from("jobs")
          .insert({
            owner_id: user.id,
            title: body.title,
            category: body.category,
            job_type: body.jobType,
            salary_range: body.salaryRange,
            location: body.location,
            description: body.description,
            photo_url: body.photoUrls?.[0] || null,
            video_url: body.videoUrl || null,
            media_type: body.mediaType || (body.videoUrl ? "video" : "photo"),
            music_track_id: body.musicTrackId || null,
          })
          .select()
          .maybeSingle();
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { job: data });
      }

      return sendJson(res, 404, { error: "Not found" });
    }

    // ---------------------------------------------------------- /api/world
    // World — the 4th reel ecosystem: global networking (AI, technology,
    // investors, startups, government projects, universities, tourism,
    // innovation). Same shape as /api/jobs above, on its own table so it
    // doesn't collide with the UAE-scoped ecosystems.
    if (resource === "world") {
      const action = req.query.action;

      if (method === "GET" && action === "likes") {
        if (!user) return sendJson(res, 200, { likedIds: [] });
        const { data } = await sb.from("world_likes").select("world_post_id").eq("user_id", user.id);
        return sendJson(res, 200, { likedIds: (data || []).map((r) => r.world_post_id) });
      }

      if (method === "GET") {
        const { data, error } = await anonClient().from("world_posts").select("*").order("created_at", { ascending: false }).limit(200);
        if (error) return sendJson(res, 400, { error: error.message });
        const posts = data || [];
        const ownerIds = [...new Set(posts.map((p) => p.owner_id).filter(Boolean))];
        let ownerMap = {};
        if (ownerIds.length) {
          const { data: owners } = await anonClient().from("profiles").select("id, name, avatar_url").in("id", ownerIds);
          ownerMap = Object.fromEntries((owners || []).map((o) => [o.id, o]));
        }
        const enriched = posts.map((p) => ({ ...p, owner_name: ownerMap[p.owner_id]?.name || null, owner_avatar: ownerMap[p.owner_id]?.avatar_url || null }));
        return sendJson(res, 200, { posts: enriched });
      }

      if (method === "POST" && action === "view") {
        const body = await readBody(req);
        if (!body.postId) return sendJson(res, 400, { error: "postId required" });
        if (await checkRateLimit(anonClient(), `view_world_${getClientIp(req)}`, 60)) {
          await anonClient().rpc("increment_world_views", { pid: body.postId });
        }
        await anonClient().from("world_post_views").insert({ world_post_id: body.postId, source: body.source || "world_feed" }).select().maybeSingle().catch(() => {});
        return sendJson(res, 200, { ok: true });
      }

      // Intelligent View Analytics — real breakdown of where views came
      // from (world feed, search, profile visit, etc.), not fabricated.
      if (method === "GET" && action === "view-sources") {
        if (!req.query.postId) return sendJson(res, 400, { error: "postId required" });
        const { data, error } = await anonClient().from("world_post_views").select("source").eq("world_post_id", req.query.postId);
        if (error) return sendJson(res, 400, { error: error.message });
        const counts = {};
        for (const r of data || []) counts[r.source] = (counts[r.source] || 0) + 1;
        return sendJson(res, 200, { counts, total: (data || []).length });
      }

      if (method === "POST" && action === "like") {
        if (!user) return sendJson(res, 401, { error: "Sign in to like World posts." });
        const body = await readBody(req);
        if (!body.postId) return sendJson(res, 400, { error: "postId required" });
        const { data, error } = await sb.rpc("toggle_world_like", { pid: body.postId }).maybeSingle();
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { liked: data.liked, likesCount: data.likes_count });
      }

      if (method === "POST" && action === "super") {
        if (!user) return sendJson(res, 401, { error: "Sign in to SUPER a World post." });
        const body = await readBody(req);
        if (!body.postId) return sendJson(res, 400, { error: "postId required" });
        const { data, error } = await sb.rpc("toggle_world_super", { pid: body.postId }).maybeSingle();
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { supered: data.supered, superCount: data.super_count });
      }

      if (method === "GET" && action === "supers") {
        if (!user) return sendJson(res, 200, { superedIds: [] });
        const { data } = await sb.from("world_supers").select("world_post_id").eq("user_id", user.id);
        return sendJson(res, 200, { superedIds: (data || []).map((r) => r.world_post_id) });
      }

      // Saves are private (no public count) — a plain insert/delete is
      // enough, unlike like/super which also track a public counter on
      // the post itself.
      if (method === "POST" && action === "save") {
        if (!user) return sendJson(res, 401, { error: "Sign in to save World posts." });
        const body = await readBody(req);
        if (!body.postId) return sendJson(res, 400, { error: "postId required" });
        const { data: existing } = await sb.from("world_saves").select("id").eq("world_post_id", body.postId).eq("user_id", user.id).maybeSingle();
        if (existing) {
          const { error } = await sb.from("world_saves").delete().eq("id", existing.id);
          if (error) return sendJson(res, 400, { error: error.message });
          return sendJson(res, 200, { saved: false });
        }
        const { error } = await sb.from("world_saves").insert({ world_post_id: body.postId, user_id: user.id });
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { saved: true });
      }

      if (method === "GET" && action === "saves") {
        if (!user) return sendJson(res, 200, { savedIds: [] });
        const { data } = await sb.from("world_saves").select("world_post_id").eq("user_id", user.id);
        return sendJson(res, 200, { savedIds: (data || []).map((r) => r.world_post_id) });
      }
      if (method === "DELETE") {
        if (!user) return sendJson(res, 401, { error: "Sign in required." });
        const body = await readBody(req);
        if (!body.postId) return sendJson(res, 400, { error: "postId required" });
        const { error } = await sb.from("world_posts").delete().eq("id", body.postId).eq("owner_id", user.id);
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { ok: true });
      }

      if (method === "POST") {
        if (!user) return sendJson(res, 401, { error: "Sign in to post on World." });
        const okRate = await checkRateLimit(anonClient(), `world_post_${user.id}`, 20);
        if (!okRate) return sendJson(res, 429, { error: "Too many World posts — wait a few minutes." });
        const body = await readBody(req);
        if (!body.title) return sendJson(res, 400, { error: "title required" });
        const { data, error } = await sb
          .from("world_posts")
          .insert({
            owner_id: user.id,
            title: String(body.title).slice(0, 200),
            topic: body.topic || "Innovation",
            country: body.country || "Global",
            description: body.description ? String(body.description).slice(0, 5000) : null,
            photo_url: body.photoUrls?.[0] || null,
            photo_urls: body.photoUrls || null,
            video_url: body.videoUrl || null,
            media_type: body.mediaType || (body.videoUrl ? "video" : "photo"),
            music_track_id: body.musicTrackId || null,
            content_origin: body.contentOrigin === "ai" ? "ai" : "human",
          })
          .select()
          .maybeSingle();
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { post: data });
      }

      // Intelligent Engagement System — real reaction types beyond a like
      // (Support/Invest/Collaborate/Hire/Request Meeting). Counts are
      // computed live from world_reactions, never a caller-trusted number.
      if (method === "GET" && action === "reactions") {
        if (!req.query.postId) return sendJson(res, 400, { error: "postId required" });
        const { data, error } = await anonClient().from("world_reactions").select("reaction_type, user_id").eq("world_post_id", req.query.postId);
        if (error) return sendJson(res, 400, { error: error.message });
        const counts = {};
        for (const r of data || []) counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1;
        const mine = user ? (data || []).filter((r) => r.user_id === user.id).map((r) => r.reaction_type) : [];
        return sendJson(res, 200, { counts, mine });
      }

      if (method === "POST" && action === "react") {
        if (!user) return sendJson(res, 401, { error: "Sign in to react." });
        const body = await readBody(req);
        const validTypes = ["support", "invest", "collaborate", "hire", "meeting"];
        if (!body.postId || !validTypes.includes(body.reactionType)) return sendJson(res, 400, { error: "postId and a valid reactionType required" });
        const { data: existing } = await sb.from("world_reactions").select("id").eq("world_post_id", body.postId).eq("user_id", user.id).eq("reaction_type", body.reactionType).maybeSingle();
        if (existing) {
          await sb.from("world_reactions").delete().eq("id", existing.id);
          return sendJson(res, 200, { active: false });
        }
        const { error } = await sb.from("world_reactions").insert({ world_post_id: body.postId, user_id: user.id, reaction_type: body.reactionType });
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { active: true });
      }

      return sendJson(res, 404, { error: "Not found" });
    }

    // -------------------------------------------------------- /api/rewards
    // Merveil Citizen Score — real points from real activity across all
    // four ecosystems (Pulse=properties, Souk=services, Work=jobs,
    // World=world_posts), plus a Passport-completion bonus. This is a
    // recognition/tier score, not a payout system — no AED figures are
    // invented here; the reward-pool payout mechanic needs a funded pool
    // and a real payment path before it can show real money (see notes
    // to the team).
    if (resource === "rewards" && method === "GET") {
      if (!user) return sendJson(res, 401, { error: "Sign in required." });

      const ecosystems = [
        { key: "pulse", table: "properties" },
        { key: "souk", table: "services" },
        { key: "work", table: "jobs" },
        { key: "world", table: "world_posts" },
      ];

      const breakdown = {};
      let activityScore = 0;
      for (const eco of ecosystems) {
        const { data, error } = await anonClient()
          .from(eco.table)
          .select("views, likes_count")
          .eq("owner_id", user.id);
        if (error) { breakdown[eco.key] = { posts: 0, views: 0, likes: 0, points: 0 }; continue; }
        const posts = data.length;
        const views = data.reduce((s, r) => s + (r.views || 0), 0);
        const likes = data.reduce((s, r) => s + (r.likes_count || 0), 0);
        const points = posts * 20 + Math.round(views / 10) + likes * 5;
        breakdown[eco.key] = { posts, views, likes, points };
        activityScore += points;
      }

      const { data: profile } = await anonClient().from("profiles").select("*").eq("id", user.id).maybeSingle();
      const completionPct = profile ? [
        20,
        profile.avatar_url ? 15 : 0,
        profile.bio && profile.bio.length > 10 ? 15 : 0,
        profile.city ? 10 : 0,
        profile.profession ? 10 : 0,
        (profile.skills || []).length ? 10 : 0,
        (profile.languages || []).length ? 10 : 0,
        (profile.portfolio_url || profile.website_url) ? 10 : 0,
      ].reduce((a, b) => a + b, 0) : 20;
      const passportBonus = completionPct * 5; // up to 500 pts for a fully complete Passport

      const totalScore = activityScore + passportBonus;
      const tier = totalScore >= 5000 && completionPct >= 95 ? "Platinum"
        : totalScore >= 2000 && completionPct >= 80 ? "Gold"
        : totalScore >= 500 && completionPct >= 60 ? "Silver"
        : "Bronze";

      return sendJson(res, 200, {
        totalScore, activityScore, passportBonus, completionPct, tier, breakdown,
        rewardPoolStatus: "not_yet_funded", // honest — see team notes on the payout mechanic
      });
    }

    // --------------------------------------------------- /api/opportunities
    // AI Opportunity Radar — real matching (keyword overlap between the
    // signed-in user's profession/skills/languages and live jobs/World
    // posts), not a black-box "hundreds of signals" model. Honest scope:
    // a working recommendation feed, not the full Opportunity DNA vision.
    if (resource === "opportunities" && method === "GET") {
      if (!user) return sendJson(res, 401, { error: "Sign in required." });
      const { data: profile } = await anonClient().from("profiles").select("profession, skills, languages, city, country").eq("id", user.id).maybeSingle();
      const signals = [
        profile?.profession,
        ...(profile?.skills || []),
        ...(profile?.languages || []),
        profile?.city,
      ].filter(Boolean).map((s) => String(s).toLowerCase());

      if (signals.length === 0) {
        return sendJson(res, 200, { opportunities: [], reason: "no_signals" });
      }

      const [{ data: jobs }, { data: worldPosts }] = await Promise.all([
        anonClient().from("jobs").select("id, title, category, location, description, created_at").order("created_at", { ascending: false }).limit(100),
        anonClient().from("world_posts").select("id, title, topic, country, description, created_at").order("created_at", { ascending: false }).limit(100),
      ]);

      const score = (haystack) => {
        const h = (haystack || "").toLowerCase();
        return signals.reduce((s, sig) => s + (h.includes(sig) ? 1 : 0), 0);
      };

      const jobMatches = (jobs || []).map((j) => ({
        kind: "job", id: j.id, title: j.title, subtitle: j.category, meta: j.location,
        matchScore: score(`${j.title} ${j.category} ${j.description}`),
      })).filter((m) => m.matchScore > 0);

      const worldMatches = (worldPosts || []).map((w) => ({
        kind: "world", id: w.id, title: w.title, subtitle: w.topic, meta: w.country,
        matchScore: score(`${w.title} ${w.topic} ${w.description}`),
      })).filter((m) => m.matchScore > 0);

      const opportunities = [...jobMatches, ...worldMatches]
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 7);

      return sendJson(res, 200, { opportunities, signals });
    }

    // -------------------------------------------------------- /api/missions
    // Mission System (gamification) — real checks against actual activity,
    // not fake progress bars. Each mission reflects something the user
    // genuinely did in the last 7 days.
    if (resource === "missions" && method === "GET") {
      if (!user) return sendJson(res, 401, { error: "Sign in required." });
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: profile } = await anonClient().from("profiles").select("*").eq("id", user.id).maybeSingle();
      const completionPct = profile ? [
        20,
        profile.avatar_url ? 15 : 0,
        profile.bio && profile.bio.length > 10 ? 15 : 0,
        profile.city ? 10 : 0,
        profile.profession ? 10 : 0,
        (profile.skills || []).length ? 10 : 0,
        (profile.languages || []).length ? 10 : 0,
        (profile.portfolio_url || profile.website_url) ? 10 : 0,
      ].reduce((a, b) => a + b, 0) : 20;

      const [props, svcs, jobsPosted, worldPosted, convos] = await Promise.all([
        anonClient().from("properties").select("id", { count: "exact", head: true }).eq("owner_id", user.id).gte("created_at", since),
        anonClient().from("services").select("id", { count: "exact", head: true }).eq("owner_id", user.id).gte("created_at", since),
        anonClient().from("jobs").select("id", { count: "exact", head: true }).eq("owner_id", user.id).gte("created_at", since),
        anonClient().from("world_posts").select("id", { count: "exact", head: true }).eq("owner_id", user.id).gte("created_at", since),
        sb.from("conversations").select("id", { count: "exact", head: true }).contains("participant_ids", [user.id]).gte("created_at", since),
      ]);
      const postedThisWeek = (props.count || 0) + (svcs.count || 0) + (jobsPosted.count || 0) + (worldPosted.count || 0);
      const connectionsThisWeek = convos.count || 0;

      const missions = [
        { id: "complete_passport", label: "Complete your Professional Passport to 80%", done: completionPct >= 80, points: 200 },
        { id: "post_content", label: "Publish on Pulse, Souk, Work, or World this week", done: postedThisWeek > 0, points: 100 },
        { id: "make_connection", label: "Start a new conversation this week", done: connectionsThisWeek > 0, points: 50 },
        { id: "engage", label: "Reach 60% Passport completion to comment & connect", done: completionPct >= 60, points: 50 },
      ];
      const completedCount = missions.filter((m) => m.done).length;
      return sendJson(res, 200, { missions, completedCount, total: missions.length });
    }

    // --------------------------------------------------- /api/connections
    // AI Intelligent Connection Suggestions — real similarity matching
    // against actual profiles (profession/skills/languages/city/country
    // overlap), the same honest approach as the Opportunity Radar. Not a
    // black-box "hundreds of signals" model — a real, explainable one.
    if (resource === "connections" && action === "suggestions" && method === "GET") {
      if (!user) return sendJson(res, 401, { error: "Sign in required." });
      const { data: me } = await anonClient().from("profiles").select("profession, skills, languages, city, country, account_type").eq("id", user.id).maybeSingle();
      const mySignals = [me?.profession, ...(me?.skills || []), ...(me?.languages || []), me?.city, me?.country].filter(Boolean).map((s) => String(s).toLowerCase());

      const { data: blocks } = await sb.from("blocked_users").select("blocker_id, blocked_id").or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);
      const blockedIds = new Set((blocks || []).map((b) => (b.blocker_id === user.id ? b.blocked_id : b.blocker_id)));

      const { data: others } = await anonClient()
        .from("profiles")
        .select("id, name, avatar_url, profession, company_name, account_type, city, country, skills")
        .neq("id", user.id)
        .eq("discoverable", true)
        .limit(200);

      const scored = (others || []).filter((p) => !blockedIds.has(p.id)).map((p) => {
        const theirSignals = [p.profession, ...(p.skills || []), p.city, p.country].filter(Boolean).map((s) => String(s).toLowerCase());
        let score = 0;
        let reason = null;
        if (me?.profession && p.profession && String(p.profession).toLowerCase() === String(me.profession).toLowerCase()) { score += 3; reason = `Also works in ${p.profession}`; }
        if (me?.city && p.city && p.city === me.city) { score += 2; reason = reason || `Also based in ${p.city}`; }
        if (me?.country && p.country && p.country === me.country && !reason) { score += 1; reason = `Also in ${p.country}`; }
        for (const sig of mySignals) { if (theirSignals.some((t) => t.includes(sig) || sig.includes(t))) score += 1; }
        return { ...p, score, reason: reason || "Active on Merveil AI" };
      })
        .filter((p) => p.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      return sendJson(res, 200, { suggestions: scored });
    }

    // Connect V1 — the actual request/accept/decline/remove/block flow.
    // Previously "connecting" with someone just opened a chat thread —
    // there was no request state at all. This is the real thing: a
    // pending request has to be accepted before two people are
    // "connected," either side can decline or remove one later, and
    // blocking is enforced both ways (a blocked person can't re-request).
    if (resource === "connections" && action === "request" && method === "POST") {
      if (!user) return sendJson(res, 401, { error: "Sign in required." });
      const body = await readBody(req);
      const targetId = body?.connectedUserId;
      if (!targetId) return sendJson(res, 400, { error: "connectedUserId required" });
      if (targetId === user.id) return sendJson(res, 400, { error: "You can't connect with yourself." });

      const { data: blocked } = await sb.from("blocked_users").select("id")
        .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${targetId}),and(blocker_id.eq.${targetId},blocked_id.eq.${user.id})`)
        .maybeSingle();
      if (blocked) return sendJson(res, 403, { error: "You can't connect with this person." });

      // If they already requested me, accept theirs instead of creating a
      // duplicate reverse row — this is what a person tapping "Connect"
      // on someone who already sent them a request actually expects.
      const { data: reverse } = await sb.from("connections").select("id, status")
        .eq("user_id", targetId).eq("connected_user_id", user.id).maybeSingle();
      if (reverse) {
        if (reverse.status === "accepted") return sendJson(res, 200, { status: "accepted", alreadyConnected: true });
        const { error } = await sb.from("connections").update({ status: "accepted", responded_at: new Date().toISOString() }).eq("id", reverse.id);
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { status: "accepted" });
      }

      const { data: existing } = await sb.from("connections").select("id, status").eq("user_id", user.id).eq("connected_user_id", targetId).maybeSingle();
      if (existing) {
        if (existing.status === "declined") {
          const { error } = await sb.from("connections").update({ status: "pending", responded_at: null }).eq("id", existing.id);
          if (error) return sendJson(res, 400, { error: error.message });
          return sendJson(res, 200, { status: "pending" });
        }
        return sendJson(res, 200, { status: existing.status, alreadyRequested: true });
      }

      const { error } = await sb.from("connections").insert({ user_id: user.id, connected_user_id: targetId, status: "pending" });
      if (error) return sendJson(res, 400, { error: error.message });
      return sendJson(res, 200, { status: "pending" });
    }

    if (resource === "connections" && (action === "accept" || action === "decline") && method === "POST") {
      if (!user) return sendJson(res, 401, { error: "Sign in required." });
      const body = await readBody(req);
      if (!body?.connectionId) return sendJson(res, 400, { error: "connectionId required" });
      // Only the recipient of a pending request can accept or decline it
      // — checked with connected_user_id = me, not just "some connection
      // row with this id," so this can't be used to flip someone else's
      // request.
      const newStatus = action === "accept" ? "accepted" : "declined";
      const { data, error } = await sb.from("connections")
        .update({ status: newStatus, responded_at: new Date().toISOString() })
        .eq("id", body.connectionId).eq("connected_user_id", user.id).eq("status", "pending")
        .select("id").maybeSingle();
      if (error) return sendJson(res, 400, { error: error.message });
      if (!data) return sendJson(res, 404, { error: "Request not found." });
      return sendJson(res, 200, { status: newStatus });
    }

    if (resource === "connections" && action === "remove" && method === "POST") {
      if (!user) return sendJson(res, 401, { error: "Sign in required." });
      const body = await readBody(req);
      if (!body?.connectionId) return sendJson(res, 400, { error: "connectionId required" });
      const { error } = await sb.from("connections").delete().eq("id", body.connectionId)
        .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`);
      if (error) return sendJson(res, 400, { error: error.message });
      return sendJson(res, 200, { ok: true });
    }

    if (resource === "connections" && action === "block" && method === "POST") {
      if (!user) return sendJson(res, 401, { error: "Sign in required." });
      const body = await readBody(req);
      const targetId = body?.userId;
      if (!targetId) return sendJson(res, 400, { error: "userId required" });
      const { error } = await sb.from("blocked_users").upsert({ blocker_id: user.id, blocked_id: targetId }, { onConflict: "blocker_id,blocked_id", ignoreDuplicates: true });
      if (error) return sendJson(res, 400, { error: error.message });
      await sb.from("connections").delete().or(`and(user_id.eq.${user.id},connected_user_id.eq.${targetId}),and(user_id.eq.${targetId},connected_user_id.eq.${user.id})`);
      return sendJson(res, 200, { ok: true });
    }

    if (resource === "connections" && action === "unblock" && method === "POST") {
      if (!user) return sendJson(res, 401, { error: "Sign in required." });
      const body = await readBody(req);
      if (!body?.userId) return sendJson(res, 400, { error: "userId required" });
      const { error } = await sb.from("blocked_users").delete().eq("blocker_id", user.id).eq("blocked_id", body.userId);
      if (error) return sendJson(res, 400, { error: error.message });
      return sendJson(res, 200, { ok: true });
    }

    if (resource === "connections" && action === "list" && method === "GET") {
      if (!user) return sendJson(res, 401, { error: "Sign in required." });
      const kind = req.query.kind || "accepted"; // accepted | incoming | outgoing
      let query = sb.from("connections").select("id, user_id, connected_user_id, status, created_at, responded_at");
      if (kind === "incoming") query = query.eq("connected_user_id", user.id).eq("status", "pending");
      else if (kind === "outgoing") query = query.eq("user_id", user.id).eq("status", "pending");
      else query = query.or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`).eq("status", "accepted");
      const { data: rows, error } = await query.order("created_at", { ascending: false });
      if (error) return sendJson(res, 400, { error: error.message });

      const otherIds = [...new Set((rows || []).map((r) => (r.user_id === user.id ? r.connected_user_id : r.user_id)))];
      const { data: profiles } = otherIds.length
        ? await anonClient().from("profiles").select("id, name, avatar_url, profession, company_name, account_type").in("id", otherIds)
        : { data: [] };
      const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

      const items = (rows || []).map((r) => {
        const otherId = r.user_id === user.id ? r.connected_user_id : r.user_id;
        return { connectionId: r.id, status: r.status, createdAt: r.created_at, direction: r.user_id === user.id ? "outgoing" : "incoming", person: profileMap[otherId] || { id: otherId } };
      });
      return sendJson(res, 200, { connections: items });
    }

    // -------------------------------------------------------- /api/favorites
    // ----------------------------------------------------- /api/webrtc
    // Real calling, replacing the old fake CallScreen (which just
    // faked "connected" after 2.2s and never talked to a remote peer).
    // This endpoint is the ONLY place Cloudflare's TURN credentials are
    // used — it authenticates the Merveil user, then asks Cloudflare
    // for short-lived (24h) iceServers and hands ONLY those back. The
    // Cloudflare Bearer token itself never reaches the browser.
    if (resource === "webrtc" && action === "ice-servers" && method === "GET") {
      if (!user) return sendJson(res, 401, { error: "Sign in required." });
      // STUN always present so open NATs work even if TURN is down.
      // Port 53 TURN URLs are filtered — browsers often block them.
      const stunFallback = [
        { urls: "stun:stun.cloudflare.com:3478" },
        { urls: "stun:stun.l.google.com:19302" },
      ];
      const filterIce = (servers) => {
        if (!Array.isArray(servers)) return [];
        return servers
          .map((s) => {
            if (!s) return null;
            const urls = (Array.isArray(s.urls) ? s.urls : [s.urls]).filter(
              (u) => typeof u === "string" && !u.includes(":53")
            );
            if (!urls.length) return null;
            return { ...s, urls: urls.length === 1 ? urls[0] : urls };
          })
          .filter(Boolean);
      };
      const keyId = process.env.CLOUDFLARE_TURN_KEY_ID;
      const apiToken = process.env.CLOUDFLARE_TURN_API_TOKEN;
      if (!keyId || !apiToken) {
        return sendJson(res, 200, { iceServers: stunFallback, turn: false });
      }
      try {
        // 2h TTL — enough for long calls, smaller abuse window than 24h
        const cfRes = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${keyId}/credentials/generate-ice-servers`, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ ttl: 7200 }),
        });
        if (!cfRes.ok) {
          const errText = await cfRes.text();
          console.error("TURN credential request failed:", errText);
          return sendJson(res, 200, { iceServers: stunFallback, turn: false, warning: "TURN unavailable — using STUN only" });
        }
        const data = await cfRes.json();
        const fromCf = filterIce(data.iceServers);
        const iceServers = fromCf.length ? fromCf : stunFallback;
        return sendJson(res, 200, { iceServers, turn: fromCf.length > 0 });
      } catch (err) {
        console.error("TURN error:", err.message);
        return sendJson(res, 200, { iceServers: stunFallback, turn: false, warning: err.message });
      }
    }

    // Call state + authorization. The frontend does its own WebRTC
    // signaling over a private Supabase Realtime channel named
    // 'call:<call id>' (locked down by Realtime Authorization policies
    // on realtime.messages — see the add_real_webrtc_calling migration),
    // but that channel doesn't exist, and can't be joined, until a call
    // row is created here. This is the actual authorization gate: you
    // cannot call someone you're not connected to, and every signaling
    // message downstream is checked against this row, not trusted from
    // either client.
    if (resource === "calls" && action === "create" && method === "POST") {
      if (!user) return sendJson(res, 401, { error: "Sign in required." });
      const body = await readBody(req);
      const receiverId = body?.receiverId;
      const type = body?.type;
      if (!receiverId || !["voice", "video"].includes(type)) return sendJson(res, 400, { error: "receiverId and type ('voice'|'video') required." });
      if (receiverId === user.id) return sendJson(res, 400, { error: "You can't call yourself." });

      const { data: blocked } = await sb.from("blocked_users").select("id")
        .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${receiverId}),and(blocker_id.eq.${receiverId},blocked_id.eq.${user.id})`)
        .maybeSingle();
      if (blocked) return sendJson(res, 403, { error: "You can't call this person." });

      // Allow call if: accepted connection OR they already share a 1:1 conversation
      // (Connect chat). Chatting without a formal "connection" was blocking the
      // call button in the thread header for many users.
      const { data: conn } = await sb.from("connections").select("id")
        .or(`and(user_id.eq.${user.id},connected_user_id.eq.${receiverId}),and(user_id.eq.${receiverId},connected_user_id.eq.${user.id})`)
        .eq("status", "accepted").maybeSingle();
      let canCall = !!conn;
      if (!canCall) {
        const { data: shared } = await sb.from("conversations")
          .select("id, participant_ids")
          .contains("participant_ids", [user.id])
          .limit(80);
        canCall = (shared || []).some((c) => {
          const ids = (c.participant_ids || []).map(String);
          return ids.length === 2 && ids.includes(String(user.id)) && ids.includes(String(receiverId));
        });
      }
      if (!canCall) return sendJson(res, 403, { error: "You can only call someone you're connected with or already chatting with." });

      // Admin-set call restrictions (console action=call-restrict). Checked
      // on both sides: a restricted caller can't place a call outside their
      // allowance, and a restricted receiver can't be called into one either.
      // Expired restrictions are treated as lifted rather than requiring a
      // separate cleanup job.
      const nowIso = new Date().toISOString();
      const { data: parties } = await sb.from("profiles")
        .select("id, call_restriction, call_restriction_expires_at")
        .in("id", [user.id, receiverId]);
      const activeRestriction = (row) => row?.call_restriction && row.call_restriction !== "normal" &&
        (!row.call_restriction_expires_at || row.call_restriction_expires_at > nowIso) ? row.call_restriction : null;
      const callerRow = parties?.find((p) => p.id === user.id);
      const receiverRow = parties?.find((p) => p.id === receiverId);
      const callerR = activeRestriction(callerRow);
      const receiverR = activeRestriction(receiverRow);
      if (callerR === "disabled") return sendJson(res, 403, { error: "Calling is currently disabled on your account." });
      if (receiverR === "disabled") return sendJson(res, 403, { error: "This citizen isn't accepting calls right now." });
      if (type === "video" && (callerR === "voice_only" || receiverR === "voice_only")) {
        return sendJson(res, 403, { error: "Video calling is temporarily restricted for this account — voice is still available." });
      }

      // Citizen-set call preferences (Citizen Settings → Your Connections →
      // "Who can call me"). Read via get_call_permission — a narrow
      // security-definer RPC — since citizen_settings RLS is owner-only and
      // `sb` here is the caller's own session, not the receiver's.
      const { data: calleePrefs } = await sb.rpc("get_call_permission", { p_target_id: receiverId });
      if (calleePrefs?.whoCanCall === "nobody") {
        return sendJson(res, 403, { error: "This citizen isn't accepting calls right now." });
      }
      if (type === "video" && calleePrefs?.allowVideo === false) {
        return sendJson(res, 403, { error: "This citizen has turned off video calls — try voice instead." });
      }

      const { data: call, error } = await sb.from("calls").insert({ caller_id: user.id, receiver_id: receiverId, type, status: "ringing" }).select("*").maybeSingle();
      if (error) return sendJson(res, 400, { error: error.message });
      return sendJson(res, 200, { call });
    }

    // Report a call — real Trust & Safety flow (doc 2 §21-22), not a
    // decorative button. Feeds the exact same `reports` table and admin
    // Reports panel every other report type already uses. Optionally
    // blocks the other participant in the same request.
    if (resource === "calls" && action === "report" && method === "POST") {
      if (!user) return sendJson(res, 401, { error: "Sign in required." });
      const body = await readBody(req);
      const { callId, category, description, block } = body || {};
      const allowedCategories = ["harassment", "scam", "impersonation", "spam", "inappropriate_content", "other"];
      if (!callId || !allowedCategories.includes(category)) {
        return sendJson(res, 400, { error: "callId and a valid category are required." });
      }
      const { data: call } = await sb.from("calls").select("id, caller_id, receiver_id").eq("id", callId).maybeSingle();
      if (!call || (call.caller_id !== user.id && call.receiver_id !== user.id)) return sendJson(res, 404, { error: "Call not found." });
      const otherId = call.caller_id === user.id ? call.receiver_id : call.caller_id;

      const { error: reportErr } = await sb.from("reports").insert({
        reporter_id: user.id, target_type: "call", target_id: callId,
        category, description: description || null, status: "new", priority: category === "scam" || category === "harassment" ? "high" : "normal",
      });
      if (reportErr) return sendJson(res, 400, { error: reportErr.message });

      if (block) {
        await sb.from("blocked_users").upsert({ blocker_id: user.id, blocked_id: otherId }, { onConflict: "blocker_id,blocked_id" }).select().maybeSingle().catch(() => {});
      }
      return sendJson(res, 200, { ok: true });
    }

    if (resource === "calls" && (action === "accept" || action === "reject" || action === "end") && method === "POST") {
      if (!user) return sendJson(res, 401, { error: "Sign in required." });
      const body = await readBody(req);
      if (!body?.callId) return sendJson(res, 400, { error: "callId required" });

      const { data: call } = await sb.from("calls").select("*").eq("id", body.callId).maybeSingle();
      if (!call || (call.caller_id !== user.id && call.receiver_id !== user.id)) return sendJson(res, 404, { error: "Call not found." });

      if (action === "accept") {
        if (call.receiver_id !== user.id) return sendJson(res, 403, { error: "Only the receiver can accept." });
        const { error } = await sb.from("calls").update({ status: "accepted", connected_at: new Date().toISOString() }).eq("id", call.id);
        if (error) return sendJson(res, 400, { error: error.message });
      } else if (action === "reject") {
        if (call.receiver_id !== user.id) return sendJson(res, 403, { error: "Only the receiver can reject." });
        const { error } = await sb.from("calls").update({ status: "rejected", ended_at: new Date().toISOString() }).eq("id", call.id);
        if (error) return sendJson(res, 400, { error: error.message });
      } else {
        const endedAt = new Date();
        const duration = call.connected_at ? Math.max(0, Math.round((endedAt - new Date(call.connected_at)) / 1000)) : 0;
        const finalStatus = call.status === "ringing" ? "missed" : "ended";
        const { error } = await sb.from("calls").update({ status: finalStatus, ended_at: endedAt.toISOString(), duration_seconds: duration }).eq("id", call.id);
        if (error) return sendJson(res, 400, { error: error.message });
      }
      return sendJson(res, 200, { ok: true });
    }


    // Intelligent Connection Management — real favorites, not a UI-only tab.
    if (resource === "favorites") {
      if (!user) return sendJson(res, 401, { error: "Sign in required." });
      if (method === "GET") {
        const { data, error } = await sb.from("favorites").select("favorite_user_id").eq("user_id", user.id);
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { favoriteIds: (data || []).map((r) => r.favorite_user_id) });
      }
      if (method === "POST") {
        const body = await readBody(req);
        if (!body.userId) return sendJson(res, 400, { error: "userId required" });
        const { data: existing } = await sb.from("favorites").select("id").eq("user_id", user.id).eq("favorite_user_id", body.userId).maybeSingle();
        if (existing) {
          await sb.from("favorites").delete().eq("id", existing.id);
          return sendJson(res, 200, { favorited: false });
        }
        const { error } = await sb.from("favorites").insert({ user_id: user.id, favorite_user_id: body.userId });
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { favorited: true });
      }
      return sendJson(res, 404, { error: "Not found" });
    }

    // ------------------------------------------------------- /api/comments
    // Shared across properties, services, jobs, and events via targetType/targetId.
    if (resource === "comments") {
      if (method === "GET") {
        const { targetType, targetId } = req.query;
        if (!targetType || !targetId) return sendJson(res, 400, { error: "targetType and targetId required" });
        const { data, error } = await anonClient()
          .from("comments")
          .select("id, body, user_id, created_at")
          .eq("target_type", targetType)
          .eq("target_id", targetId)
          .order("created_at", { ascending: true })
          .limit(200);
        if (error) return sendJson(res, 400, { error: error.message });
        const userIds = [...new Set((data || []).map((c) => c.user_id))];
        let profileMap = {};
        if (userIds.length) {
          const { data: profs } = await anonClient().from("profiles").select("id, name, avatar_url").in("id", userIds);
          profileMap = Object.fromEntries((profs || []).map((p) => [p.id, p]));
        }
        const comments = (data || []).map((c) => ({ ...c, author: profileMap[c.user_id] || null }));
        return sendJson(res, 200, { comments });
      }

      if (method === "POST") {
        if (!user) return sendJson(res, 401, { error: "Sign in to comment." });
        const body = await readBody(req);
        if (!body.targetType || !body.targetId) return sendJson(res, 400, { error: "targetType and targetId required" });
        const text = (body.body || "").trim();
        if (!text) return sendJson(res, 400, { error: "Comment can't be empty." });
        if (text.length > 1000) return sendJson(res, 400, { error: "Comment is too long." });
        const { data, error } = await sb
          .from("comments")
          .insert({ target_type: body.targetType, target_id: body.targetId, user_id: user.id, body: text })
          .select()
          .maybeSingle();
        if (error) return sendJson(res, 400, { error: error.message });
        const { data: prof } = await anonClient().from("profiles").select("id, name, avatar_url").eq("id", user.id).maybeSingle();
        return sendJson(res, 200, { comment: { ...data, author: prof || null } });
      }

      if (method === "DELETE") {
        if (!user) return sendJson(res, 401, { error: "Sign in required." });
        const body = await readBody(req);
        if (!body.id) return sendJson(res, 400, { error: "id required" });
        const { error } = await sb.from("comments").delete().eq("id", body.id).eq("user_id", user.id);
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { ok: true });
      }

      return sendJson(res, 404, { error: "Not found" });
    }

    // --------------------------------------------------- /api/profile-views
    if (resource === "profile-views") {
      if (method === "POST") {
        const body = await readBody(req);
        if (!body.viewedId) return sendJson(res, 400, { error: "viewedId required" });
        if (user && user.id === body.viewedId) return sendJson(res, 200, { ok: true }); // don't log self-views
        let viewerCountry = null;
        if (user) {
          const { data: viewerProf } = await anonClient().from("profiles").select("country").eq("id", user.id).maybeSingle();
          viewerCountry = viewerProf?.country || null;
        }
        await sb.from("profile_views").insert({
          viewed_id: body.viewedId,
          viewer_id: user?.id || null,
          viewer_country: viewerCountry,
        });
        return sendJson(res, 200, { ok: true });
      }

      if (method === "GET") {
        if (!user) return sendJson(res, 401, { error: "Sign in required." });
        const { data, error } = await sb
          .from("profile_views")
          .select("viewer_id, viewer_country, created_at")
          .eq("viewed_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) return sendJson(res, 400, { error: error.message });
        const viewerIds = [...new Set((data || []).map((v) => v.viewer_id).filter(Boolean))];
        let profileMap = {};
        if (viewerIds.length) {
          const { data: profs } = await anonClient().from("profiles").select("id, name, avatar_url").in("id", viewerIds);
          profileMap = Object.fromEntries((profs || []).map((p) => [p.id, p]));
        }
        const { count: totalCount } = await sb.from("profile_views").select("*", { count: "exact", head: true }).eq("viewed_id", user.id);
        const views = (data || []).map((v) => ({
          viewer: v.viewer_id ? (profileMap[v.viewer_id] || null) : null,
          country: v.viewer_country,
          createdAt: v.created_at,
        }));
        return sendJson(res, 200, { views, totalCount: totalCount || 0 });
      }

      return sendJson(res, 404, { error: "Not found" });
    }

    // ----------------------------------------------------- /api/analytics
    if (resource === "analytics") {
      if (method === "POST") {
        const body = await readBody(req);
        if (!body.eventType) return sendJson(res, 400, { error: "eventType required" });
        await sb.from("analytics_events").insert({
          event_type: body.eventType,
          feature: body.feature || null,
          user_id: user?.id || null,
          session_id: body.sessionId || null,
        });
        return sendJson(res, 200, { ok: true });
      }

      // Admin-only aggregate read — used by the dashboard.
      if (method === "GET") {
        if (!user) return sendJson(res, 401, { error: "Sign in required." });
        const { data: me } = await sb.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
        if (!me?.is_admin) return sendJson(res, 403, { error: "Admin access only." });

        const since = new Date(Date.now() - (Number(req.query.days || 30) * 24 * 60 * 60 * 1000)).toISOString();

        const { count: totalVisits } = await sb.from("analytics_events").select("*", { count: "exact", head: true })
          .eq("event_type", "page_view").gt("created_at", since);

        const { data: sessionRows } = await sb.from("analytics_events").select("session_id, user_id")
          .eq("event_type", "page_view").gt("created_at", since);
        const uniqueVisitors = new Set((sessionRows || []).map((r) => r.user_id || r.session_id).filter(Boolean)).size;

        const { data: featureRows } = await sb.from("analytics_events").select("feature")
          .eq("event_type", "page_view").gt("created_at", since).not("feature", "is", null);
        const featureCounts = {};
        for (const r of featureRows || []) featureCounts[r.feature] = (featureCounts[r.feature] || 0) + 1;
        const topFeatures = Object.entries(featureCounts).sort((a, b) => b[1] - a[1]).map(([feature, count]) => ({ feature, count }));

        return sendJson(res, 200, { totalVisits: totalVisits || 0, uniqueVisitors, topFeatures, sinceDays: Number(req.query.days || 30) });
      }

      return sendJson(res, 404, { error: "Not found" });
    }

    // --------------------------------------------------------- /api/people
    if (resource === "people") {
      const action = req.query.action;

      if (action === "candidate" && method === "GET") {
        if (!user) return sendJson(res, 200, { profile: null });
        const { data } = await sb.from("candidate_profiles").select("*").eq("user_id", user.id).maybeSingle();
        return sendJson(res, 200, { profile: data || null });
      }

      if (action === "candidate" && method === "POST") {
        if (!user) return sendJson(res, 401, { error: "Sign in required." });
        const body = await readBody(req);
        const { error } = await sb.from("candidate_profiles").upsert({
          user_id: user.id,
          category: body.category,
          emirate: body.emirate,
          experience: body.experience,
          languages: body.languages || [],
          updated_at: new Date().toISOString(),
        });
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { ok: true });
      }

      if (action === "profile" && method === "GET") {
        const userId = req.query.userId;
        if (!userId) return sendJson(res, 400, { error: "userId required" });
        const { data, error } = await anonClient()
          .from("profiles")
          .select("id, name, avatar_url, junction_id, passport_tier, country, bio, created_at, account_type, company_name")
          .eq("id", userId)
          .maybeSingle();
        if (error) return sendJson(res, 400, { error: error.message });
        if (!data) return sendJson(res, 404, { error: "Not found" });

        const { data: listings } = await anonClient()
          .from("properties")
          .select("id, title, area, emirate, price, listing_type, category, photo_url, photo_urls, views, likes_count, created_at")
          .eq("owner_id", userId)
          .order("created_at", { ascending: false })
          .limit(24);

        const totalLikes = (listings || []).reduce((sum, l) => sum + (l.likes_count || 0), 0);
        const totalViews = (listings || []).reduce((sum, l) => sum + (l.views || 0), 0);

        return sendJson(res, 200, {
          profile: data,
          listings: (listings || []).map((l) => ({
            id: `db-${l.id}`, title: l.title, area: l.area, emirate: l.emirate, price: l.price,
            type: l.listing_type || "Sale", category: l.category,
            photo_url: l.photo_url, photo_urls: l.photo_urls, views: l.views || 0, likesCount: l.likes_count || 0,
          })),
          stats: { listingCount: (listings || []).length, totalLikes, totalViews },
        });
      }

      if (action === "profile" && method === "PATCH") {
        if (!user) return sendJson(res, 401, { error: "Sign in required." });
        const body = await readBody(req);
        const fields = {};
        if (body.name !== undefined) fields.name = body.name;
        if (body.bio !== undefined) fields.bio = body.bio;
        if (body.avatarUrl !== undefined) fields.avatar_url = body.avatarUrl;
        if (body.backgroundId !== undefined) fields.background_id = body.backgroundId;
        if (body.passportTier !== undefined) fields.passport_tier = body.passportTier;
        if (body.roleLabel !== undefined) fields.role_label = body.roleLabel;
        // Professional Passport progressive-completion fields.
        if (body.city !== undefined) fields.city = body.city;
        if (body.profession !== undefined) fields.profession = body.profession;
        if (body.companyName !== undefined) fields.company_name = body.companyName;
        if (body.skills !== undefined) fields.skills = body.skills;
        if (body.languages !== undefined) fields.languages = body.languages;
        if (body.portfolioUrl !== undefined) fields.portfolio_url = body.portfolioUrl;
        if (body.websiteUrl !== undefined) fields.website_url = body.websiteUrl;
        const { data, error } = await sb.from("profiles").update(fields).eq("id", user.id).select().maybeSingle();
        if (error) return sendJson(res, 400, { error: error.message });
        return sendJson(res, 200, { user: mapProfile(data) });
      }

      if (action === "video-upload-url" && method === "POST") {
        if (!user) return sendJson(res, 401, { error: "Sign in required." });
        const body = await readBody(req);
        const safeName = (body.fileName || "video.mp4").replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `reels/${user.id}/${Date.now()}-${safeName}`;
        const { data, error } = await sb.storage.from("uploads").createSignedUploadUrl(path);
        if (error) return sendJson(res, 400, { error: error.message });
        const { data: pub } = sb.storage.from("uploads").getPublicUrl(path);
        return sendJson(res, 200, { signedUrl: data.signedUrl, token: data.token, path, publicUrl: pub.publicUrl });
      }

      if (action === "upload" && method === "POST") {
        if (!user) return sendJson(res, 401, { error: "Sign in required." });
        const form = formidable({ maxFileSize: 80 * 1024 * 1024 });
        const [fields, files] = await form.parse(req);
        const file = files.file?.[0];
        if (!file) return sendJson(res, 400, { error: "No file provided." });
        const folder = fields.folder?.[0] || "misc";
        const fs = await import("fs");
        const buffer = fs.readFileSync(file.filepath);
        const safeName = (file.originalFilename || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${folder}/${user.id}/${Date.now()}-${safeName}`;
        const { error } = await sb.storage.from("uploads").upload(path, buffer, {
          contentType: file.mimetype || "application/octet-stream",
        });
        if (error) return sendJson(res, 400, { error: error.message });
        const { data: pub } = sb.storage.from("uploads").getPublicUrl(path);
        return sendJson(res, 200, { url: pub.publicUrl, name: safeName, size: file.size, contentType: file.mimetype });
      }

      return sendJson(res, 404, { error: "Not found" });
    }

    return sendJson(res, 404, { error: "Unknown API route" });
  } catch (e) {
    return sendJson(res, 500, { error: e.message || "Server error" });
  }
}
