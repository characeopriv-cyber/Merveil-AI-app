import { json } from './_lib.js';

const catalog = [
  ['GET','/health',null,'Platform','Service health and API version.'],
  ['GET','/profile','profile:read','Identity','Privacy-safe Merveil profile.'],
  ['GET','/passport','passport:read','Identity','Authorized Passport summary.'],
  ['GET','/verification','verification:read','Identity','Privacy-safe verification status.'],
  ['GET','/connect','connect:read','Connect','Authorized connection data.'],
  ['POST','/connect','connect:write','Connect','Create a connection request.'],
  ['GET','/messages','connect:read','Connect','Participant-authorized conversations and messages.'],
  ['POST','/ai','ai:use','AI','Merveil AI generation.'],
  ['GET','/call','call:read','Call','Read AI Call session data.'],
  ['POST','/call','call:write','Call','Create an AI Call operation.'],
  ['GET','/companies','companies:read','Company','Authorized company data.'],
  ['POST','/companies','companies:write','Company','Create company data.'],
  ['GET','/properties','properties:read','Property','Authorized property listings.'],
  ['POST','/properties','properties:write','Property','Create property listings.'],
  ['GET','/world','world:read','World','World content.'],
  ['POST','/world','world:write','World','Create World content.'],
  ['GET','/investors','investors:read','Investor','Investor intelligence.'],
  ['GET','/credits','credits:read','Credits','Credit balance and authorized credit data.'],
  ['GET','/webhooks','webhooks:manage','Developer','Manage application webhooks.'],
  ['POST','/webhooks','webhooks:manage','Developer','Register a webhook endpoint.'],
  ['DELETE','/webhooks','webhooks:manage','Developer','Remove a webhook endpoint.'],
  ['GET','/oauth','oauth:manage','Developer','Manage OAuth clients and delegated integrations.'],
  ['GET','/usage',null,'Developer','Read developer usage analytics with a Merveil session.'],
  ['GET','/apps',null,'Developer','Manage applications with a Merveil developer session.'],
  ['GET','/billing',null,'Commercial','Billing profile, invoices and billing events for an organization.'],
  ['POST','/billing',null,'Commercial','Client onboarding and billing profile operations.'],
  ['GET','/organization',null,'Commercial','Organization, plans, subscription and usage summary.'],
  ['POST','/organization',null,'Commercial','Create organizations or request a paid plan upgrade.'],
  ['PATCH','/organization',null,'Commercial','Update organization settings.']
].map(([method,path,scope,category,description])=>({method,path,scope,category,description}));

export default async function handler(req,res){
  if(req.method==='OPTIONS') return json(res,204,null);
  if(req.method!=='GET') return json(res,405,{error:'method_not_allowed'});
  return json(res,200,{data:{version:'v1',base_path:'/api/v1',authentication:['X-API-Key','Bearer OAuth access token'],scopes:['profile:read','passport:read','connect:read','connect:write','ai:use','call:read','call:write','companies:read','companies:write','properties:read','properties:write','world:read','world:write','investors:read','credits:read','verification:read','webhooks:manage','oauth:manage'],endpoints:catalog,commercial:{billing_provider:'stripe',subscription_activation:'verified_webhook_only',onboarding:true,invoices:true},headers:{request_id:'X-Request-Id',rate_limit:'X-RateLimit-*',quota:'X-Quota-*'},environments:{sandbox:'mv_test_*',production:'mv_live_*'}}});
}
