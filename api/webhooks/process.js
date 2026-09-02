import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { decryptWebhookSecret } from '../../server/merveil-v1/webhook-secret.js';
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const json=(res,status,body)=>res.status(status).json(body);
const sign=(secret,timestamp,body)=>`t=${timestamp},v1=${crypto.createHmac('sha256',secret).update(`${timestamp}.${body}`).digest('hex')}`;
async function deliver(h,e){
 const secret=decryptWebhookSecret(h.secret_ciphertext);const body=JSON.stringify({id:e.event_id,type:e.event_type,data:e.payload||{},created_at:e.created_at||new Date().toISOString()}),ts=Math.floor(Date.now()/1000),signature=sign(secret,ts,body),now=new Date().toISOString();
 const {data:d,error}=await db.from('api_webhook_deliveries').insert({webhook_id:h.id,event_id:e.event_id,event_type:e.event_type,payload:e.payload||{},attempt:1,status:'pending',signature}).select('id').single();
 if(error&&error.code==='23505')return{duplicate:true};if(error)throw error;
 try{const r=await fetch(h.url,{method:'POST',headers:{'content-type':'application/json','user-agent':'Merveil-Webhooks/1.0','Merveil-Event-Id':e.event_id,'Merveil-Signature':signature,'Merveil-Timestamp':String(ts)},body,signal:AbortSignal.timeout(10000)});const text=(await r.text()).slice(0,4000),ok=r.status>=200&&r.status<300;await db.from('api_webhook_deliveries').update({status:ok?'delivered':'retrying',response_status:r.status,response_body:text,delivered_at:ok?now:null,finished_at:now,error_message:ok?null:`HTTP ${r.status}`,next_attempt_at:ok?null:new Date(Date.now()+60000).toISOString()}).eq('id',d.id);await db.from('api_webhooks').update({last_delivery_at:now,...(ok?{failure_count:0,last_success_at:now}:{failure_count:(h.failure_count||0)+1,last_failure_at:now})}).eq('id',h.id);return{delivered:ok,status:r.status};}
 catch(x){await db.from('api_webhook_deliveries').update({status:'retrying',error_message:String(x.message||x).slice(0,1000),finished_at:now,next_attempt_at:new Date(Date.now()+60000).toISOString()}).eq('id',d.id);return{delivered:false,error:'delivery_failed'};}
}
export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'method_not_allowed'});if(String(req.headers['x-internal-webhook-key']||'')!==String(process.env.MERVEIL_INTERNAL_WEBHOOK_KEY||''))return json(res,401,{error:'unauthorized'});
 const {data:events,error}=await db.from('api_webhook_event_outbox').select('event_id,event_type,payload,created_at').order('created_at',{ascending:true}).limit(25);if(error)return json(res,500,{error:'database_error'});
 let processed=0,deliveries=0;for(const e of events||[]){const targetAppId=e.payload?.application_id||null;const {data:hooks}=await db.from('api_webhooks').select('id,application_id,url,status,failure_count,secret_ciphertext').eq('status','active').contains('events',[e.event_type]);let allAttempted=true;for(const h of (hooks||[]).filter(x=>!targetAppId||String(x.application_id)===String(targetAppId))){try{const r=await deliver(h,e);if(!r.duplicate)deliveries++;}catch(x){allAttempted=false;console.error('[merveil-webhook-process]',h.id,e.event_id,x);}}
  if(allAttempted){const {error:x}=await db.from('api_webhook_event_outbox').delete().eq('event_id',e.event_id);if(!x)processed++;}
 }
 return json(res,200,{processed,deliveries});
}
