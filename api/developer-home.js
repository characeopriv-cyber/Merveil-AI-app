import { createClient } from '@supabase/supabase-js';
import { getSession, sendJson } from '../lib/supabaseServer.js';

export const config = { api: { bodyParser: false }, maxDuration: 10 };
const SUPABASE_URL = 'https://dixfybqlepticyudikuz.supabase.co';

const CATALOG = [
  ['GitHub','code','github'],['GitLab','code','gitlab'],['Bitbucket','code','bitbucket'],['Azure DevOps','code','azure-devops'],
  ['Vercel','deploy','vercel'],['Cloudflare','deploy','cloudflare'],['Netlify','deploy','netlify'],['AWS','cloud','aws'],['Google Cloud','cloud','gcp'],['Microsoft Azure','cloud','azure'],['DigitalOcean','cloud','digitalocean'],['Railway','deploy','railway'],['Render','deploy','render'],['Fly.io','deploy','fly'],
  ['Supabase','data','supabase'],['Firebase','data','firebase'],['PostgreSQL','data','postgresql'],['MySQL','data','mysql'],['MongoDB','data','mongodb'],['Redis','data','redis'],['PlanetScale','data','planetscale'],['Neon','data','neon'],['Upstash','data','upstash'],['Convex','data','convex'],
  ['OpenAI','ai','openai'],['Anthropic','ai','anthropic'],['Google Gemini','ai','gemini'],['Mistral','ai','mistral'],['Groq','ai','groq'],['Cohere','ai','cohere'],['xAI','ai','xai'],['Together AI','ai','together'],['Perplexity','ai','perplexity'],['Replicate','ai','replicate'],['Hugging Face','ai','huggingface'],
  ['Stripe','payments','stripe'],['PayPal','payments','paypal'],['Paystack','payments','paystack'],['Flutterwave','payments','flutterwave'],['Razorpay','payments','razorpay'],['Adyen','payments','adyen'],['Mercado Pago','payments','mercadopago'],['Wise','payments','wise'],
  ['Resend','communication','resend'],['Twilio','communication','twilio'],['SendGrid','communication','sendgrid'],['Postmark','communication','postmark'],['Slack','communication','slack'],['Discord','communication','discord'],['Telegram','communication','telegram'],['WhatsApp Business','communication','whatsapp'],['Microsoft Teams','communication','teams'],
  ['Notion','productivity','notion'],['Linear','productivity','linear'],['Jira','productivity','jira'],['Trello','productivity','trello'],['Asana','productivity','asana'],['Google Drive','storage','gdrive'],['Dropbox','storage','dropbox'],['Box','storage','box'],
  ['Sentry','observability','sentry'],['Datadog','observability','datadog'],['PostHog','observability','posthog'],['Plausible','observability','plausible'],['Algolia','search','algolia'],['Mapbox','maps','mapbox'],['Google Maps','maps','google-maps']
].map(([name,category,key]) => ({name,category,key}));

function adminClient(){
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SERVICE_ROLE;
  if(!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  return createClient(SUPABASE_URL,key,{auth:{autoRefreshToken:false,persistSession:false}});
}

async function user(req,res){
  const s=await getSession(req,res).catch(()=>({user:null,jwtSub:null}));
  return s?.user?.id||s?.jwtSub||null;
}

export default async function handler(req,res){
  const uid=await user(req,res);
  if(!uid) return sendJson(res,401,{error:'Sign in required',code:'AUTH_REQUIRED'});
  try{
    const db=adminClient();
    const [{data:profile},{data:passport},{data:wallet},{data:projects},{data:connections}]=await Promise.all([
      db.from('profiles').select('id,name,email,avatar_url,role_label,profession,city,company_name,passport_tier,merveil_credits').eq('id',uid).maybeSingle(),
      db.from('passports').select('citizen_id,display_name,tier,verified,metadata').eq('user_id',uid).maybeSingle(),
      db.from('wallets').select('balance_usd_cents,currency_local,updated_at').eq('user_id',uid).maybeSingle(),
      db.from('developer_projects').select('id,name,slug,tagline,stage,status_label,momentum,created_at,updated_at').eq('owner_user_id',uid).order('updated_at',{ascending:false}).limit(20),
      db.from('developer_provider_connections').select('provider,external_account_name,status,updated_at').eq('owner_user_id',uid).order('updated_at',{ascending:false})
    ]);
    const connected=new Map((connections||[]).map(x=>[x.provider,{name:x.external_account_name,status:x.status,updated_at:x.updated_at}]));
    const integrations=CATALOG.map(x=>({...x,connected:connected.has(x.key),connection:connected.get(x.key)||null,platformReady:['github','vercel','supabase','openai','anthropic','stripe','resend','twilio','cloudflare'].includes(x.key)}));
    return sendJson(res,200,{ok:true,profile:profile||null,passport:passport||null,wallet:wallet||{balance_usd_cents:0,currency_local:'USD'},projects:projects||[],integrations,count:integrations.length});
  }catch(e){return sendJson(res,500,{error:e?.message||'Developer home failed'});}
}

export { CATALOG };
