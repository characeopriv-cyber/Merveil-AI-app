import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.MERVEIL_API_CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type, x-api-key');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
}

export function json(res, status, body) {
  cors(res);
  res.status(status).json(body);
}

export function bearer(req) {
  const value = req.headers.authorization || '';
  return value.startsWith('Bearer ') ? value.slice(7) : null;
}

export async function requireUser(req) {
  const token = bearer(req);
  if (!token) return { error: 'Missing Bearer token' };
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return { error: 'Invalid or expired authentication token' };
  return { user: data.user };
}

export function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export function newApiKey(environment) {
  const prefix = environment === 'production' ? 'mv_live_' : 'mv_test_';
  const secret = crypto.randomBytes(32).toString('base64url');
  const key = `${prefix}${secret}`;
  return { key, prefix: key.slice(0, 13), hash: hashKey(key) };
}

export function apiKey(req) {
  return req.headers['x-api-key'] || (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || null;
}

export async function requireApiKey(req) {
  const key = apiKey(req);
  if (!key) return { error: 'Missing API key' };
  const { data, error } = await supabaseAdmin
    .from('api_applications')
    .select('id,user_id,name,environment,scopes,status')
    .eq('key_hash', hashKey(key))
    .maybeSingle();
  if (error || !data || data.status !== 'active') return { error: 'Invalid or revoked API key' };
  return { app: data };
}
