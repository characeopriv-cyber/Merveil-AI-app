import health from '../server/merveil-v1/health.js';
import catalog from '../server/merveil-v1/catalog.js';
import profile from '../server/merveil-v1/profile.js';
import passport from '../server/merveil-v1/passport.js';
import connect from '../server/merveil-v1/connect.js';
import messages from '../server/merveil-v1/messages.js';
import ai from '../server/merveil-v1/ai.js';
import call from '../server/merveil-v1/call.js';
import companies from '../server/merveil-v1/companies.js';
import properties from '../server/merveil-v1/properties.js';
import world from '../server/merveil-v1/world.js';
import investors from '../server/merveil-v1/investors.js';
import credits from '../server/merveil-v1/credits.js';
import verification from '../server/merveil-v1/verification.js';
import oauth from '../server/merveil-v1/oauth.js';
import webhooks from '../server/merveil-v1/webhooks.js';
import apps from '../server/merveil-v1/apps.js';
import usage from '../server/merveil-v1/usage.js';
import commercial from '../server/merveil-v1/commercial.js';
import billing from '../server/merveil-v1/billing.js';
import developerConfig from '../server/merveil-v1/developer/config.js';
import developerApi from '../server/api-router-v2.js';
import interfaceCitizenAction from '../server/interface-citizen-action.js';
import boost from '../server/merveil-boost-v1.js';
import boostPackage from '../server/merveil-boost-package-v1.js';
import boostAdmin from '../server/merveil-boost-admin-v1.js';
import boostCampaign from '../server/merveil-boost-campaign-v1.js';
import controlPlane from '../server/merveil-control-plane-v1.js';
import controlRisk from '../server/merveil-control-risk-v1.js';
import { json, requestId } from '../server/merveil-v1/_lib.js';
const routes=new Map([
 ['health',health],['catalog',catalog],['profile',profile],['passport',passport],['connect',connect],['messages',messages],['ai',ai],['call',call],['companies',companies],['properties',properties],['world',world],['investors',investors],['credits',credits],['verification',verification],['oauth',oauth],['webhooks',webhooks],['apps',apps],['usage',usage],['organization',commercial],['organizations',commercial],['billing',billing],['developer/config',developerConfig]
]);
const developerPrefixes=new Set(['build-check','debug','developer-project','developer-project-files','developer-debug-project','developer-builds','developer-build-history','developer-project-context','developer-sandbox-build','developer-git','developer-health','developer-interface']);
function routeFromRequest(req){const raw=req.query?.route;if(Array.isArray(raw))return raw.join('/');if(raw)return String(raw).replace(/^\/+|\/+$/g,'');const pathname=String(req.url||'').split('?')[0],marker='/api/v1/';const i=pathname.indexOf(marker);return i>=0?pathname.slice(i+marker.length).replace(/\/+$/g,''):''}
export default async function handler(req,res){requestId(req,res);const route=routeFromRequest(req);try{if(route==='boost')return await boost(req,res);if(route==='boost/package')return await boostPackage(req,res);if(route==='boost/admin')return await boostAdmin(req,res);if(route==='boost/campaign')return await boostCampaign(req,res);if(route==='control')return await controlPlane(req,res);if(route==='control/risk')return await controlRisk(req,res);if(route==='interface-action')return await interfaceCitizenAction(req,res);if(route==='developer-interface'){const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});const action=String(body.action||req.query?.action||'').toLowerCase();if(['connect','call','message','collaborate','invest'].includes(action))return await interfaceCitizenAction(req,res)}if(developerPrefixes.has(route)){const nextUrl=`/api/${route}${String(req.url||'').includes('?')?'?'+String(req.url).split('?')[1]:''}`;return await developerApi({...req,url:nextUrl},res)}const target=routes.get(route);if(!target)return json(res,404,{error:'not_found',message:'Unknown Merveil API v1 endpoint',request_id:req._merveilRequestId});return await target(req,res)}catch(error){console.error('[merveil-api-v1]',route,error);return json(res,500,{error:'internal_server_error',request_id:req._merveilRequestId})}}