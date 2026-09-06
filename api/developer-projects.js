import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dixfybqlepticyudikuz.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function send(res, status, body) { res.status(status).json(body); }
function client() {
  if (!SERVICE_KEY) throw new Error('Missing server-side Supabase service-role configuration');
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
}
async function userFromRequest(req, svc) {
  const h = String(req.headers.authorization || '');
  if (h.startsWith('Bearer ')) {
    const token = h.slice(7).trim();
    if (token) {
      const { data, error } = await svc.auth.getUser(token);
      if (!error && data?.user) return data.user;
    }
  }
  const cookie = String(req.headers.cookie || '');
  if (cookie) {
    try {
      const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0];
      const host = String(req.headers.host || '').split(',')[0];
      const r = await fetch(`${proto}://${host}/api/auth-session?reason=developer`, { headers:{cookie}, cache:'no-store' });
      const body = await r.json().catch(()=>null);
      if (r.ok && body?.authenticated && body?.user?.id) return body.user;
    } catch {}
  }
  return null;
}
function validName(v) { return typeof v === 'string' && v.trim().length >= 1 && v.trim().length <= 80; }
function slugify(v) { return v.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60) || 'project'; }

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  try {
    const svc = client();
    const user = await userFromRequest(req, svc);
    if (!user) return send(res, 401, { error: 'authentication_required' });
    const action = String(req.query?.action || 'projects');
    const projectId = String(req.query?.project_id || '').trim();

    if (action === 'projects' && req.method === 'GET') {
      const { data, error } = await svc.from('developer_projects').select('*').eq('owner_user_id', user.id).order('created_at', { ascending:false });
      if (error) return send(res, 500, { error: error.message });
      return send(res, 200, { projects: data || [] });
    }
    if (action === 'projects' && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      if (!validName(body.name)) return send(res, 400, { error:'invalid_project_name' });
      const runtime = ['static','node','nextjs'].includes(body.runtime) ? body.runtime : 'static';
      const entry = typeof body.entry === 'string' && body.entry.trim() ? body.entry.trim() : 'index.html';
      const { data, error } = await svc.from('developer_projects').insert({ owner_user_id:user.id, name:body.name.trim(), slug:slugify(body.name), tagline:body.tagline || 'Merveil Developer Project', stage:'created', status_label:'Ready to build', momentum:0, twin:{runtime,entry,template:body.template || 'blank'}, meta:{capabilities:Array.isArray(body.capabilities)?body.capabilities:[]} }).select('*').single();
      if (error) return send(res, 500, { error:error.message });
      const starter = runtime === 'static' ? [{path:'index.html',content:`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${body.name}</title></head><body><main><h1>${body.name}</h1><p>Built with Merveil Developer Platform.</p></main></body></html>`}] : [];
      if (starter.length) await svc.from('developer_project_files').insert(starter.map(f=>({...f,project_id:data.id,owner_user_id:user.id})));
      return send(res, 201, { project:data, files:starter });
    }
    if (!projectId) return send(res, 400, { error:'project_id_required' });
    const owner = await svc.from('developer_projects').select('id').eq('id',projectId).eq('owner_user_id',user.id).maybeSingle();
    if (owner.error || !owner.data) return send(res,404,{error:'project_not_found'});

    if (action === 'files' && req.method === 'GET') {
      const {data,error}=await svc.from('developer_project_files').select('id,path,content,created_at,updated_at').eq('project_id',projectId).eq('owner_user_id',user.id).order('path');
      if(error) return send(res,500,{error:error.message});
      return send(res,200,{files:data||[]});
    }
    if (action === 'files' && (req.method === 'POST' || req.method === 'PUT')) {
      const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
      if(typeof body.path!=='string' || !body.path.trim() || typeof body.content!=='string') return send(res,400,{error:'path_and_content_required'});
      const payload={project_id:projectId,owner_user_id:user.id,path:body.path.replace(/^\/+/,''),content:body.content};
      const {data,error}=await svc.from('developer_project_files').upsert(payload,{onConflict:'project_id,path'}).select('*').single();
      if(error) return send(res,500,{error:error.message});
      return send(res,200,{file:data});
    }
    if (action === 'build' && req.method === 'POST') {
      const {data:files,error:fe}=await svc.from('developer_project_files').select('path,content').eq('project_id',projectId).eq('owner_user_id',user.id);
      if(fe) return send(res,500,{error:fe.message});
      const hasEntry=(files||[]).some(f=>f.path==='index.html');
      const logs=hasEntry?'Build validation passed: entry file index.html found. Project is deployable as a static project.':'Build validation failed: index.html is missing.';
      const status=hasEntry?'success':'failed';
      const {data,error}=await svc.from('developer_builds').insert({project_id:projectId,owner_user_id:user.id,status,logs,finished_at:new Date().toISOString()}).select('*').single();
      if(error) return send(res,500,{error:error.message});
      await svc.from('developer_projects').update({stage:status==='success'?'built':'build_failed',status_label:status==='success'?'Build passed':'Build failed',updated_at:new Date().toISOString()}).eq('id',projectId).eq('owner_user_id',user.id);
      return send(res,status==='success'?200:422,{build:data});
    }
    if (action === 'deploy' && req.method === 'POST') {
      const token=process.env.VERCEL_TOKEN;
      if(!token) return send(res,503,{error:'vercel_deployment_not_configured'});
      const {data:files,error:fe}=await svc.from('developer_project_files').select('path,content').eq('project_id',projectId).eq('owner_user_id',user.id);
      if(fe) return send(res,500,{error:fe.message});
      if(!(files||[]).some(f=>f.path==='index.html')) return send(res,422,{error:'build_required_or_index_missing'});
      const project=await svc.from('developer_projects').select('name,slug').eq('id',projectId).eq('owner_user_id',user.id).single();
      if(project.error) return send(res,500,{error:project.error.message});
      const created=await svc.from('developer_deployments').insert({project_id:projectId,owner_user_id:user.id,status:'building',provider:'vercel',logs:'Uploading project files to Vercel…'}).select('*').single();
      if(created.error) return send(res,500,{error:created.error.message});
      const vercelFiles=files.map(f=>({file:f.content, data:f.content, path:f.path}));
      const vr=await fetch('https://api.vercel.com/v13/deployments',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({name:`merveil-${project.data.slug}-${projectId.slice(0,8)}`,project:`merveil-${project.data.slug}-${projectId.slice(0,8)}`,files:vercelFiles,target:'production',teamId:process.env.VERCEL_TEAM_ID})});
      const vb=await vr.json().catch(()=>({}));
      if(!vr.ok){await svc.from('developer_deployments').update({status:'error',logs:JSON.stringify(vb)}).eq('id',created.data.id);return send(res,502,{error:'vercel_deployment_failed',details:vb});}
      const url=vb.url?`https://${vb.url}`:null;
      const updated=await svc.from('developer_deployments').update({status:vb.readyState==='READY'?'ready':'building',external_id:vb.id,url,logs:`Vercel deployment created: ${vb.id}`,ready_at:vb.readyState==='READY'?new Date().toISOString():null}).eq('id',created.data.id).select('*').single();
      await svc.from('developer_projects').update({stage:'deployed',status_label:vb.readyState==='READY'?'Deployed':'Deploying',updated_at:new Date().toISOString()}).eq('id',projectId).eq('owner_user_id',user.id);
      return send(res,200,{deployment:updated.data,vercel:vb});
    }
    return send(res,404,{error:'not_found'});
  } catch(e) { console.error('[developer-projects]',e); return send(res,500,{error:e.message||'internal_error'}); }
}
