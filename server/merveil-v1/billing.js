import { json, requireUser, supabaseAdmin } from './_lib.js';

function body(req){return typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});}
async function ensureOrg(userId){const {data,error}=await supabaseAdmin.rpc('api_ensure_personal_organization',{p_user_id:userId});if(error)throw error;return data;}
async function member(userId,organizationId){const {data,error}=await supabaseAdmin.from('api_organization_members').select('organization_id,role').eq('organization_id',organizationId).eq('user_id',userId).maybeSingle();if(error)throw error;return data;}

export default async function handler(req,res){
  if(req.method==='OPTIONS')return json(res,204,null);
  const auth=await requireUser(req); if(auth.error)return json(res,401,{error:'unauthorized',message:auth.error});
  try{
    const requestedOrg=String(req.query?.organization_id||'').trim();
    const orgId=requestedOrg||await ensureOrg(auth.user.id);
    const m=await member(auth.user.id,orgId);
    if(!m)return json(res,403,{error:'organization_access_denied'});

    if(req.method==='GET'){
      const [{data:customer,error:ce},{data:invoices,error:ie},{data:events,error:ee}]=await Promise.all([
        supabaseAdmin.from('api_customers').select('id,billing_email,billing_name,billing_country,provider,provider_customer_id,tax_id,metadata,created_at,updated_at').eq('organization_id',orgId).maybeSingle(),
        supabaseAdmin.from('api_invoices').select('id,invoice_number,status,currency,subtotal,tax,total,amount_paid,amount_due,period_start,period_end,due_at,paid_at,provider,provider_invoice_id,created_at,updated_at').eq('organization_id',orgId).order('created_at',{ascending:false}).limit(50),
        supabaseAdmin.from('api_billing_events').select('id,event_type,amount,currency,status,provider_event_id,idempotency_key,metadata,created_at').eq('organization_id',orgId).order('created_at',{ascending:false}).limit(100)
      ]);
      if(ce||ie||ee)return json(res,500,{error:'billing_data_unavailable'});
      return json(res,200,{data:{organization_id:orgId,customer,invoices:invoices||[],billing_events:events||[],payment_provider:'stripe',billing_status:customer?.provider_customer_id?'connected':'pending'} });
    }

    if(req.method==='POST'){
      const b=body(req); const action=String(b.action||'').trim();
      if(action==='onboard'){
        const companyName=String(b.company_name||'').trim(); const email=String(b.email||auth.user.email||'').trim().toLowerCase();
        if(!companyName||!email)return json(res,400,{error:'company_name_and_email_required'});
        const {data:lead,error}=await supabaseAdmin.from('api_onboarding_leads').insert({organization_id:orgId,company_name:companyName,contact_name:String(b.contact_name||'').trim()||null,email,country:String(b.country||'').trim()||null,use_case:String(b.use_case||'').trim()||null,expected_monthly_requests:b.expected_monthly_requests==null?null:Number(b.expected_monthly_requests),requested_plan_code:String(b.plan_code||'').trim().toLowerCase()||null,status:'new',source:String(b.source||'developer_console').trim()||'developer_console',notes:String(b.notes||'').trim()||null}).select('id,company_name,contact_name,email,country,use_case,expected_monthly_requests,requested_plan_code,status,source,created_at').single();
        if(error)return json(res,409,{error:'onboarding_submission_failed'});
        return json(res,201,{data:lead,next:'sales_review'});
      }
      if(action==='save_customer'){
        if(!['owner','admin'].includes(m.role))return json(res,403,{error:'organization_admin_required'});
        const payload={organization_id:orgId,billing_email:String(b.billing_email||'').trim().toLowerCase()||null,billing_name:String(b.billing_name||'').trim()||null,billing_country:String(b.billing_country||'').trim()||null,tax_id:String(b.tax_id||'').trim()||null,metadata:b.metadata&&typeof b.metadata==='object'?b.metadata:{},updated_at:new Date().toISOString()};
        const {data:customer,error}=await supabaseAdmin.from('api_customers').upsert(payload,{onConflict:'organization_id'}).select('id,organization_id,billing_email,billing_name,billing_country,provider,provider_customer_id,tax_id,metadata,created_at,updated_at').single();
        if(error)return json(res,409,{error:'customer_update_failed'}); return json(res,200,{data:customer});
      }
      return json(res,400,{error:'unsupported_action'});
    }
    return json(res,405,{error:'method_not_allowed'});
  }catch(error){console.error('[merveil-billing]',error);return json(res,500,{error:'internal_server_error'});}
}
