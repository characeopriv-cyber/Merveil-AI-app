import { supabaseAdmin, json, requestId, requireUser } from '../_lib.js';

const LEVELS = new Set(['beginner','intermediate','expert']);
const cleanText = (v, max) => typeof v === 'string' ? v.trim().slice(0, max) : '';
const cleanList = (v, maxItems=30) => Array.isArray(v) ? [...new Set(v.map(x=>String(x).trim()).filter(Boolean))].slice(0,maxItems) : [];

async function citizen(userId){
  const {data,error}=await supabaseAdmin.from('profiles').select('id,name,avatar_url,country,city,profession,languages,account_type,company_name,passport_tier,kyc_level,kyc_status,kyc_verified_at').eq('id',userId).maybeSingle();
  if(error) throw error;
  return data || null;
}

export default async function handler(req,res){
  requestId(req,res);
  if(req.method==='OPTIONS') return json(res,204,{});
  const auth=await requireUser(req);
  if(!auth.user) return json(res,401,{error:'authentication_required',request_id:req._merveilRequestId});
  const userId=auth.user.id;
  try{
    if(req.method==='GET'){
      const [c,p]=await Promise.all([
        citizen(userId),
        supabaseAdmin.from('developer_profiles').select('id,user_id,verified_citizen,experience_level,display_name,bio,primary_language,frameworks,sectors,created_at,updated_at').eq('user_id',userId).maybeSingle()
      ]);
      if(p.error) throw p.error;
      const verified=Boolean(c?.kyc_status==='verified' || c?.kyc_verified_at);
      return json(res,200,{citizen:{id:c?.id||userId,name:c?.name||auth.user.user_metadata?.full_name||auth.user.email||'Citizen',avatar_url:c?.avatar_url||null,country:c?.country||null,profession:c?.profession||null,passport_tier:c?.passport_tier||null,kyc_level:c?.kyc_level||null,kyc_status:c?.kyc_status||null,verified},developer:p.data||null,needs_setup:!p.data});
    }
    if(!['POST','PATCH'].includes(req.method)) return json(res,405,{error:'method_not_allowed'});
    let b={};try{b=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});}catch{return json(res,400,{error:'invalid_json'});}
    const current=await supabaseAdmin.from('developer_profiles').select('*').eq('user_id',userId).maybeSingle();
    if(current.error) throw current.error;
    const patch={};
    if(b.experience_level!==undefined){const v=String(b.experience_level);if(!LEVELS.has(v))return json(res,400,{error:'invalid_experience_level'});patch.experience_level=v;}
    if(b.display_name!==undefined) patch.display_name=cleanText(b.display_name,80);
    if(b.bio!==undefined) patch.bio=cleanText(b.bio,500);
    if(b.primary_language!==undefined) patch.primary_language=cleanText(b.primary_language,60);
    if(b.frameworks!==undefined) patch.frameworks=cleanList(b.frameworks);
    if(b.sectors!==undefined) patch.sectors=cleanList(b.sectors);
    if(!Object.keys(patch).length)return json(res,400,{error:'no_profile_fields'});
    // Verification is derived server-side from the Citizen Passport/KYC record; the client cannot assert it.
    const c=await citizen(userId);patch.verified_citizen=Boolean(c?.kyc_status==='verified' || c?.kyc_verified_at);patch.updated_at=new Date().toISOString();
    let data,error;
    if(current.data){({data,error}=await supabaseAdmin.from('developer_profiles').update(patch).eq('user_id',userId).select('id,user_id,verified_citizen,experience_level,display_name,bio,primary_language,frameworks,sectors,created_at,updated_at').single());}
    else {({data,error}=await supabaseAdmin.from('developer_profiles').insert({user_id:userId,...patch}).select('id,user_id,verified_citizen,experience_level,display_name,bio,primary_language,frameworks,sectors,created_at,updated_at').single());}
    if(error) throw error;
    return json(res,current.data?200:201,{developer:data,citizen_verified:data.verified_citizen});
  }catch(error){console.error('[developer-profile]',error);return json(res,500,{error:'developer_profile_failed',request_id:req._merveilRequestId});}
}
