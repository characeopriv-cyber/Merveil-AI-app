import { json, requireApiKey, logApiUsage, supabaseAdmin } from './_lib.js';
import { emitWebhookEventSafe } from './webhook-events.js';
import { generate } from './intelligence-router.js';

const LIMITS = { ordinary: 10, services: 25, investor: 100000 };
export default async function handler(req,res){
  if(req.method==='OPTIONS') return json(res,204,null);
  const auth=await requireApiKey(req,'ai:use',res);
  if(auth.error) return json(res,auth.status||401,{error:auth.status===403?'insufficient_scope':'unauthorized',message:auth.error,request_id:auth.requestId},auth.headers);
  if(req.method!=='POST') return json(res,405,{error:'method_not_allowed',request_id:auth.requestId});
  let b; try{b=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});}catch{return json(res,400,{error:'invalid_json',request_id:auth.requestId});}
  const messages=Array.isArray(b.messages)?b.messages.filter(m=>m&&['user','assistant'].includes(m.role)&&typeof m.content==='string').slice(-20).map(m=>({role:m.role,content:m.content.slice(0,8000)})):[];
  if(!messages.length) return json(res,400,{error:'messages_required',request_id:auth.requestId});
  const {data:profile}=await supabaseAdmin.from('profiles').select('passport_tier').eq('id',auth.app.user_id).maybeSingle();
  const tier=profile?.passport_tier||'ordinary'; const limit=LIMITS[tier]??10; const today=new Date().toISOString().slice(0,10);
  const {data:usage}=await supabaseAdmin.from('ai_usage').select('message_count').eq('user_id',auth.app.user_id).eq('usage_date',today).maybeSingle();
  if((usage?.message_count||0)>=limit){await logApiUsage(auth,req,429);return json(res,429,{error:'daily_ai_limit_reached',limit,used:usage?.message_count||0,request_id:auth.requestId});}
  try{
    const capability=String(b.capability||'general').toLowerCase();
    const result=await generate({messages,maxTokens:b.max_tokens,temperature:b.temperature,capability});
    await supabaseAdmin.rpc('increment_ai_usage',{uid:auth.app.user_id}).catch(()=>{});
    await emitWebhookEventSafe('ai.completed',{application_id:auth.app.id,user_id:auth.app.user_id,model:result.model,provider:result.provider,capability,request_id:auth.requestId});
    await logApiUsage(auth,req,200);
    return json(res,200,{data:{reply:result.reply,model:'merveil-intelligence',capability:result.capability,capability_label:result.capability_label,provider:'merveil',routing:'automatic'},request_id:auth.requestId});
  }catch{await logApiUsage(auth,req,503);return json(res,503,{error:'merveil_intelligence_unavailable',request_id:auth.requestId});}
}
