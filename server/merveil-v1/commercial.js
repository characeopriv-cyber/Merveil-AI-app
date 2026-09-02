import crypto from 'node:crypto';
import { json, requireUser, supabaseAdmin } from './_lib.js';

function body(req){return typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});}
async function ensureOrg(userId){const {data,error}=await supabaseAdmin.rpc('api_ensure_personal_organization',{p_user_id:userId});if(error)throw error;return data;}
async function member(userId,organizationId){const {data,error}=await supabaseAdmin.from('api_organization_members').select('organization_id,role').eq('organization_id',organizationId).eq('user_id',userId).maybeSingle();if(error)throw error;return data;}
async function currentSubscription(organizationId){const {data,error}=await supabaseAdmin.from('api_subscriptions').select('id,status,environment,current_period_start,current_period_end,cancel_at_period_end,provider,provider_subscription_id,plan:api_plans(id,code,name,description,monthly_price,currency,requests_per_month,requests_per_minute,included_ai_units,included_call_minutes,included_verifications,features)').eq('organization_id',organizationId).in('status',['active','trialing']).order('created_at',{ascending:false}).limit(1).maybeSingle();if(error)throw error;return data;}
async function usage(organizationId){const start=new Date();start.setUTCDate(1);start.setUTCHours(0,0,0,0);const {data,error}=await supabaseAdmin.from('api_usage_meter').select('metric,quantity,unit').eq('organization_id',organizationId).gte('period_start',start.toISOString());if(error)throw error;const out={};for(const row of data||[]){out[row.metric]=(out[row.metric]||0)+Number(row.quantity||0);}return out;}

export default async function handler(req,res){
  if(req.method==='OPTIONS')return json(res,204,null);
  const auth=await requireUser(req);if(auth.error)return json(res,401,{error:'unauthorized',message:auth.error});
  try{
    const requestedOrg=String(req.query?.organization_id||'').trim();
    if(req.method==='GET'){
      const orgId=requestedOrg||await ensureOrg(auth.user.id);const m=await member(auth.user.id,orgId);if(!m)return json(res,403,{error:'organization_access_denied'});
      const [{data:org,error:oe},{data:members,error:me},sub,meters,{data:plans,error:pe}]=await Promise.all([
        supabaseAdmin.from('api_organizations').select('id,name,slug,status,created_at,updated_at').eq('id',orgId).maybeSingle(),
        supabaseAdmin.from('api_organization_members').select('user_id,role,created_at').eq('organization_id',orgId).order('created_at'),
        currentSubscription(orgId),usage(orgId),
        supabaseAdmin.from('api_plans').select('id,code,name,description,monthly_price,currency,requests_per_month,requests_per_minute,included_ai_units,included_call_minutes,included_verifications,features').eq('active',true).order('monthly_price')
      ]);
      if(oe||me||pe||!org)return json(res,404,{error:'organization_not_found'});
      const {data:apps,error:ae}=await supabaseAdmin.from('api_applications').select('id,name,environment,status,organization_id').eq('user_id',auth.user.id).eq('organization_id',orgId).order('created_at',{ascending:false});if(ae)return json(res,500,{error:'database_error'});
      return json(res,200,{data:{organization:org,role:m.role,members:members||[],subscription:sub,plans:plans||[],usage:meters,applications:apps||[]}});
    }
    if(req.method==='POST'){
      const b=body(req);const action=String(b.action||'').trim();const orgId=String(b.organization_id||requestedOrg||'').trim()||await ensureOrg(auth.user.id);const m=await member(auth.user.id,orgId);if(!m||!['owner','admin'].includes(m.role))return json(res,403,{error:'organization_admin_required'});
      if(action==='create'){
        const name=String(b.name||'').trim();if(!name||name.length>100)return json(res,400,{error:'invalid_name'});
        const slug=(String(b.slug||name).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,50)||'organization')+'-'+Math.random().toString(36).slice(2,8);
        const {data:org,error}=await supabaseAdmin.from('api_organizations').insert({owner_user_id:auth.user.id,name,slug}).select('id,name,slug,status,created_at').single();if(error)return json(res,409,{error:'organization_creation_failed'});
        await supabaseAdmin.from('api_organization_members').insert({organization_id:org.id,user_id:auth.user.id,role:'owner'});
        const {data:plan}=await supabaseAdmin.from('api_plans').select('id').eq('code','sandbox').eq('active',true).maybeSingle();if(plan)await supabaseAdmin.from('api_subscriptions').insert({organization_id:org.id,plan_id:plan.id,status:'active',environment:'sandbox'});
        return json(res,201,{data:org});
      }
      if(action==='upgrade'){
        const code=String(b.plan_code||'').trim().toLowerCase();if(!code)return json(res,400,{error:'plan_code_required'});
        const {data:plan,error:pe}=await supabaseAdmin.from('api_plans').select('id,code,name,monthly_price,currency').eq('code',code).eq('active',true).maybeSingle();if(pe||!plan)return json(res,404,{error:'plan_not_found'});
        const sub=await currentSubscription(orgId);if(sub?.plan?.code===plan.code)return json(res,409,{error:'plan_already_active'});
        if(Number(plan.monthly_price)<=0){return json(res,400,{error:'plan_requires_no_checkout',message:'This plan does not require payment.'});}
        const idempotency=crypto.randomUUID();
        const {data:intent,error:ie}=await supabaseAdmin.from('payment_intents_v2').insert({user_id:auth.user.id,amount:Number(plan.monthly_price),currency:plan.currency||'USD',purpose:'subscription',status:'requires_payment',risk_status:'pending',idempotency_key:idempotency,metadata:{organization_id:orgId,plan_id:plan.id,plan_code:plan.code}}).select('id,amount,currency,purpose,status,checkout_url,created_at').single();
        if(ie)return json(res,500,{error:'payment_intent_creation_failed'});
        await supabaseAdmin.from('api_billing_events').insert({organization_id:orgId,subscription_id:sub?.id||null,event_type:'subscription_upgrade_requested',amount:Number(plan.monthly_price),currency:plan.currency||'USD',status:'pending',idempotency_key:idempotency,metadata:{plan_id:plan.id,plan_code:plan.code,payment_intent_id:intent.id}});
        return json(res,202,{data:{payment_intent:intent,organization_id:orgId,target_plan:plan,next:'provider_checkout',message:'Payment intent created. Subscription activates only after a verified payment webhook.'}});
      }
      return json(res,400,{error:'unsupported_action'});
    }
    if(req.method==='PATCH'){
      const orgId=requestedOrg;if(!orgId)return json(res,400,{error:'organization_id_required'});const m=await member(auth.user.id,orgId);if(!m||!['owner','admin'].includes(m.role))return json(res,403,{error:'organization_admin_required'});
      const b=body(req);const patch={updated_at:new Date().toISOString()};if(b.name!==undefined){const n=String(b.name).trim();if(!n||n.length>100)return json(res,400,{error:'invalid_name'});patch.name=n;}
      const {data,error}=await supabaseAdmin.from('api_organizations').update(patch).eq('id',orgId).select('id,name,slug,status,updated_at').single();if(error)return json(res,500,{error:'database_error'});return json(res,200,{data});
    }
    return json(res,405,{error:'method_not_allowed'});
  }catch(error){console.error('[merveil-commercial]',error);return json(res,500,{error:'database_error'});}
}
