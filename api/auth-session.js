import { getSession, clearSessionCookie, sendJson } from "../lib/supabaseServer.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  try {
    const session = await getSession(req, res);
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    return sendJson(res, 200, {
      authenticated: Boolean(session?.user?.id),
      user: session?.user
        ? {
            id: session.user.id,
            email: session.user.email || null,
            phone: session.user.phone || null,
          }
        : null,
    });
  } catch (error) {
    clearSessionCookie(res);
    return sendJson(res, 401, {
      authenticated: false,
      user: null,
      error: "Session unavailable",
    });
  }
}
