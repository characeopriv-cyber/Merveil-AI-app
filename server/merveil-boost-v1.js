import { createClient } from '@supabase/supabase-js';
import { getSession } from '../lib/supabaseServer.js';

const SUPABASE_URL = 'https://dixfybqlepticyudikuz.supabase.co';
const db = () => createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || '', { auth: { autoRefreshToken:false, persistSession:false } });
const bodyOf = req => typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
const uidOf = async (req,res) => { const s = await getSession(req,res).catch(()=>({user:null,jwtSub:null})); return s?.user?.id || s?.jwtSub || null; };
const AGENTS = [
  { key:'website', label:'Website Agent', description:'Customer conversations on the developer website.' },
  { key:'call', label:'Call Agent', description:'Voice conversations through Merveil AI.' },
  { key:'email', label:'Email Agent', description:'Email replies and follow-up.' },
  { key:'text', label:'Text Agent', description:'SMS/text customer conversations.' },
  { key:'social', label:'Social Agent', description:'Social content and growth operations.' }
];
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
function valueEstimate(body){
  const completeness = ['what_built','primary_market','category','stage','business_model','target_customer'].filter(k=>String(body[k]||'').trim()).length;
  if(completeness < 4) return { status:'insufficient_evidence', label:'ESTIMATE', message:'Insufficient evidence — test before scaling.', range:null, confidence:'low' };
  const stage = String(body.stage||'idea').toLowerCase();
  const base = stage.includes('launched') ? 25000 : stage.includes('mvp') ? 10000 : stage.includes('prototype') ? 3000 : 1000;
  const evidence = clamp(Math.round((completeness/6)*100),0,100);
  return { status:'estimate', label:'ESTIMATE', range:{low:base,high:base*4,currency:'USD'}, confidence:evidence>=80?'medium':'low', methodology:'Illustrative model estimate from supplied project facts; not a certified financial valuation.' };
}
function marketFit(body){
  const primary=String(body.primary_market||'').trim();
  if(!primary) return { status:'insufficient_evidence', message:'Add a primary local market before scoring market fit.' };
  return { primary_market:{market:primary,status:'HYPOTHESIS',score:null,reason:'Market score requires evidence on relevance, purchasing power, language/culture, competition, digital adoption, distribution, regulation and price compatibility.'}, expansion_markets:(Array.isArray(body.expansion_markets)?body.expansion_markets:[]).map(m=>({market:String(m),status:'HYPOTHESIS',score:null})) };
}
function buildPlan(body){
  const customer=String(body.target_customer||'the target customer').trim();
  const market=String(body.primary_market||'the primary market').trim();
  return { evidence_policy:'No invented market size, engagement, revenue or customer claims.', audience:{level_1:`Core ${customer} in ${market}`,level_2:'Adjacent customers with the same problem',level_3:'Expansion audience only after evidence from the core market'}, moves:[`Validate the strongest problem with the core audience in ${market}.`,`Test one positioning message against a measurable conversion event.`,`Measure qualified leads, customers and acquisition cost before adding channels or expansion markets.`], loop:'TEST → MEASURE → LEARN → REALLOCATE' };
}
async function ensureProject(svc,uid,projectId,body){
  const {data:project,error:pe}=await svc.from('developer_projects').select('id,name,owner_user_id,stage,status_label,meta').eq('id',projectId).eq('owner_user_id',uid).maybeSingle();
  if(pe) throw pe; if(!project) return null;
  const payload={owner_user_id:uid,project_id:project.id,primary_market:String(body.primary_market||'').trim()||null,expansion_markets:Array.isArray(body.expansion_markets)?body.expansion_markets:[],category:String(body.category||'').trim()||null,stage:String(body.stage||project.stage||'').trim()||null,business_model:String(body.business_model||'').trim()||null,target_customer:String(body.target_customer||'').trim()||null,value_estimate:valueEstimate(body),market_analysis:marketFit(body),audience_analysis:buildPlan(body),growth_plan:buildPlan(body),updated_at:new Date().toISOString()};
  const {data,error}=await svc.from('merveil_boost_projects').upsert(payload,{onConflict:'owner_user_id,project_id'}).select('*').single();
  if(error) throw error; return data;
}
export default async function boost(req,res){
  const uid=await uidOf(req,res); if(!uid) return {status:401,body:{error:'Sign in required',code:'AUTH_REQUIRED'}};
  const svc=db(); let body={}; try{body=bodyOf(req)}catch{return {status:400,body:{error:'Invalid JSON',code:'INVALID_JSON'}}}
  const projectId=String(req.query?.projectId||body.projectId||'').trim();
  if(req.method==='GET'){
    const {data,error}=await svc.from('merveil_boost_projects').select('*').eq('owner_user_id',uid).eq('project_id',projectId).maybeSingle();
    if(error) return {status:500,body:{error:error.message}};
    return {status:200,body:{ok:true,projectId,core:'Merveil AI',agents:AGENTS,boost:data||null,evidence_levels:['VERIFIED','DATA-SUPPORTED','ESTIMATE','HYPOTHESIS','EXPERIMENT']}};
  }
  if(req.method!=='POST') return {status:405,body:{error:'Method not allowed'}};
  if(!projectId) return {status:400,body:{error:'projectId is required'}};
  try{
    if(body.action==='activate'){
      const boost=await ensureProject(svc,uid,projectId,body);
      if(!boost) return {status:404,body:{error:'Project not found'}};
      await svc.from('merveil_boost_events').insert({boost_project_id:boost.id,owner_user_id:uid,event_type:'boost_activated',evidence_level:'EXPERIMENT',payload:{source:body.source||'developer'}});
      return {status:200,body:{ok:true,boost,status:'active',core:'Merveil AI',presentation:'Channel-specific agent labels are presentation/configuration only; one shared Merveil AI core.'}};
    }
    if(body.action==='analyze' || body.action==='value'){
      const boost=await ensureProject(svc,uid,projectId,body);
      if(!boost) return {status:404,body:{error:'Project not found'}};
      const result={core:'Merveil AI',value:boost.value_estimate,market:boost.market_analysis,audience:boost.audience_analysis,positioning:{status:'HYPOTHESIS',message:'Positioning requires developer approval before public launch.'},growth:boost.growth_plan,next_action:'Validate the core audience and measure a real conversion event.'};
      await svc.from('merveil_boost_events').insert({boost_project_id:boost.id,owner_user_id:uid,event_type:body.action==='value'?'value_estimate':'analysis',evidence_level:'ESTIMATE',payload:result});
      return {status:200,body:{ok:true,result}};
    }
    if(body.action==='agents'){
      const boost=await ensureProject(svc,uid,projectId,body); if(!boost) return {status:404,body:{error:'Project not found'}};
      const selected=Array.isArray(body.selected_agents)?body.selected_agents:[];
      for(const a of AGENTS){await svc.from('merveil_boost_agent_configs').upsert({boost_project_id:boost.id,owner_user_id:uid,agent_key:a.key,label:a.label,enabled:selected.includes(a.key),configuration:{}},{onConflict:'boost_project_id,agent_key'});}
      return {status:200,body:{ok:true,core:'Merveil AI',agents:AGENTS.map(a=>({...a,enabled:selected.includes(a.key)}))}};
    }
    return {status:400,body:{error:'Unknown Boost action',code:'BOOST_ACTION_INVALID'}};
  }catch(e){return {status:500,body:{error:e?.message||'Boost operation failed',code:'BOOST_OPERATION_FAILED'}}}
}
