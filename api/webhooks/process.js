import dispatcher from './dispatch.js';
export default async function handler(req,res){if(req.method!=='POST')return res.status(405).json({error:'method_not_allowed'});return dispatcher(req,res);}
