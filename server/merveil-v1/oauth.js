import crypto from 'node:crypto';
import { json, requireUser, newSecret, hashKey, SCOPES, supabaseAdmin } from './_lib.js';

function body(req){return typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});}
export default async function handler(req,res){
  if(req.method==='OPTIONS') return json(res,204,null);
  const auth=await requireUser(req); if(auth.error) return json(res,401,{error:'unauthorized',message:auth.error});
  if(!auth.user) return json(res,401,{error:'unauthorized'});
  const appId=String(req.query?.app_id||''); if(!appId) return json(res,400,{error:'app_id_required'});
  const {data:app}=await supabaseAdmin.from('api_applications').select('id').eq('id',appId).eq('user_id',auth.user.id).maybeSingle();
  if(!app)return json(res,404,{error:'application_not_found'});
  if(req.method==='GET'){const {data,error}=await supabaseAdmin.from('api_oauth_clients').select('id,client_id,redirect_uris,scopes,status,created_at').eq('application_id',appId).order('created_at',{ascending:false});if(error)return json(res,500,{error:'database_error'});return json(res,200,{data});}
  if(req.method==='POST'){const b=body(req);const redirectUris=Array.isArray(b.redirect_uris)?b.redirect_uris.filter(u=>typeof u==='string'&&/^https:\/\//i.test(u)).slice(0,20):[];if(!redirectUris.length)return json(res,400,{error:'redirect_uris_required'});const scopes=Array.isArray(b.scopes)?[...new Set(b.scopes.filter(s=>SCOPES.includes(s)&&s!=='oauth:manage'))]:['profile:read'];const clientId=`mvc_${crypto.randomBytes(18).toString('base64url')}`;const secret=newSecret('mvs_');const {data,error}=await supabaseAdmin.from('api_oauth_clients').insert({application_id:appId,client_id:clientId,client_secret_hash:hashKey(secret.value),redirect_uris:redirectUris,scopes}).select('id,client_id,redirect_uris,scopes,status,created_at').single();if(error)return json(res,500,{error:'database_error'});return json(res,201,{data,client_secret:secret.value,warning:'Store the client secret securely. It will not be shown again.'});}
  return json(res,405,{error:'method_not_allowed'});
}
