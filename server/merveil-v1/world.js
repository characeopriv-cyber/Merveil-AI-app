import { json, requireApiKey, logApiUsage, supabaseAdmin } from './_lib.js';

export default async function handler(req,res){
  if(req.method==='OPTIONS') return json(res,204,null);
  const auth=await requireApiKey(req,'world:read',res);
  if(auth.error) return json(res,auth.status||401,{error:auth.status===403?'insufficient_scope':'unauthorized',message:auth.error,request_id:auth.requestId},auth.headers);
  if(req.method!=='GET') return json(res,405,{error:'method_not_allowed',request_id:auth.requestId});
  const limit=Math.min(Math.max(Number(req.query?.limit||20),1),100);
  let q=supabaseAdmin.from('world_posts').select('id,owner_id,title,topic,country,description,photo_url,photo_urls,video_url,media_type,views,likes_count,created_at,content_origin,reposts_count,comments_count').order('created_at',{ascending:false}).limit(limit);
  if(req.query?.topic) q=q.eq('topic',String(req.query.topic).slice(0,80));
  if(req.query?.country) q=q.eq('country',String(req.query.country).slice(0,80));
  const {data,error}=await q;
  if(error){await logApiUsage(auth,req,500);return json(res,500,{error:'database_error',request_id:auth.requestId});}
  await logApiUsage(auth,req,200); return json(res,200,{data:data||[],request_id:auth.requestId});
}
