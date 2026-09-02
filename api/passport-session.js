import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { getSession, sendJson } from "../lib/supabaseServer.js";

const SUPABASE_URL = "https://dixfybqlepticyudikuz.supabase.co";
const SUPABASE_KEY = "sb_publishable_zOtxwZ1q_OCpiTunktzypw_14pQnQOh";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { error: "Method not allowed" });
  }
  const session = await getSession(req, res);
  if (!session.user?.id || !session.token) {
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    return sendJson(res, 401, { authenticated: false, data: null, error: "Authentication required" });
  }
  const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${session.token}` } },
  });
  const { data, error } = await client.from("profiles")
    .select("id,name,junction_id,passport_tier,role_label,country,account_type,company_name,profession,languages,kyc_level,kyc_status,kyc_verified_at,avatar_url,merveil_credits")
    .eq("id", session.user.id).maybeSingle();
  if (error) return sendJson(res, 500, { authenticated: true, data: null, error: "Passport unavailable" });
  if (!data) return sendJson(res, 404, { authenticated: true, data: null, error: "Passport not found" });
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  return sendJson(res, 200, { authenticated: true, data, request_id: crypto.randomUUID() });
}
