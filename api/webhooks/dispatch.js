import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const supabase=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const sign=(secret,timestamp,body)=>`t=${timestamp},v1=${crypto.createHmac('sha256',secret).update(`${timestamp}.${body}`).digest('hex')}`;
const json=(res,status,body)=>res.status(status).json(body);

export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'method_not_allowed'});
 if(String(req.headers['x-internal-webhook-key']||'')!==String(process.env.MERVEIL_INTERNAL_WEBHOOK_KEY||''))return json(res,401,{error:'unauthorized'});
 const {event_id,event_type,payload}=req.body||{}; if(!event_id||!event_type)return json(res,400,{error:'event_required'});
 const {data:hooks,error}=await supabase.from('api_webhooks').select('*').eq('status','active').contains('events',[event_type]);
 if(error)return json(res,500,{error:'database_error'});
 const results=[];
 for(const hook of hooks||[]){
  const body=JSON.stringify({id:event_id,type:event_type,data:payload||{},created_at:new Date().toISOString()});
  const timestamp=Math.floor(Date.now()/1000); const signature=sign(process.env.MERVEIL_WEBHOOK_SECRET||'',timestamp,body);
  const {data:delivery}=await supabase.from('api_webhook_deliveries').insert({webhook_id:hook.id,event_id,event_type,payload:payload||{},attempt:1,status:'pending',signature}).select('id').single();
  try{
   const r=await fetch(hook.url,{method:'POST',headers:{'content-type':'application/json','user-agent':'Merveil-Webhooks/1.0','Merveil-Event-Id':event_id,'Merveil-Signature':signature,'Merveil-Timestamp':String(timestamp)},body,signal:AbortSignal.timeout(10000)});
   const text=(await r.text()).slice(0,4000); const ok=r.status>=200&&r.status<300;
   await supabase.from('api_webhook_deliveries').update({status:ok?'delivered':'retrying',response_status:r.status,response_body:text,delivered_at:ok?new Date().toISOString():null,finished_at:new Date().toISOString(),next_attempt_at:ok?null:new Date(Date.now()+60000).toISOString()}).eq('id',delivery.id);
   await supabase.from('api_webhooks').update({last_delivery_at:new Date().toISOString(),...(ok?{failure_count:0,last_success_at:new Date().toISOString()}:{failure_count:(hook.failure_count||0)+1,last_failure_at:new Date().toISOString()})}).eq('id',hook.id);
   results.push({webhook_id:hook.id,delivered:ok,status:r.status});
  }catch(e){
   await supabase.from('api_webhook_deliveries').update({status:'retrying',response_body:String(e.message||e).slice(0,4000),error_message:String(e.message||e).slice(0,1000),finished_at:new Date().toISOString(),next_attempt_at:new Date(Date.now()+60000).toISOString()}).eq('id',delivery.id);
   await supabase.from('api_webhooks').update({last_delivery_at:new Date().toISOString(),failure_count:(hook.failure_count||0)+1,last_failure_at:new Date().toISOString()}).eq('id',hook.id);
   results.push({webhook_id:hook.id,delivered:false,error:'delivery_failed'});
  }
 }
 return json(res,202,{accepted:true,event_id,deliveries:results});
}
