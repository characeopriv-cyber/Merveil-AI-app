import { json, requireApiKey, logApiUsage, supabaseAdmin } from './_lib.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, null);
  const auth = await requireApiKey(req, 'connect:read', res);
  if (auth.error) return json(res, auth.status || 401, { error: auth.status === 403 ? 'insufficient_scope' : 'unauthorized', message: auth.error, request_id: auth.requestId }, auth.headers);
  if (req.method !== 'GET') { await logApiUsage(auth, req, 405); return json(res, 405, { error: 'method_not_allowed', request_id: auth.requestId }); }
  const conversationId = String(req.query?.conversation_id || '').trim();
  if (!conversationId) return json(res, 400, { error: 'conversation_id_required', request_id: auth.requestId });
  const { data: conversation, error: ce } = await supabaseAdmin.from('conversations').select('id,participant_ids,context_label,created_at').eq('id', conversationId).maybeSingle();
  if (ce || !conversation) return json(res, 404, { error: 'conversation_not_found', request_id: auth.requestId });
  if (!(conversation.participant_ids || []).includes(auth.app.user_id)) return json(res, 403, { error: 'forbidden', message: 'Application is not a participant in this conversation.', request_id: auth.requestId });
  const { data, error } = await supabaseAdmin.from('messages').select('id,conversation_id,sender_id,type,body,media_url,media_meta,created_at,edited_at').eq('conversation_id', conversationId).order('created_at', { ascending: false }).limit(100);
  if (error) { await logApiUsage(auth, req, 500); return json(res, 500, { error: 'database_error', request_id: auth.requestId }); }
  await logApiUsage(auth, req, 200); return json(res, 200, { data: data || [], request_id: auth.requestId });
}
