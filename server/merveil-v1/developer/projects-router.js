import projects from './projects.js';
import buildEngine from './build-engine.js';

export default async function handler(req,res){
  if(!req.query?.action && req.query?.route) req.query.action=req.query.route;
  const action=String(req.query?.action||'projects');
  if(action==='build'||action==='test') return buildEngine(req,res);
  return projects(req,res);
}
