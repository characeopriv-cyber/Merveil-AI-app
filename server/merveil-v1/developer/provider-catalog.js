import { json, requestId } from '../_lib.js';
import { providerCatalog } from './provider-registry.js';

export default async function handler(req,res){
  requestId(req,res);
  if(req.method==='OPTIONS') return json(res,204,{});
  if(req.method!=='GET') return json(res,405,{error:'method_not_allowed'});
  const category=String(req.query?.category||'').trim();
  const result=providerCatalog(category);
  if(category && !result) return json(res,404,{error:'sector_not_found'});
  return json(res,200,{sectors:category?[result]:result,count:category?1:result.length});
}
