import { json, requestId } from '../_lib.js';
import { experienceCatalog } from './experience-registry.js';

export default async function handler(req,res){
  requestId(req,res);
  if(req.method==='OPTIONS') return json(res,204,{});
  if(req.method!=='GET') return json(res,405,{error:'method_not_allowed'});
  const level=String(req.query?.level||'').trim();
  if(level){
    const result=experienceCatalog(level);
    if(!result) return json(res,404,{error:'experience_level_not_found'});
    return json(res,200,result);
  }
  return json(res,200,{levels:experienceCatalog(),count:3});
}
