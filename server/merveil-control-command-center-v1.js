import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const url=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL;
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
const db=url&&key?createClient(url,key,{auth:{persistSession:false}}):null;
const ADMIN_COOKIE='merveil_admin_session';
const out=(res,s,b)=>{res.statusCode=s;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(b));};
function cookies(req){const raw=String(req.headers?.cookie||'');const out={};for(const p of raw.split(';')){const i=p.indexOf('=');if(i>0)out[p.slice(0,i).trim()]=decodeURIComponent(p.slice(i+1).trim());}return out;}
function hashToken(token){return crypto.createHash('sha256').update(token).digest('hex');}
async function admin(req){
  if(!db)return null;
  const token=cookies(req)[ADMIN_COOKIE];
  if(!token)return null;
  const {data:session}=await db.from('admin_sessions').select('id,admin_id,expires_at,revoked_at').eq('token_hash',hashToken(token)).maybeSingle();
  if(!session||session.revoked_at||new Date(session.expires_at).getTime()<Date.now())return null;
  const {data:row}=await db.from('admin_users').select('id,email,name,status,role_id,mfa_enabled').eq('id',session.admin_id).maybeSingle();
  if(!row||row.status!=='active')return null;
  const {data:role}=await db.from('admin_roles').select('key,name,permissions').eq('id',row.role_id).maybeSingle();
  let permissions=Array.isArray(role?.permissions)?role.permissions:[];
  if(role?.key==='super_admin'&&!permissions.includes('*'))permissions=['*',...permissions];
  return {admin:row,role:role?.key||null,roleName:role?.name||null,permissions};
}
function allowed(ctx){return !!ctx&&(ctx.role==='super_admin'||ctx.permissions.includes('*')||ctx.permissions.includes('ecosystem.read')||ctx.permissions.includes('analytics.read')||ctx.permissions.includes('audit.read'));}
export default async function handler(req,res){
  if(req.method!=='GET')return out(res,405,{error:'method_not_allowed'});
  const ctx=await admin(req);
  if(!allowed(ctx))return out(res,403,{error:'forbidden'});
  try{
    const [cc,domains,providers,incidents,deps,events]=await Promise.all([
      db.from('merveil_control_command_center_v1').select('*').single(),
      db.from('merveil_control_domain_state').select('*').order('domain_key'),
      db.from('merveil_control_ai_provider_state').select('*').order('total_cost_usd',{ascending:false}),
      db.from('merveil_control_incidents').select('*').in('status',['open','investigating']).order('opened_at',{ascending:false}).limit(25),
      db.from('merveil_control_external_health_v1').select('*').order('criticality'),
      db.from('merveil_control_events').select('*').order('occurred_at',{ascending:false}).limit(50)
    ]);
    return out(res,200,{ok:true,admin:{id:ctx.admin.id,name:ctx.admin.name,role:ctx.role,mfa_enabled:!!ctx.admin.mfa_enabled},summary:cc.data||{},domains:domains.data||[],ai_providers:providers.data||[],incidents:incidents.data||[],external_dependencies:deps.data||[],recent_events:events.data||[]});
  }catch(e){console.error('[control-command-center]',e);return out(res,500,{error:'command_center_failed'});}
}
