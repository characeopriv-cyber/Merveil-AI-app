import { json, requireApiKey, logApiUsage, supabaseAdmin } from './_lib.js';
import { emitWebhookEventSafe } from './webhook-events.js';

const LIMITS={ordinary:10,services:25,investor:100000};
export default async function handler(req,res){
  if(req.method==='OPTIONS') return json(res,204,null);
  const auth=await requireApiKey(req,'ai:use',res);
  if(auth.error) return json(res,auth.status||401,{error:auth.status===403?'insufficient_scope':'unauthorized',message:auth.error,request_id:auth.requestId},auth.headers);
  if(req.method!=='POST') return json(res,405,{error:'method_not_allowed',request_id:auth.requestId});
  const b=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
  const messages=Array.isArray(b.messages)?b.messages.filter(m=>m&&['user','assistant'].includes(m.role)&&typeof m.content==='string').slice(-20).map(m=>({role:m.role,content:m.content.slice(0,8000)})):[];
  if(!messages.length) return json(res,400,{error:'messages_required',request_id:auth.requestId});
  const {data:profile}=await supabaseAdmin.from('profiles').select('passport_tier').eq('id',auth.app.user_id).maybeSingle();
  const tier=profile?.passport_tier||'ordinary'; const limit=LIMITS[tier]??10; const today=new Date().toISOString().slice(0,10);
  const {data:usage}=await supabaseAdmin.from('ai_usage').select('message_count').eq('user_id',auth.app.user_id).eq('usage_date',today).maybeSingle();
  if((usage?.message_count||0)>=limit){await logApiUsage(auth,req,429);return json(res,429,{error:'daily_ai_limit_reached',limit,used:usage?.message_count||0,request_id:auth.requestId});}
  const apiUrl=(process.env.AI_API_URL||process.env.XAI_API_URL||'').replace(/\/$/,''); const apiKey=process.env.AI_API_KEY||process.env.XAI_API_KEY||''; const model=process.env.AI_MODEL||process.env.XAI_MODEL||'grok-2-latest';
  if(!apiUrl||!apiKey){await logApiUsage(auth,req,503);return json(res,503,{error:'ai_provider_not_configured',request_id:auth.requestId});}
  try{const upstream=await fetch(apiUrl.includes('/chat/completions')?apiUrl:`${apiUrl}/chat/completions`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${apiKey}`},body:JSON.stringify({model,messages:[{role:'system',content:'You are Merveil AI, an intelligent assistant available through the Merveil developer platform.'},...messages],max_tokens:Math.min(Number(b.max_tokens)||800,2048),temperature:0.7})});const text=await upstream.text();if(!upstream.ok){await logApiUsage(auth,req,502);return json(res,502,{error:'ai_upstream_error',request_id:auth.requestId});}let data;try{data=JSON.parse(text)}catch{data={reply:text}};const reply=data?.choices?.[0]?.message?.content||data?.reply||data?.content||data?.message||'';await supabaseAdmin.rpc('increment_ai_usage',{uid:auth.app.user_id}).catch(()=>{});await emitWebhookEventSafe('ai.completed',{application_id:auth.app.id,user_id:auth.app.user_id,model,reply:String(reply).trim(),request_id:auth.requestId});await logApiUsage(auth,req,200);return json(res,200,{data:{reply:String(reply).trim(),model},request_id:auth.requestId});}catch(e){await logApiUsage(auth,req,502);return json(res,502,{error:'ai_request_failed',request_id:auth.requestId});}
}
