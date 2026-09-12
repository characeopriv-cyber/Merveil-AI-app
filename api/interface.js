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

function routeOf(req) {
  const queryRoute = String(req.query?.route || '').trim();
  if (queryRoute) return queryRoute.replace(/^\/+|\/+$/g, '').toLowerCase();
  const pathname = String(req.url || '').split('?')[0].replace(/^\/+|\/+$/g, '');
  const marker = pathname.indexOf('api/interface');
  if (marker >= 0) return pathname.slice(marker + 'api/interface'.length).replace(/^\/+|\/+$/g, '').toLowerCase();
  return '';
}

export default async function handler(req, res) {
  const route = routeOf(req);
  const svc = db();

  try {
    // Public discovery intentionally reads only the security-scoped view.
    if (req.method === 'GET' && (route === 'products' || route === '')) {
      const limit = Math.min(Math.max(Number(req.query?.limit || 50), 1), 100);
      const { data, error } = await svc.from('interface_public_products_v1').select('*')
        .order('published_at', { ascending: false }).limit(limit);
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
        actor_user_id: uid, listing_id: productId, action: kind, outcome: 'recorded',
        metadata: { source: body.source || 'interface' }
      });
      if (error) throw error;
      return json(res, 200, { ok: true, signal: kind, product_id: productId });
    }

    const parts = route.split('/');
    const productId = parts[0] === 'products' ? parts[1] : '';
    const action = parts[0] === 'products' ? parts[2] : '';
    if (req.method === 'POST' && productId && ['super', 'buy', 'download', 'collab'].includes(action)) {
      // Use the public Interface view here too. Do not fall back to the protected
      // listings table: Vercel must never need direct client permission on listings.
      const { data: product, error: pe } = await svc.from('interface_public_products_v1').select('*').eq('id', productId).maybeSingle();
      if (pe) throw pe;
      if (!product) return json(res, 404, { error: 'Interface product not found' });

      const outcome = action === 'buy' ? 'pending' : 'recorded';
      const { data: event, error } = await svc.from('interface_action_events').insert({
        actor_user_id: uid,
        project_id: product.developer_project_id || product.project_id || null,
        listing_id: product.id,
        action,
        outcome,
        metadata: { source: 'interface', price_cents: product.price_cents || 0 }
      }).select('*').single();
      if (error) throw error;
      return json(res, 200, { ok: true, action, outcome, event_id: event.id, product_id: product.id });
    }

    return json(res, 404, { error: 'Unknown Interface API route', code: 'INTERFACE_ROUTE_NOT_FOUND', route });
  } catch (error) {
    console.error('[interface-api]', error);
    return json(res, 500, { error: error?.message || 'Interface API error', code: 'INTERFACE_API_ERROR' });
  }
}
