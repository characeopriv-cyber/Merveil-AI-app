import { oauthStart, oauthCallback } from '../server/github-provider.js';
import { sendJson } from '../lib/supabaseServer.js';
export default async function handler(req,res){try{if(req.method!=='GET')return sendJson(res,405,{error:'Method not allowed'});const action=String(req.query?.action||'start');const out=action==='callback'?await oauthCallback(req,res):await oauthStart(req,res);if(out.status===302)return res.status(302).end();return sendJson(res,out.status,out.body)}catch(e){return sendJson(res,500,{error:e?.message||'GitHub OAuth failed'})}}
