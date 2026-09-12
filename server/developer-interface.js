import { createClient } from '@supabase/supabase-js';
import { getSession } from '../lib/supabaseServer.js';

const SUPABASE_URL = 'https://dixfybqlepticyudikuz.supabase.co';
const db = () => createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || '', { auth: { autoRefreshToken: false, persistSession: false } });
const bodyOf = req => typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
const uidOf = async (req, res) => { const s = await getSession(req, res).catch(() => ({ user: null, jwtSub: null })); return s?.user?.id || s?.jwtSub || null; };

function publishEnabled(project) {
  const value = project?.meta?.interface?.publish;
  return value !== false;
}

function slugify(value) {
  return String(value || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'product';
}

async function ensurePublishedListing(svc, project, uid) {
  const { data: existing, error: lookupError } = await svc.from('listings').select('id,status').eq('project_id', project.id).eq('publisher_user_id', uid).maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) {
    if (existing.status !== 'published') {
      const { data, error } = await svc.from('listings').update({ status: 'published', published_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', existing.id).select('*').single();
      if (error) throw error;
      return data;
    }
    return existing;
  }
  const slug = `${slugify(project.name)}-${String(project.id).slice(0, 8)}`;
  const { data, error } = await svc.from('listings').insert({
    project_id: project.id,
    publisher_user_id: uid,
    slug,
    title: project.name,
    tagline: project.tagline || null,
    description: project.meta?.interface?.description || project.tagline || null,
    category: project.meta?.interface?.category || 'developer',
    subcategory: project.meta?.interface?.subcategory || null,
    icon_url: project.meta?.interface?.icon_url || null,
    cover_url: project.meta?.interface?.cover_url || null,
    video_url: project.meta?.interface?.video_url || null,
    screenshots: project.meta?.interface?.screenshots || [],
    tags: project.meta?.interface?.tags || [],
    price_cents: Number(project.meta?.interface?.price_cents || 0),
    billing: project.meta?.interface?.billing || 'free',
    status: 'published',
    published_at: new Date().toISOString()
  }).select('*').single();
  if (error) throw error;
  return data;
}

export default async function developerInterface(req, res) {
  const uid = await uidOf(req, res);
  if (!uid) return { status: 401, body: { error: 'Sign in required', code: 'AUTH_REQUIRED' } };
  let body; try { body = bodyOf(req); } catch { return { status: 400, body: { error: 'Invalid JSON', code: 'INVALID_JSON' } }; }
  const projectId = String(req.query?.projectId || body.projectId || '').trim();
  if (!projectId) return { status: 400, body: { error: 'projectId is required' } };
  const svc = db();
  const { data: project, error } = await svc.from('developer_projects').select('id,owner_user_id,name,slug,tagline,stage,status_label,meta').eq('id', projectId).eq('owner_user_id', uid).maybeSingle();
  if (error) return { status: 500, body: { error: error.message } };
  if (!project) return { status: 404, body: { error: 'Project not found' } };

  if (req.method === 'GET') {
    const meta = project.meta || {};
    const iface = meta.interface || {};
    const { data: listing } = await svc.from('listings').select('id,status,published_at,title,price_cents,billing,category').eq('project_id', project.id).eq('publisher_user_id', uid).maybeSingle();
    return { status: 200, body: { ok: true, projectId, publishToInterface: publishEnabled(project), interface: { ...iface, listing: listing || null, live: listing?.status === 'published', verified: iface.verified === true } } };
  }

  if (req.method !== 'POST' && req.method !== 'PATCH') return { status: 405, body: { error: 'Method not allowed' } };
  const action = String(body.action || 'toggle').toLowerCase();
  const currentMeta = project.meta || {};
  const currentInterface = currentMeta.interface || {};

  if (action === 'toggle') {
    const enabled = body.enabled === undefined ? !publishEnabled(project) : Boolean(body.enabled);
    const nextMeta = { ...currentMeta, interface: { ...currentInterface, publish: enabled, verified: currentInterface.verified === true } };
    const { data: updated, error: updateError } = await svc.from('developer_projects').update({ meta: nextMeta, updated_at: new Date().toISOString() }).eq('id', project.id).eq('owner_user_id', uid).select('id,meta,updated_at').single();
    if (updateError) return { status: 500, body: { error: updateError.message } };
    let listing = null;
    if (enabled && ['ready','complete','completed','published','live'].includes(String(project.stage || '').toLowerCase())) listing = await ensurePublishedListing(svc, project, uid);
    if (!enabled) await svc.from('listings').update({ status: 'draft', updated_at: new Date().toISOString() }).eq('project_id', project.id).eq('publisher_user_id', uid);
    return { status: 200, body: { ok: true, publishToInterface: enabled, listing } };
  }

  if (action === 'complete') {
    const enabled = publishEnabled(project);
    const nextMeta = { ...currentMeta, interface: { ...currentInterface, publish: enabled, intake: enabled ? 'live' : 'private', verified: currentInterface.verified === true } };
    const { error: updateError } = await svc.from('developer_projects').update({ stage: 'completed', status_label: 'Completed', meta: nextMeta, updated_at: new Date().toISOString() }).eq('id', project.id).eq('owner_user_id', uid);
    if (updateError) return { status: 500, body: { error: updateError.message } };
    const listing = enabled ? await ensurePublishedListing(svc, { ...project, stage: 'completed', meta: nextMeta }, uid) : null;
    return { status: 200, body: { ok: true, projectId, publishToInterface: enabled, live: Boolean(listing), verified: false, listing } };
  }

  if (action === 'profile') {
    const allowed = ['title','tagline','description','category','subcategory','tags','price_cents','billing','icon_url','cover_url','video_url','screenshots','partnership','collaboration','investment','contact','call_available','message_available'];
    const patch = {};
    for (const key of allowed) if (Object.prototype.hasOwnProperty.call(body, key)) patch[key] = body[key];
    const complete = Boolean(body.complete);
    const nextInterface = { ...currentInterface, ...patch, verified: complete };
    const nextMeta = { ...currentMeta, interface: nextInterface };
    const { error: updateError } = await svc.from('developer_projects').update({ meta: nextMeta, updated_at: new Date().toISOString() }).eq('id', project.id).eq('owner_user_id', uid);
    if (updateError) return { status: 500, body: { error: updateError.message } };
    let listing = null;
    if (publishEnabled(project)) {
      listing = await ensurePublishedListing(svc, { ...project, meta: nextMeta }, uid);
      if (complete) {
        const { error: listingError } = await svc.from('listings').update({ title: patch.title || project.name, tagline: patch.tagline ?? project.tagline, description: patch.description ?? null, category: patch.category || 'developer', price_cents: Number(patch.price_cents || 0), billing: patch.billing || 'free', icon_url: patch.icon_url || null, cover_url: patch.cover_url || null, video_url: patch.video_url || null, status: 'published', published_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', listing.id).eq('publisher_user_id', uid);
        if (listingError) return { status: 500, body: { error: listingError.message } };
      }
    }
    return { status: 200, body: { ok: true, verified: complete, listing } };
  }

  return { status: 400, body: { error: 'Unknown action', code: 'INTERFACE_ACTION_INVALID' } };
}
