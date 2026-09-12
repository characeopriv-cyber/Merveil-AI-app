import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { getSession } from '../lib/supabaseServer.js';
import { oauthStart, pullRepo, pushRepo, listRepos, listBranches, status as githubStatus } from './github-provider.js';
const URL='https://dixfybqlepticyudikuz.supabase.co';
const db=()=>createClient(URL,process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SERVICE_ROLE||'',{auth:{autoRefreshToken:false,persistSession:false}});
const bodyOf=req=>typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
const snapshotOf=files=>createHash('sha256').update((files||[]).map(f=>`${String(f?.path||'')}\0${String(f?.content??'')}`).sort().join('\n'),'utf8').digest('hex');
async function saveBinding(client,projectId,repo,branch,sha){const{data:p,error}=await client.from('developer_projects').select('metadata').eq('id',projectId).maybeSingle();if(error)throw error;const metadata=p?.metadata&&typeof p.metadata==='object'?p.metadata:{};const{error:updateError}=await client.from('developer_projects').update({metadata:{...metadata,github_repo:repo,github_branch:branch,github_sha:sha}}).eq('id',projectId);if(updateError)throw updateError;}
async function requireSuccessfulBuild(client,uid,projectId,buildId,currentSnapshot){if(!buildId)return{ok:false,error:'A successful Sandbox Build is required before GitHub Push.',code:'BUILD_REQUIRED'};const{data}=await client.from('developer_builds').select('id,status,finished_at,logs').eq('id',String(buildId)).eq('project_id',projectId).eq('owner_user_id',uid).maybeSingle();if(!data||data.status!=='success')return{ok:false,error:'The supplied build did not pass.',code:'BUILD_NOT_VERIFIED'};const match=String(data.logs||'').match(/MERVEIL_BUILD_SNAPSHOT:([a-f0-9]{64})\s*$/i);if(!match)return{ok:false,error:'Build snapshot is missing. Run a fresh Sandbox Build.',code:'BUILD_SNAPSHOT_MISSING'};if(match[1].toLowerCase()!==currentSnapshot.toLowerCase())return{ok:false,error:'Project files changed after this build. Run a fresh Sandbox Build before GitHub Push.',code:'BUILD_STALE'};return{ok:true,build:data}}
export default async function developerGit(req,res){
 if(!['GET','POST'].includes(req.method))return{status:405,body:{error:'Method not allowed'}};
 if(req.method==='GET'&&String(req.query?.action||'')==='oauth-callback')return{status:500,body:{error:'Use /api/github-oauth for the OAuth callback'}};
 const s=await getSession(req,res).catch(()=>({user:null,jwtSub:null}));const uid=s?.user?.id||s?.jwtSub;if(!uid)return{status:401,body:{error:'Sign in required'}};
 let body;try{body=bodyOf(req)}catch{return{status:400,body:{error:'Invalid JSON',code:'INVALID_JSON'}}}
 const projectId=String(req.query?.projectId||body.projectId||'');if(!projectId)return{status:400,body:{error:'projectId is required'}};
 const client=db();const{data:project}=await client.from('developer_projects').select('id,name,owner_user_id,metadata').eq('id',projectId).eq('owner_user_id',uid).maybeSingle();if(!project)return{status:404,body:{error:'Project not found'}};
 if(req.method==='GET'){
  const action=String(req.query?.action||'status');
  if(action==='connect')return oauthStart(req,res);
  if(action==='repos')return{status:200,body:{ok:true,repositories:await listRepos(uid,projectId)}};
  if(action==='branches'){const repo=String(req.query?.repo||project.metadata?.github_repo||'');if(!repo)return{status:400,body:{error:'repo is required'}};return{status:200,body:{ok:true,branches:await listBranches(uid,projectId,repo)}};}
  return{status:200,body:{ok:true,project,git:{...(await githubStatus(uid,projectId)),branch:project.metadata?.github_branch||null}}};
 }
 const action=String(body.action||'');try{
  if(action==='connect')return oauthStart(req,res);
  if(action==='pull'){
   const fullName=String(body.fullName||project.metadata?.github_repo||''),branch=String(body.branch||project.metadata?.github_branch||'');
   if(!fullName)return{status:400,body:{error:'Select a GitHub repository first'}};
   const r=await pullRepo(uid,projectId,fullName,branch);
   const rows=r.files.map(f=>({project_id:projectId,owner_user_id:uid,path:f.path,content:f.content}));
   if(rows.length){const{error}=await client.from('developer_project_files').upsert(rows,{onConflict:'project_id,path'});if(error)throw error;}
   await saveBinding(client,projectId,r.repo,r.branch,r.sha);
   return{status:200,body:{ok:true,action,repo:r.repo,branch:r.branch,sha:r.sha,files:r.files.length}};
  }
  if(action==='commit'||action==='push'){
   const fullName=String(body.fullName||project.metadata?.github_repo||''),branch=String(body.branch||project.metadata?.github_branch||'');
   if(!fullName)return{status:400,body:{error:'Select a GitHub repository first'}};
   const{data:files,error}=await client.from('developer_project_files').select('path,content').eq('project_id',projectId).eq('owner_user_id',uid).order('path').limit(300);if(error)throw error;
   const currentSnapshot=snapshotOf(files||[]);const build=await requireSuccessfulBuild(client,uid,projectId,body.buildId,currentSnapshot);if(!build.ok)return{status:422,body:build};
   const r=await pushRepo(uid,projectId,fullName,branch,files||[],body.message||`Update ${project.name} from Merveil Developer Platform`);await saveBinding(client,projectId,r.repo,r.branch,r.commit);
   return{status:200,body:{ok:true,action,repo:r.repo,branch:r.branch,commit:r.commit,url:r.url,buildId:build.build.id,snapshot:currentSnapshot}};
  }
  return{status:400,body:{error:'Unsupported Git action',supported:['connect','repos','branches','pull','commit','push']}};
 }catch(e){const code=e?.code||null;const status=code==='GITHUB_PROVIDER_REQUIRED'?409:code==='GITHUB_PROJECT_BOUND'||code==='GITHUB_BRANCH_BOUND'?409:e?.status===401?401:e?.status===403?502:e?.status===404?404:500;return{status,body:{ok:false,code,message:e?.message||'GitHub operation failed'}}}
}
