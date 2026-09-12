import { createClient } from '@supabase/supabase-js';
import { getSession, sendJson } from '../lib/supabaseServer.js';

const SUPABASE_URL='https://dixfybqlepticyudikuz.supabase.co';
function db(){
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SERVICE_ROLE;
  if(!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  return createClient(SUPABASE_URL,key,{auth:{autoRefreshToken:false,persistSession:false}});
}

export default async function handler(req,res){
  let s={user:null,jwtSub:null};
  try{s=await getSession(req,res);}catch{}
  const uid=s?.user?.id||s?.jwtSub||null;
  if(!uid) return sendJson(res,401,{error:'Sign in required',code:'AUTH_REQUIRED'});
  try{
    const projectId=String(req.query?.projectId||'').trim();
    if(!projectId) return sendJson(res,400,{error:'projectId required'});
    const {data,error}=await db().from('developer_projects').select('id,name,slug,tagline,stage,status_label,momentum,created_at,updated_at').eq('id',projectId).eq('owner_user_id',uid).maybeSingle();
    if(error) throw error;
    if(!data) return sendJson(res,404,{error:'Project not found'});
    return sendJson(res,200,{ok:true,project:data,context:{projectId:data.id,projectName:data.name,stage:data.stage,status:data.status_label}});
  }catch(e){return sendJson(res,500,{error:e?.message||'Project context failed'});}
}
