import { supabaseAdmin, json, requestId, requireUser } from '../_lib.js';

const body=req=>{try{return typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});}catch{return{};}};
const MAX_AUDIO_BYTES=8*1024*1024;
const allowedMime=new Set(['audio/webm','audio/wav','audio/x-wav','audio/mpeg','audio/mp3','audio/mp4','audio/m4a','audio/ogg']);

function extFor(mime){
  if(mime.includes('webm'))return 'webm';
  if(mime.includes('wav'))return 'wav';
  if(mime.includes('mpeg')||mime.includes('mp3'))return 'mp3';
  if(mime.includes('mp4')||mime.includes('m4a'))return 'm4a';
  if(mime.includes('ogg'))return 'ogg';
  return 'webm';
}

async function openai(path,options){
  const key=process.env.OPENAI_API_KEY;
  if(!key)throw new Error('OPENAI_API_KEY_not_configured');
  const r=await fetch('https://api.openai.com/v1/'+path,{...options,headers:{Authorization:'Bearer '+key,...(options.headers||{})}});
  const text=await r.text();
  let data;try{data=JSON.parse(text);}catch{data={error:{message:text}};}
  if(!r.ok)throw new Error(data?.error?.message||'openai_request_failed');
  return data;
}

export default async function handler(req,res){
  requestId(req,res);
  if(req.method==='OPTIONS')return json(res,204,{});
  if(req.method!=='POST')return json(res,405,{error:'method_not_allowed'});
  const auth=await requireUser(req);if(!auth.user)return json(res,401,{error:'authentication_required'});
  const projectId=String(req.query?.project_id||'').trim();if(!projectId)return json(res,400,{error:'project_id_required'});
  try{
    const {data:project,error:projectError}=await supabaseAdmin.from('developer_projects').select('id,name,owner_user_id,meta,twin').eq('id',projectId).eq('owner_user_id',auth.user.id).maybeSingle();
    if(projectError)throw projectError;if(!project)return json(res,404,{error:'project_not_found'});
    const b=body(req);const audioBase64=String(b.audio_base64||'').replace(/^data:[^;]+;base64,/,'');
    if(!audioBase64)return json(res,400,{error:'audio_required'});
    const audio=Buffer.from(audioBase64,'base64');
    if(!audio.length||audio.length>MAX_AUDIO_BYTES)return json(res,400,{error:'audio_size_invalid',max_bytes:MAX_AUDIO_BYTES});
    const mime=String(b.mime_type||'audio/webm').toLowerCase().split(';')[0];
    if(!allowedMime.has(mime))return json(res,400,{error:'unsupported_audio_type'});
    const form=new FormData();
    form.append('file',new Blob([audio],{type:mime}),'merveil-voice.'+extFor(mime));
    form.append('model','gpt-4o-transcribe');
    form.append('response_format','json');
    if(b.language)form.append('language',String(b.language).slice(0,12));
    form.append('prompt','Developer voice command. Preserve technical names, product names, programming languages, frameworks, APIs and local-language meaning.');
    const transcript=await openai('audio/transcriptions',{method:'POST',body:form});
    const text=String(transcript.text||'').trim();if(!text)return json(res,422,{error:'empty_transcription'});

    const schema={type:'object',additionalProperties:false,properties:{detected_language:{type:'string'},summary:{type:'string'},intent:{type:'string'},sector:{type:'string'},experience_level:{type:'string',enum:['beginner','intermediate','expert']},suggested_language:{type:'string'},suggested_framework:{type:'string'},suggested_providers:{type:'array',items:{type:'string'}},requirements:{type:'array',items:{type:'string'}},next_action:{type:'string'}},required:['detected_language','summary','intent','sector','experience_level','suggested_language','suggested_framework','suggested_providers','requirements','next_action']};
    const instruction=`You are Merveil Developer Intelligence. Understand the developer's meaning even when they speak a local language, mix languages, use informal speech, or pronounce technical terms imperfectly. Do not invent requirements. Turn the request into a safe, concise technical plan. Do not execute anything. Project: ${project.name}. Existing project metadata: ${JSON.stringify(project.meta||{})}. Transcript: ${text}`;
    const ai=await openai('responses',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-5.6-luna',input:instruction,text:{format:{type:'json_schema',name:'merveil_voice_plan',strict:true,schema}}})});
    let plan={};
    try{plan=JSON.parse(ai.output_text||'{}');}catch{throw new Error('voice_plan_invalid');}
    return json(res,200,{project_id:project.id,transcript:text,plan,execution_requires_approval:true,raw_audio_stored:false});
  }catch(error){
    console.error('[developer-voice]',error);
    const message=String(error?.message||'voice_interpretation_failed');
    if(message==='OPENAI_API_KEY_not_configured')return json(res,503,{error:'voice_provider_not_configured'});
    return json(res,502,{error:'voice_interpretation_failed',message});
  }
}
