import { json, requireApiKey, logApiUsage } from './_lib.js';
import { emitWebhookEventSafe } from './webhook-events.js';

export default async function handler(req,res){
  if(req.method==='OPTIONS') return json(res,204,null);
  const scope=req.method==='GET'?'call:read':'call:write';
  const auth=await requireApiKey(req,scope,res);
  if(auth.error)return json(res,auth.status||401,{error:auth.status===403?'insufficient_scope':'unauthorized',message:auth.error,request_id:auth.requestId},auth.headers);
  if(req.method==='GET'){await logApiUsage(auth,req,200);return json(res,200,{data:{capability:'merveil-ai-call',status:'available',provider:'server-side',note:'Call credentials are never returned to clients.'},request_id:auth.requestId});}
  if(req.method!=='POST')return json(res,405,{error:'method_not_allowed',request_id:auth.requestId});
  const b=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
  const assistantId=String(b.assistant_id||'').trim();const phoneNumberId=String(b.phone_number_id||'').trim();const customerNumber=String(b.customer?.number||b.customer_number||'').trim();
  if(!assistantId||!customerNumber){return json(res,400,{error:'assistant_id_and_customer_number_required',request_id:auth.requestId});}
  if(!/^\+[1-9]\d{6,14}$/.test(customerNumber))return json(res,400,{error:'invalid_customer_number',message:'Use E.164 format.',request_id:auth.requestId});
  const key=process.env.VAPI_API_KEY||process.env.VAPI_PRIVATE_KEY||'';
  if(!key){await logApiUsage(auth,req,503);return json(res,503,{error:'call_provider_not_configured',message:'Configure the Vapi server credential in the server environment.',request_id:auth.requestId});}
  const payload={assistantId,customer:{number:customerNumber}};if(phoneNumberId)payload.phoneNumberId=phoneNumberId;
  try{const upstream=await fetch('https://api.vapi.ai/call',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify(payload)});const text=await upstream.text();if(!upstream.ok){await logApiUsage(auth,req,502);return json(res,502,{error:'call_provider_error',request_id:auth.requestId});}let data;try{data=JSON.parse(text)}catch{data={id:null,status:'queued'}};await emitWebhookEventSafe('call.started',{application_id:auth.app.id,user_id:auth.app.user_id,call_id:data.id||null,assistant_id:assistantId,customer_number_last4:customerNumber.slice(-4),provider:'vapi',status:data.status||'queued',request_id:auth.requestId});await logApiUsage(auth,req,201);return json(res,201,{data:{id:data.id,status:data.status||'queued',provider:'vapi'},request_id:auth.requestId});}catch(e){await logApiUsage(auth,req,502);return json(res,502,{error:'call_request_failed',request_id:auth.requestId});}
}
