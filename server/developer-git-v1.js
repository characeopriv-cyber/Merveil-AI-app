import { createClient } from '@supabase/supabase-js';
import { getSession } from '../lib/supabaseServer.js';
import { oauthStart, pullRepo, pushRepo, listRepos, listBranches, status as githubStatus } from './github-provider.js';
const URL='https://dixfybqlepticyudikuz.supabase.co';
const db=()=>createClient(URL,process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SERVICE_ROLE||'',{auth:{autoRefreshToken:false,persistSession:false}});
const bodyOf=req=>typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
export default async function developerGit(req,res){
 if(!['GET','POST'].includes(req.method))return{status:405,body:{error:'Method not allowed'}};
 if(req.method==='GET'&&String(req.query?.action||'')==='oauth-callback')return{status:500,body:{error:'Use /api/github-oauth for the OAuth callback'}};
 const s=await getSession(req,res).catch(()=>({user:null,jwtSub:null}));const uid=s?.user?.id||s?.jwtSub;if(!uid)return{status:401,body:{error:'Sign in required'}};
 const body=bodyOf(req),projectId=String(req.query?.projectId||body.projectId||'');if(!projectId)return{status:400,body:{error:'projectId is required'}};
 const client=db();const{data:project}=await client.from('developer_projects').select('id,name,owner_user_id').eq('id',projectId).eq('owner_user_id',uid).maybeSingle();if(!project)return{status:404,body:{error:'Project not found'}};
 if(req.method==='GET'){
  const action=String(req.query?.action||'status');
  if(action==='connect')return oauthStart(req,res);
  if(action==='repos')return{status:200,body:{ok:true,repositories:await listRepos(uid,projectId)}};
  if(action==='branches'){const repo=String(req.query?.repo||'');return{status:200,body:{ok:true,branches:await listBranches(uid,projectId,repo)}};
  }
  return{status:200,body:{ok:true,project,git:{...(await githubStatus(uid,projectId)),branch:String(req.query?.branch||'main')}}};
 }
 const action=String(body.action||'');try{
  if(action==='connect')return oauthStart(req,res);
  if(action==='pull'){const r=await pullRepo(uid,projectId,String(body.fullName||''),String(body.branch||'main'));const rows=r.files.map(f=>({project_id:projectId,owner_user_id:uid,path:f.path,content:f.content}));if(rows.length)await client.from('developer_project_files').upsert(rows,{onConflict:'project_id,path'});await client.from('developer_projects').update({metadata:{github_repo:r.repo,github_branch:r.branch,github_sha:r.sha}}).eq('id',projectId);return{status:200,body:{ok:true,action,repo:r.repo,branch:r.branch,sha:r.sha,files:r.files.length}}}
  if(action==='commit'||action==='push'){const fullName=String(body.fullName||''),branch=String(body.branch||'main');const{data:files,error}=await client.from('developer_project_files').select('path,content').eq('project_id',projectId).eq('owner_user_id',uid).limit(300);if(error)throw error;const r=await pushRepo(uid,projectId,fullName,branch,files||[],body.message||`Update ${project.name} from Merveil Developer Platform`);await client.from('developer_projects').update({metadata:{github_repo:r.repo,github_branch:r.branch,github_sha:r.commit}}).eq('id',projectId);return{status:200,body:{ok:true,action,repo:r.repo,branch:r.branch,commit:r.commit,url:r.url}}}
  return{status:400,body:{error:'Unsupported Git action',supported:['connect','repos','branches','pull','commit','push']}};
 }catch(e){const code=e?.code||null;return{status:code==='GITHUB_PROVIDER_REQUIRED'?409:e?.status===404?404:500,body:{ok:false,code,message:e?.message||'GitHub operation failed'}}}
}
