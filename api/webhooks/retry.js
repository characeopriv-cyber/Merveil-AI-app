import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { decryptWebhookSecret } from '../../server/merveil-v1/webhook-secret.js';
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const sign=(secret,timestamp,body)=>`t=${timestamp},v1=${crypto.createHmac('sha256',secret).update(`${timestamp}.${body}`).digest('hex')}`;
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'method_not_allowed'});
 if(String(req.headers['x-internal-webhook-key']||'')!==String(process.env.MERVEIL_INTERNAL_WEBHOOK_KEY||''))return res.status(401).json({error:'unauthorized'});
 const {data:rows}=await db.from('api_webhook_deliveries').select('id,webhook_id,event_id,event_type,payload,attempt').in('status',['pending','retrying']).lte('next_attempt_at',new Date().toISOString()).limit(100);
 let processed=0;
 for(const d of rows||[]){
  const {data:h}=await db.from('api_webhooks').select('url,status,secret_ciphertext,failure_count').eq('id',d.webhook_id).maybeSingle();
  if(!h||h.status!=='active')continue;
  let secret;try{secret=decryptWebhookSecret(h.secret_ciphertext)}catch(e){await db.from('api_webhook_deliveries').update({status:'failed',error_message:'Webhook secret unavailable',finished_at:new Date().toISOString(),next_attempt_at:null}).eq('id',d.id);processed++;continue;}
  const body=JSON.stringify({id:d.event_id,type:d.event_type,data:d.payload||{}}),ts=Math.floor(Date.now()/1000),signature=sign(secret,ts,body),attempt=(d.attempt||1)+1,now=new Date().toISOString();
  try{const r=await fetch(h.url,{method:'POST',headers:{'content-type':'application/json','user-agent':'Merveil-Webhooks/1.0','Merveil-Event-Id':d.event_id,'Merveil-Signature':signature,'Merveil-Timestamp':String(ts)},body,signal:AbortSignal.timeout(10000)});const text=(await r.text()).slice(0,4000),ok=r.status>=200&&r.status<300,failed=attempt>=8;await db.from('api_webhook_deliveries').update({attempt,status:ok?'delivered':failed?'failed':'retrying',response_status:r.status,response_body:text,delivered_at:ok?now:null,finished_at:now,error_message:ok?null:`HTTP ${r.status}`,next_attempt_at:ok||failed?null:new Date(Date.now()+Math.min(86400000,60000*2**(attempt-2))).toISOString()}).eq('id',d.id);await db.from('api_webhooks').update({last_delivery_at:now,...(ok?{failure_count:0,last_success_at:now}:{failure_count:(h.failure_count||0)+1,last_failure_at:now})}).eq('id',d.webhook_id);processed++;}
  catch(e){const failed=attempt>=8;await db.from('api_webhook_deliveries').update({attempt,status:failed?'failed':'retrying',error_message:String(e.message||e).slice(0,1000),finished_at:now,next_attempt_at:failed?null:new Date(Date.now()+Math.min(86400000,60000*2**(attempt-2))).toISOString()}).eq('id',d.id);processed++;}
 }
 return res.status(200).json({processed});
}
