import { createClient } from '@supabase/supabase-js';
import { getSession } from '../lib/supabaseServer.js';
const URL='https://dixfybqlepticyudikuz.supabase.co';
const db=()=>createClient(URL,process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SERVICE_ROLE||'',{auth:{autoRefreshToken:false,persistSession:false}});
export default async function handler(req,res){
 if(req.method!=='GET')return{status:405,body:{error:'Method not allowed'}};
 const s=await getSession(req,res).catch(()=>({user:null,jwtSub:null}));const uid=s?.user?.id||s?.jwtSub;if(!uid)return{status:401,body:{error:'Sign in required',code:'AUTH_REQUIRED'}};
 try{const d=db();const [{data:projects,error:pe},{data:connections,error:ce}]=await Promise.all([d.from('developer_projects').select('id,status_label,updated_at').eq('owner_user_id',uid),d.from('developer_provider_connections').select('provider,status,updated_at').eq('user_id',uid)]);if(pe)throw pe;if(ce)throw ce;const providers={github:'disconnected',vercel:'disconnected',supabase:'disconnected'};for(const c of connections||[]){if(c.provider in providers&&['connected','active','ready'].includes(String(c.status)))providers[c.provider]=c.status}return{status:200,body:{ok:true,contract:'developer-health-v1',projectCount:(projects||[]).length,projects:projects||[],providers}}}catch(e){return{status:500,body:{error:e?.message||'Developer health failed',code:'HEALTH_CHECK_FAILED'}}}
}
