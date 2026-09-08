import { json, requestId } from '../_lib.js';
import { databaseCatalog, recommendedDatabase } from './database-registry.js';
export default async function handler(req,res){
 requestId(req,res); if(req.method==='OPTIONS') return json(res,204,{});
 if(req.method!=='GET') return json(res,405,{error:'method_not_allowed'});
 const id=String(req.query?.provider||'').trim();
 if(id){const p=databaseCatalog(id); if(!p)return json(res,404,{error:'database_provider_not_found'}); return json(res,200,{provider:p});}
 const realtime=String(req.query?.realtime||'false')==='true'; const edge=String(req.query?.edge||'false')==='true';
 return json(res,200,{providers:databaseCatalog(),recommended:recommendedDatabase({needsRealtime:realtime,edge}),count:databaseCatalog().length});
}
