import { createClient } from '@supabase/supabase-js';
import { getSession, sendJson } from '../lib/supabaseServer.js';

const SUPABASE_URL='https://dixfybqlepticyudikuz.supabase.co';
const PROVIDERS=['github','vercel','supabase'];

function db(){
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SERVICE_ROLE;
  if(!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  return createClient(SUPABASE_URL,key,{auth:{autoRefreshToken:false,persistSession:false}});
}

export default async function handler(req,res){
  if(req.method!=='GET') return sendJson(res,405,{error:'Method not allowed'});
  const session=await getSession(req,res).catch(()=>({user:null,jwtSub:null}));
  const uid=session?.user?.id||session?.jwtSub||null;
  if(!uid) return sendJson(res,401,{ok:false,code:'AUTH_REQUIRED',error:'Sign in required'});
  try{
    const database=db();
    const [{data:projects,error:projectError},{data:connections,error:connectionError}]=await Promise.all([
      database.from('developer_projects').select('id,name,updated_at').eq('owner_user_id',uid).order('updated_at',{ascending:false}).limit(50),
      database.from('developer_provider_connections').select('provider,status,updated_at').eq('owner_user_id',uid).order('updated_at',{ascending:false})
    ]);
    if(projectError) throw projectError;
    if(connectionError) throw connectionError;
    const byProvider=new Map((connections||[]).map(c=>[c.provider,c]));
    const providerHealth=PROVIDERS.map(provider=>({provider,connected:['connected','active','ready'].includes(String(byProvider.get(provider)?.status||'').toLowerCase()),status:byProvider.get(provider)?.status||'available',updatedAt:byProvider.get(provider)?.updated_at||null}));
    return sendJson(res,200,{ok:true,version:1,service:'developer-platform',userId:uid,projectCount:(projects||[]).length,activeProjectRequired:true,providers:providerHealth,checks:{auth:true,projects:true,providerConnections:true}});
  }catch(e){
    return sendJson(res,500,{ok:false,service:'developer-platform',code:'HEALTH_CHECK_FAILED',error:e?.message||'Developer health check failed'});
  }
}
