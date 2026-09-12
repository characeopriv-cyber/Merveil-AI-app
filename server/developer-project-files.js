import { createClient } from '@supabase/supabase-js';
import { getSession } from '../lib/supabaseServer.js';

const SUPABASE_URL = 'https://dixfybqlepticyudikuz.supabase.co';
const MAX_FILES = 300;
const MAX_FILE_BYTES = 750_000;
const MAX_TOTAL_BYTES = 8_000_000;
const BLOCKED = /(^|\/)(\.env(?:\..*)?|node_modules|dist|build|\.git|coverage)(\/|$)|\.(pem|key|p12|pfx)$/i;
const admin = () => createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE, { auth: { autoRefreshToken: false, persistSession: false } });
const bodyOf = (req) => typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
const userId = async (req, res) => { const s = await getSession(req, res).catch(() => ({ user: null, jwtSub: null })); return s?.user?.id || s?.jwtSub || null; };
const cleanPath = (p) => String(p || '').replace(/\\/g, '/').replace(/^\/+/, '').trim();
const validPath = (p) => p && p.length < 500 && !p.split('/').includes('..') && !BLOCKED.test(p);

export default async function developerProjectFiles(req, res) {
  const uid = await userId(req, res); if (!uid) return { status: 401, body: { error: 'Sign in required', code: 'AUTH_REQUIRED' } };
  const db = admin(); const body = bodyOf(req); const projectId = String(req.query?.projectId || body.projectId || '');
  if (!projectId) return { status: 400, body: { error: 'projectId is required' } };
  const { data: project, error: pe } = await db.from('developer_projects').select('id,name,owner_user_id').eq('id', projectId).eq('owner_user_id', uid).maybeSingle();
  if (pe) return { status: 500, body: { error: pe.message } }; if (!project) return { status: 404, body: { error: 'Project not found' } };
  if (req.method === 'GET') {
    const { data, error } = await db.from('developer_project_files').select('id,path,content,created_at,updated_at').eq('project_id', projectId).eq('owner_user_id', uid).order('path');
    if (error) return { status: 500, body: { error: error.message } };
    return { status: 200, body: { ok: true, project, files: data || [] } };
  }
  if (req.method === 'POST') {
    const files = Array.isArray(body.files) ? body.files : [];
    if (!files.length) return { status: 400, body: { error: 'files array is required' } };
    const seen = new Set(); let total = 0; const rejected = [];
    const rows = files.slice(0, MAX_FILES).map(f => {
      const path = cleanPath(f?.path); const content = String(f?.content ?? '');
      if (!validPath(path) || seen.has(path) || content.length > MAX_FILE_BYTES) { rejected.push(path || 'invalid'); return null; }
      seen.add(path); total += Buffer.byteLength(content, 'utf8');
      if (total > MAX_TOTAL_BYTES) { rejected.push(path); return null; }
      return { project_id: projectId, owner_user_id: uid, path, content };
    }).filter(Boolean);
    if (!rows.length) return { status: 400, body: { error: 'No valid files supplied', code: 'FILES_REJECTED', rejected: rejected.slice(0, 20) } };
    if (rejected.length) return { status: 413, body: { error: 'Project contains blocked or oversized files', code: 'FILE_POLICY_REJECTED', rejected: rejected.slice(0, 20), maxFiles: MAX_FILES, maxFileBytes: MAX_FILE_BYTES, maxTotalBytes: MAX_TOTAL_BYTES } };
    const { data, error } = await db.from('developer_project_files').upsert(rows, { onConflict: 'project_id,path' }).select('id,path,updated_at');
    if (error) return { status: 500, body: { error: error.message } };
    return { status: 200, body: { ok: true, saved: data?.length || 0, files: data || [], totalBytes: total } };
  }
  if (req.method === 'DELETE') {
    const path = cleanPath(body.path); if (!path) return { status: 400, body: { error: 'path is required' } };
    const { error } = await db.from('developer_project_files').delete().eq('project_id', projectId).eq('owner_user_id', uid).eq('path', path);
    if (error) return { status: 500, body: { error: error.message } };
    return { status: 200, body: { ok: true, deleted: path } };
  }
  return { status: 405, body: { error: 'Method not allowed' } };
}
