import { json, requireUser, supabaseAdmin } from './_lib.js';

export default async function handler(req,res){
  if(req.method==='OPTIONS') return json(res,204,null);
  const auth=await requireUser(req);
  if(auth.error) return json(res,401,{error:'unauthorized',message:auth.error});
  if(req.method!=='GET') return json(res,405,{error:'method_not_allowed'});
  const days=Math.min(Math.max(Number(req.query?.days||7),1),30);
  const since=new Date(Date.now()-days*86400000).toISOString();
  const {data:apps,error:ae}=await supabaseAdmin.from('api_applications').select('id,name,environment,status').eq('user_id',auth.user.id);
  if(ae) return json(res,500,{error:'database_error'});
  if(!apps?.length) return json(res,200,{data:{days,totals:{requests:0,errors:0},applications:[]}});
  const {data:logs,error}=await supabaseAdmin.from('api_usage_logs').select('application_id,status_code,created_at').in('application_id',apps.map(a=>a.id)).gte('created_at',since).order('created_at',{ascending:false}).limit(10000);
  if(error) return json(res,500,{error:'database_error'});
  const byApp=apps.map(a=>{const rows=(logs||[]).filter(l=>l.application_id===a.id);return {...a,requests:rows.length,errors:rows.filter(l=>Number(l.status_code)>=400).length,last_request_at:rows[0]?.created_at||null};});
  return json(res,200,{data:{days,totals:{requests:logs?.length||0,errors:(logs||[]).filter(l=>Number(l.status_code)>=400).length},applications:byApp}});
}
