import crypto from 'node:crypto';
import { supabaseAdmin } from './_lib.js';

export const WEBHOOK_EVENTS = Object.freeze([
  'profile.updated','passport.updated','verification.completed','connect.created','connect.updated',
  'message.created','ai.completed','call.started','call.completed','company.created','company.updated',
  'property.created','property.updated','world.post.created','world.post.updated','investor.created',
  'credits.updated','application.updated'
]);

export async function emitWebhookEvent(eventType, payload = {}, eventId = null) {
  if (!WEBHOOK_EVENTS.includes(eventType)) throw new Error(`Unsupported webhook event: ${eventType}`);
  const id = String(eventId || `evt_${crypto.randomBytes(18).toString('base64url')}`);
  const { error } = await supabaseAdmin.from('api_webhook_event_outbox').insert({
    event_id: id, event_type: eventType, payload: payload || {}
  });
  if (error && error.code !== '23505') throw error;
  return { event_id: id, accepted: true, duplicate: error?.code === '23505' };
}

export async function emitWebhookEventSafe(eventType, payload = {}, eventId = null) {
  try { return await emitWebhookEvent(eventType, payload, eventId); }
  catch (error) { console.error('[merveil-webhook-event]', eventType, error); return { accepted: false, error: 'webhook_enqueue_failed' }; }
}
