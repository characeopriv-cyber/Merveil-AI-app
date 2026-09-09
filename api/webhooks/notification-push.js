import { notifyUser } from "../router.js";

function secretFrom(req) {
  return String(req.headers["x-merveil-webhook-secret"] || req.headers["x-webhook-secret"] || "");
}

function expectedSecret() {
  return String(process.env.MERVEIL_NOTIFICATION_WEBHOOK_SECRET || "");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const expected = expectedSecret();
  if (!expected || secretFrom(req) !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const input = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const record = input.record || input;
    const userId = record.user_id;
    if (!userId) return res.status(400).json({ error: "user_id required" });

    const payload = record.payload && typeof record.payload === "object" ? record.payload : {};
    const title = record.title || payload.title || "Merveil AI";
    const body = record.body || payload.body || "New activity in Merveil";
    const data = {
      ...payload,
      notification_id: record.id,
      event_type: record.event_type,
      url: record.action_url || payload.url || "/",
      tag: payload.tag || `merveil:${record.event_type || "notification"}`,
    };

    const result = await notifyUser(userId, {
      title,
      body,
      data,
      urgent: record.priority === "urgent" || record.priority === "high",
    });

    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    console.error("Merveil notification push webhook failed", error);
    return res.status(500).json({ error: "Notification delivery failed" });
  }
}
