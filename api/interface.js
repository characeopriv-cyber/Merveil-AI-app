import { createClient } from '@supabase/supabase-js';
import { getSession } from '../lib/supabaseServer.js';

const SUPABASE_URL = 'https://dixfybqlepticyudikuz.supabase.co';
const db = () => createClient(
  SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || '',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const bodyOf = req => typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

async function uidOf(req, res) {
  const s = await getSession(req, res).catch(() => ({ user: null, jwtSub: null }));
  return s?.user?.id || s?.jwtSub || null;
}

function json(res, status, body) {
  res.status(status).setHeader('Cache-Control', 'no-store').json(body);
}

export default async function handler(req, res) {
  const route = String(req.query?.route || '').replace(/^\/+|\/+$/g, '').toLowerCase();
  const svc = db();

  try {
    if (req.method === 'GET' && (route === 'products' || route === '')) {
      const limit = Math.min(Math.max(Number(req.query?.limit || 50), 1), 100);
      let q = svc.from('listings').select('*')
        .eq('status', 'published')
        .eq('interface_state', 'live')
        .is('deleted_at', null)
        .is('frozen_at', null)
        .order('published_at', { ascending: false })
        .limit(limit);
      if (req.query?.status && String(req.query.status) !== 'published') q = q.eq('status', String(req.query.status));
      const { data, error } = await q;
      if (error) throw error;
      return json(res, 200, { products: data || [], items: data || [] });
    }

    const uid = await uidOf(req, res);
    if (!uid) return json(res, 401, { error: 'Sign in required', code: 'AUTH_REQUIRED' });
    const body = bodyOf(req);

    if (req.method === 'POST' && route === 'signals') {
      const productId = String(body.product_id || '').trim();
      const kind = String(body.kind || '').trim().toLowerCase();
      if (!productId || !kind) return json(res, 400, { error: 'product_id and kind are required' });
      const { error } = await svc.from('interface_action_events').insert({
        actor_user_id: uid,
        listing_id: productId,
        action: kind,
        outcome: 'recorded',
        metadata: { source: body.source || 'interface' }
      });
      if (error) throw error;
      return json(res, 200, { ok: true, signal: kind, product_id: productId });
    }

    const productId = route.startsWith('products/') ? route.split('/')[1] : '';
    const action = route.startsWith('products/') ? route.split('/')[2] : '';
    if (req.method === 'POST' && productId && ['super', 'buy', 'download', 'collab'].includes(action)) {
      const { data: listing, error: le } = await svc.from('listings').select('*').eq('id', productId)
        .eq('status', 'published').eq('interface_state', 'live').is('deleted_at', null).is('frozen_at', null).maybeSingle();
      if (le) throw le;
      if (!listing) return json(res, 404, { error: 'Interface product not found' });
      if (listing.publisher_user_id === uid) return json(res, 400, { error: 'You cannot perform this action on your own product' });

      const outcome = action === 'buy' ? 'pending' : 'recorded';
      const { data: event, error } = await svc.from('interface_action_events').insert({
        actor_user_id: uid,
        project_id: listing.developer_project_id || listing.project_id || null,
        listing_id: listing.id,
        action,
        outcome,
        target_user_id: listing.publisher_user_id,
        metadata: { source: 'interface', price_cents: listing.price_cents || 0 }
      }).select('*').single();
      if (error) throw error;
      return json(res, 200, { ok: true, action, outcome, event_id: event.id, product_id: listing.id });
    }

    return json(res, 404, { error: 'Unknown Interface API route', code: 'INTERFACE_ROUTE_NOT_FOUND', route });
  } catch (error) {
    console.error('[interface-api]', error);
    return json(res, 500, { error: error?.message || 'Interface API error', code: 'INTERFACE_API_ERROR' });
  }
}
