import { json } from './_lib.js';
import { intelligenceCatalog } from './intelligence-router.js';

const core = [
  ['GET','/health',null,'Platform','Service health and API version.'],
  ['POST','/ai','ai:use','Merveil Intelligence','One AI interface for intelligence, trading, games, apps, media and domain reasoning.'],
  ['GET','/profile','profile:read','Identity','Privacy-safe Merveil profile.'],
  ['GET','/passport','passport:read','Trust','Authorized Passport summary.'],
  ['GET','/verification','verification:read','Trust','Privacy-safe verification status.'],
  ['GET','/connect','connect:read','Connection','Authorized connection data.'],
  ['POST','/connect','connect:write','Connection','Create a connection request.'],
  ['GET','/messages','connect:read','Connection','Participant-authorized conversations and messages.'],
  ['GET','/call','call:read','Voice','Read AI Call session data.'],
  ['POST','/call','call:write','Voice','Create an AI Call operation.'],
  ['GET','/world','world:read','World','World content.'],
  ['POST','/world','world:write','World','Create World content.'],
  ['GET','/properties','properties:read','Real Estate','Authorized property listings and intelligence.'],
  ['POST','/properties','properties:write','Real Estate','Create property listings.'],
  ['GET','/companies','companies:read','Business','Authorized company data.'],
  ['POST','/companies','companies:write','Business','Create company data.'],
  ['GET','/investors','investors:read','Capital','Investor intelligence.']
].map(([method,path,scope,category,description])=>({method,path,scope,category,description}));

const developer = [
  ['GET','/webhooks','webhooks:manage','Developer','Manage application webhooks.'],
  ['POST','/webhooks','webhooks:manage','Developer','Register a webhook endpoint.'],
  ['DELETE','/webhooks','webhooks:manage','Developer','Remove a webhook endpoint.'],
  ['GET','/oauth','oauth:manage','Developer','Manage OAuth clients and delegated integrations.'],
  ['GET','/usage',null,'Developer','Read developer usage analytics.'],
  ['GET','/apps',null,'Developer','Manage developer applications.']
].map(([method,path,scope,category,description])=>({method,path,scope,category,description}));

export default async function handler(req,res){
  if(req.method==='OPTIONS') return json(res,204,null);
  if(req.method!=='GET') return json(res,405,{error:'method_not_allowed'});
  return json(res,200,{data:{version:'v1',base_path:'/api/v1',authentication:['X-API-Key','Bearer OAuth access token'],intelligence:intelligenceCatalog(),capabilities:['intelligence','voice','connection','trust','world','real_estate','business','capital','trading'],endpoints:[...core,...developer],internal_services:['credits','billing','organization'],note:'Merveil exposes a small set of core capabilities; trading is available through Merveil Intelligence rather than a separate fragmented API.',headers:{request_id:'X-Request-Id',rate_limit:'X-RateLimit-*',quota:'X-Quota-*'},environments:{sandbox:'mv_test_*',production:'mv_live_*'}}});
}
