import { createClient } from "@supabase/supabase-js";
import { getSession, sendJson } from "../lib/supabaseServer.js";

const SUPABASE_URL = "https://dixfybqlepticyudikuz.supabase.co";
const CITIZEN_ORIGIN = "https://www.junction.technology";
const MIN_COMPLETION = 20;

function passportCompletionPct(profile) {
  return profile ? [
    20,
    profile.avatar_url ? 15 : 0,
    profile.bio && profile.bio.length > 10 ? 15 : 0,
    profile.city ? 10 : 0,
    profile.profession ? 10 : 0,
    (profile.skills || []).length ? 10 : 0,
    (profile.languages || []).length ? 10 : 0,
    (profile.portfolio_url || profile.website_url) ? 10 : 0,
  ].reduce((a, b) => a + b, 0) : 20;
}

function adminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
  if (!key) throw new Error("Server misconfiguration: missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(SUPABASE_URL, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export default async function handler(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, { error: "Method not allowed" });

  let session = { user: null, jwtSub: null };
  try { session = await getSession(req, res); } catch {}
  const citizenId = session?.user?.id || session?.jwtSub || null;

  if (!citizenId) {
    return sendJson(res, 401, {
      error: "Sign in required",
      code: "AUTH_REQUIRED",
      redirect: `${CITIZEN_ORIGIN}/?next=/developer`,
    });
  }

  try {
    const svc = adminClient();
    const { data: profile } = await svc.from("profiles").select("*").eq("id", citizenId).maybeSingle();
    const completionPct = passportCompletionPct(profile);

    if (completionPct < MIN_COMPLETION) {
      return sendJson(res, 403, {
        error: "Complete your Merveil Passport to build in Developer.",
        code: "PASSPORT_INCOMPLETE",
        completionPct,
        required: MIN_COMPLETION,
        redirect: `${CITIZEN_ORIGIN}/?goto=passport&next=/developer`,
      });
    }

    return sendJson(res, 200, { ok: true, citizenId, completionPct });
  } catch (error) {
    return sendJson(res, 500, { error: error?.message || "Studio access check failed" });
  }
}
