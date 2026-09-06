import { json, requestId } from '../_lib.js';
import { databaseCatalog } from './database-registry.js';
export default async function handler(req,res){requestId(req,res);if(req.method==='OPTIONS')return json(res,204,{});if(req.method!=='GET')return json(res,405,{error:'method_not_allowed'});const id=String(req.query?.provider||'').trim();const data=databaseCatalog(id);if(id&&!data)return json(res,404,{error:'database_provider_not_found'});return json(res,200,{providers:id?[data]:data,count:id?1:data.length});}
