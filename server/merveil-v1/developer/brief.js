import { supabaseAdmin, json, requestId, requireUser } from '../_lib.js';

const body=req=>{try{return typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});}catch{return{};}};
const visibilityOk=v=>v==='private'||v==='public';

export default async function handler(req,res){
  requestId(req,res);
  if(req.method==='OPTIONS')return json(res,204,{});
  const auth=await requireUser(req);if(!auth.user)return json(res,401,{error:'authentication_required'});
  const id=String(req.query?.project_id||'').trim();if(!id)return json(res,400,{error:'project_id_required'});
  try{
    const {data:p,error}=await supabaseAdmin.from('developer_projects').select('id,name,owner_user_id,meta').eq('id',id).eq('owner_user_id',auth.user.id).maybeSingle();
    if(error)throw error;if(!p)return json(res,404,{error:'project_not_found'});
    if(req.method==='GET'){
      const brief=p.meta?.project_brief||{};
      return json(res,200,{brief:{title:brief.title||p.name,summary:brief.summary||'',visibility:brief.visibility==='public'?'public':'private',updated_at:brief.updated_at||null}});
    }
    if(req.method!=='POST'&&req.method!=='PATCH')return json(res,405,{error:'method_not_allowed'});
    const b=body(req);const visibility=String(b.visibility||'private');if(!visibilityOk(visibility))return json(res,400,{error:'invalid_visibility'});
    const title=String(b.title??p.name).trim().slice(0,120);const summary=String(b.summary??'').trim().slice(0,4000);
    const nextMeta={...(p.meta||{}),project_brief:{title,summary,visibility,updated_at:new Date().toISOString()}};
    const {data,error:updateError}=await supabaseAdmin.from('developer_projects').update({meta:nextMeta}).eq('id',id).eq('owner_user_id',auth.user.id).select('id,name,meta').single();
    if(updateError)throw updateError;
    return json(res,200,{brief:data.meta.project_brief,project_id:data.id});
  }catch(error){console.error('[developer-brief]',error);return json(res,500,{error:'project_brief_failed'});}
}
