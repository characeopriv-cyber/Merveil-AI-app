import projects from './projects.js';

export default async function handler(req,res){
  if(!req.query?.action && req.query?.route){
    req.query.action=req.query.route;
  }
  return projects(req,res);
}
