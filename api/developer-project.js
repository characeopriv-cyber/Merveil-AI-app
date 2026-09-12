import { createClient } from '@supabase/supabase-js';
import { getSession, sendJson } from '../lib/supabaseServer.js';

const SUPABASE_URL = 'https://dixfybqlepticyudikuz.supabase.co';

function db(){
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SERVICE_ROLE;
  if(!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  return createClient(SUPABASE_URL,key,{auth:{autoRefreshToken:false,persistSession:false}});
}

async function uid(req,res){
  const s=await getSession(req,res).catch(()=>({user:null,jwtSub:null}));
  return s?.user?.id||s?.jwtSub||null;
}

function slugify(value){
  return String(value||'project').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60)||'project';
}

export default async function handler(req,res){
  const owner_user_id=await uid(req,res);
  if(!owner_user_id) return sendJson(res,401,{error:'Sign in required',code:'AUTH_REQUIRED'});
  try{
    const database=db();
    if(req.method==='GET'){
      const {data,error}=await database.from('developer_projects').select('id,name,slug,tagline,stage,status_label,momentum,created_at,updated_at').eq('owner_user_id',owner_user_id).order('updated_at',{ascending:false}).limit(50);
      if(error) throw error;
      return sendJson(res,200,{ok:true,projects:data||[]});
    }
    if(req.method!=='POST') return sendJson(res,405,{error:'Method not allowed'});
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const action=body.action||'select';
    if(action==='select'){
      if(!body.projectId) return sendJson(res,400,{error:'projectId required'});
      const {data,error}=await database.from('developer_projects').select('id,name,slug,tagline,stage,status_label,momentum,created_at,updated_at').eq('id',body.projectId).eq('owner_user_id',owner_user_id).maybeSingle();
      if(error) throw error;
      if(!data) return sendJson(res,404,{error:'Project not found'});
      return sendJson(res,200,{ok:true,project:data,activeProjectId:data.id});
    }
    if(action==='create'){
      const name=String(body.name||'Untitled project').trim().slice(0,120);
      const slug=slugify(body.slug||name);
      const {data,error}=await database.from('developer_projects').insert({owner_user_id,name,slug,tagline:String(body.tagline||'').slice(0,240),stage:'build',status_label:'Ready',momentum:0}).select('id,name,slug,tagline,stage,status_label,momentum,created_at,updated_at').single();
      if(error) throw error;
      return sendJson(res,201,{ok:true,project:data,activeProjectId:data.id});
    }
    return sendJson(res,400,{error:'Unknown action'});
  }catch(e){
    return sendJson(res,500,{error:e?.message||'Developer project failed'});
  }
}
