import { json, requireUser, newSecret, hashKey, supabaseAdmin } from './_lib.js';

function body(req){return typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});}
export default async function handler(req,res){
  if(req.method==='OPTIONS') return json(res,204,null);
  const auth=await requireUser(req); if(auth.error) return json(res,401,{error:'unauthorized',message:auth.error});
  const appId=String(req.query?.app_id||''); if(!appId) return json(res,400,{error:'app_id_required'});
  const {data:app}=await supabaseAdmin.from('api_applications').select('id').eq('id',appId).eq('user_id',auth.user.id).maybeSingle();
  if(!app) return json(res,404,{error:'application_not_found'});
  if(req.method==='GET'){const {data,error}=await supabaseAdmin.from('api_webhooks').select('id,url,events,status,created_at,updated_at').eq('application_id',appId).order('created_at',{ascending:false});if(error)return json(res,500,{error:'database_error'});return json(res,200,{data});}
  if(req.method==='POST'){const b=body(req);const url=String(b.url||'').trim();const events=Array.isArray(b.events)?[...new Set(b.events.map(String).filter(Boolean))].slice(0,50):[];if(!/^https:\/\//i.test(url)||url.length>2000)return json(res,400,{error:'invalid_webhook_url'});const secret=newSecret('whsec_');const {data,error}=await supabaseAdmin.from('api_webhooks').insert({application_id:appId,url,events,secret_hash:hashKey(secret.value)}).select('id,url,events,status,created_at,updated_at').single();if(error)return json(res,500,{error:'database_error'});return json(res,201,{data,signing_secret:secret.value,warning:'Store this signing secret securely. It will not be shown again.'});}
  if(req.method==='DELETE'){const id=String(req.query?.id||'');if(!id)return json(res,400,{error:'webhook_id_required'});const {error}=await supabaseAdmin.from('api_webhooks').delete().eq('id',id).eq('application_id',appId);if(error)return json(res,500,{error:'database_error'});return json(res,200,{data:{id,deleted:true}});}
  return json(res,405,{error:'method_not_allowed'});
}
