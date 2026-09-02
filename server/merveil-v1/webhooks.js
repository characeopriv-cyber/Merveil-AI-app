import crypto from 'node:crypto';
import { json, requireUser, newSecret, hashKey, supabaseAdmin } from './_lib.js';
import { encryptWebhookSecret, decryptWebhookSecret } from './webhook-secret.js';
import { WEBHOOK_EVENTS } from './webhook-events.js';
function body(req){return typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});}
const sign=(secret,timestamp,payload)=>`t=${timestamp},v1=${crypto.createHmac('sha256',secret).update(`${timestamp}.${payload}`).digest('hex')}`;
const send=async(h,eventId,eventType,payload,attempt=1)=>{
 const secret=decryptWebhookSecret(h.secret_ciphertext),envelope={id:eventId,type:eventType,data:payload||{},created_at:new Date().toISOString()},raw=JSON.stringify(envelope),ts=Math.floor(Date.now()/1000),signature=sign(secret,ts,raw),now=new Date().toISOString();
 const {data:d,error}=await supabaseAdmin.from('api_webhook_deliveries').insert({webhook_id:h.id,event_id:eventId,event_type:eventType,payload:payload||{},attempt,status:'pending',signature}).select('id').single();
 if(error&&error.code==='23505')return{duplicate:true};if(error)throw error;
 try{const r=await fetch(h.url,{method:'POST',headers:{'content-type':'application/json','user-agent':'Merveil-Webhooks/1.0','Merveil-Event-Id':eventId,'Merveil-Signature':signature,'Merveil-Timestamp':String(ts)},body:raw,signal:AbortSignal.timeout(10000)}),text=(await r.text()).slice(0,4000),ok=r.status>=200&&r.status<300;await supabaseAdmin.from('api_webhook_deliveries').update({status:ok?'delivered':attempt>=8?'failed':'retrying',response_status:r.status,response_body:text,delivered_at:ok?now:null,finished_at:now,error_message:ok?null:`HTTP ${r.status}`,next_attempt_at:ok||attempt>=8?null:new Date(Date.now()+60000).toISOString()}).eq('id',d.id);await supabaseAdmin.from('api_webhooks').update({last_delivery_at:now,...(ok?{failure_count:0,last_success_at:now}:{failure_count:1,last_failure_at:now})}).eq('id',h.id);return{delivery_id:d.id,delivered:ok,status:r.status};}
 catch(e){await supabaseAdmin.from('api_webhook_deliveries').update({status:attempt>=8?'failed':'retrying',error_message:String(e.message||e).slice(0,1000),finished_at:now,next_attempt_at:attempt>=8?null:new Date(Date.now()+60000).toISOString()}).eq('id',d.id);return{delivery_id:d.id,delivered:false,error:'delivery_failed'};}
};
export default async function handler(req,res){
 if(req.method==='OPTIONS')return json(res,204,null);const auth=await requireUser(req);if(auth.error)return json(res,401,{error:'unauthorized',message:auth.error});
 const appId=String(req.query?.app_id||'');if(!appId)return json(res,400,{error:'app_id_required'});const {data:app}=await supabaseAdmin.from('api_applications').select('id').eq('id',appId).eq('user_id',auth.user.id).maybeSingle();if(!app)return json(res,404,{error:'application_not_found'});
 if(req.method==='GET'){
  const action=String(req.query?.action||'');
  if(action==='deliveries'){let q=supabaseAdmin.from('api_webhook_deliveries').select('id,webhook_id,event_id,event_type,payload,attempt,status,response_status,response_body,signature,delivered_at,next_attempt_at,created_at,request_id,finished_at,error_message').eq('webhook_id',String(req.query?.webhook_id||''));const limit=Math.min(Math.max(Number(req.query?.limit||50),1),100);const {data,error}=await q.order('created_at',{ascending:false}).limit(limit);if(error)return json(res,500,{error:'database_error'});return json(res,200,{data:data||[]});}
  const {data,error}=await supabaseAdmin.from('api_webhooks').select('id,url,events,status,created_at,updated_at,failure_count,last_delivery_at,last_success_at,last_failure_at').eq('application_id',appId).order('created_at',{ascending:false});if(error)return json(res,500,{error:'database_error'});return json(res,200,{data});
 }
 if(req.method==='POST'){
  const b=body(req),action=String(req.query?.action||b.action||'');
  if(action==='replay'){
   const deliveryId=String(b.delivery_id||req.query?.delivery_id||'');if(!deliveryId)return json(res,400,{error:'delivery_id_required'});
   const {data:d}=await supabaseAdmin.from('api_webhook_deliveries').select('id,webhook_id,event_id,event_type,payload,attempt').eq('id',deliveryId).maybeSingle();if(!d)return json(res,404,{error:'delivery_not_found'});
   const {data:h}=await supabaseAdmin.from('api_webhooks').select('id,url,status,events,secret_ciphertext').eq('id',d.webhook_id).eq('application_id',appId).maybeSingle();if(!h)return json(res,404,{error:'webhook_not_found'});if(h.status!=='active')return json(res,409,{error:'webhook_inactive'});
   const {data:last}=await supabaseAdmin.from('api_webhook_deliveries').select('attempt').eq('webhook_id',h.id).eq('event_id',d.event_id).order('attempt',{ascending:false}).limit(1).maybeSingle();const result=await send(h,d.event_id,d.event_type,d.payload,Number(last?.attempt||0)+1);return json(res,202,{accepted:true,replay:true,data:result});
  }
  if(action==='test'){
   const webhookId=String(b.webhook_id||'');const eventType=String(b.event_type||'application.updated');if(!webhookId)return json(res,400,{error:'webhook_id_required'});if(!WEBHOOK_EVENTS.includes(eventType))return json(res,400,{error:'unsupported_event_type',allowed_events:WEBHOOK_EVENTS});
   const {data:h}=await supabaseAdmin.from('api_webhooks').select('id,url,status,events,secret_ciphertext').eq('id',webhookId).eq('application_id',appId).maybeSingle();if(!h)return json(res,404,{error:'webhook_not_found'});if(h.status!=='active')return json(res,409,{error:'webhook_inactive'});if(!h.events?.includes(eventType))return json(res,400,{error:'event_not_subscribed'});
   const eventId=`evt_test_${crypto.randomUUID().replaceAll('-','')}`;const result=await send(h,eventId,eventType,{test:true,source:'developer_console',application_id:appId});return json(res,202,{accepted:true,test:true,event_id:eventId,data:result});
  }
  const url=String(b.url||'').trim(),events=Array.isArray(b.events)?[...new Set(b.events.map(String).filter(Boolean))].slice(0,50):[];if(!/^https:\/\//i.test(url)||url.length>2000)return json(res,400,{error:'invalid_webhook_url'});if(!events.length)return json(res,400,{error:'events_required'});const unsupported=events.filter(e=>!WEBHOOK_EVENTS.includes(e));if(unsupported.length)return json(res,400,{error:'unsupported_event_type',events:unsupported,allowed_events:WEBHOOK_EVENTS});const secret=newSecret('whsec_');let encrypted;try{encrypted=encryptWebhookSecret(secret.value)}catch{return json(res,503,{error:'webhook_secret_storage_not_configured'});}const {data,error}=await supabaseAdmin.from('api_webhooks').insert({application_id:appId,url,events,secret_hash:hashKey(secret.value),secret_ciphertext:encrypted}).select('id,url,events,status,created_at,updated_at').single();if(error)return json(res,500,{error:'database_error'});return json(res,201,{data,signing_secret:secret.value,warning:'Store this signing secret securely. It will not be shown again.'});
 }
 if(req.method==='DELETE'){const id=String(req.query?.id||'');if(!id)return json(res,400,{error:'webhook_id_required'});const {error}=await supabaseAdmin.from('api_webhooks').delete().eq('id',id).eq('application_id',appId);if(error)return json(res,500,{error:'database_error'});return json(res,200,{data:{id,deleted:true}});}
 return json(res,405,{error:'method_not_allowed'});
}
