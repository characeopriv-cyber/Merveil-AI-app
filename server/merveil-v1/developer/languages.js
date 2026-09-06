import { json, requestId } from '../_lib.js';
import { languageCatalog, languagesForSector } from './language-registry.js';

export default async function handler(req,res){
  requestId(req,res);
  if(req.method==='OPTIONS') return json(res,204,{});
  if(req.method!=='GET') return json(res,405,{error:'method_not_allowed'});
  const language=String(req.query?.language||'').trim();
  const sector=String(req.query?.sector||'').trim().toLowerCase();
  if(language){
    const result=languageCatalog(language);
    if(!result) return json(res,404,{error:'language_not_found'});
    if(sector && !result.sectors.includes(sector)) return json(res,200,{language:result,compatible:false,sector});
    return json(res,200,{language:result,compatible:true,sector:sector||null});
  }
  const languages=sector?languagesForSector(sector):languageCatalog();
  return json(res,200,{languages,count:languages.length,sector:sector||null});
}
