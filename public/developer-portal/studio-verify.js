/**
 * Merveil Studio — real preview verification + ship gate.
 * This layer deliberately does not claim a package build when no build runner exists.
 * It verifies the actual project source and executes index.html in an isolated preview.
 */
import { API_BASE } from './config.js';

const PROJECTS_KEY = 'merveil_dev_projects_v5';
const ACTIVE_KEY = 'merveil_dev_active_v5';
const VERIFY_KEY = 'merveil_studio_verify_v1';
const SHIP_KEY = 'merveil_studio_ship_v1';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function project(){
  try{
    const projects=JSON.parse(localStorage.getItem(PROJECTS_KEY)||'[]');
    const id=localStorage.getItem(ACTIVE_KEY);
    return projects.find(p=>p.id===id)||null;
  }catch{return null;}
}

function localRefs(html){
  const refs=[];
  const re=/(?:src|href)=["']([^"']+)["']/gi;
  let m;
  while((m=re.exec(html))){
    const v=m[1];
    if(!/^(?:https?:|data:|blob:|#|mailto:|javascript:)/i.test(v)) refs.push(v.replace(/^\.\//,''));
  }
  return [...new Set(refs)];
}

function sourceChecks(p){
  const errors=[],warnings=[];
  const files=p?.files||{};
  const html=files['index.html']||'';
  if(!html.trim()) errors.push({stage:'source',message:'index.html is missing or empty.'});
  if(!/<html[\s>]/i.test(html)) errors.push({stage:'source',message:'index.html has no <html> root.'});
  if(!/<body[\s>]/i.test(html)) errors.push({stage:'source',message:'index.html has no <body>.'});
  if(!/<\/html>/i.test(html)) errors.push({stage:'source',message:'index.html is missing </html>.'});
  for(const ref of localRefs(html)){
    const clean=ref.split(/[?#]/)[0].replace(/^\//,'');
    if(!clean) continue;
    if(!files[clean]){
      const alt=Object.keys(files).find(k=>k===clean||k.endsWith('/'+clean));
      if(!alt) errors.push({stage:'assets',message:`Missing local asset: ${ref}`});
    }
  }
  const scripts=[...html.matchAll(/<script(?:[^>]*?)>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(Boolean);
  for(let i=0;i<scripts.length;i++){
    try{new Function(scripts[i]);}
    catch(e){
      if(/import|export/.test(scripts[i])) warnings.push({stage:'syntax',message:`Inline script ${i+1} uses module syntax; browser runtime check will decide.`});
      else errors.push({stage:'syntax',message:`Inline script ${i+1}: ${e.message}`});
    }
  }
  return {errors,warnings};
}

function runPreview(html){
  return new Promise(resolve=>{
    const iframe=document.createElement('iframe');
    iframe.setAttribute('title','Merveil verification preview');
    iframe.setAttribute('sandbox','allow-scripts allow-forms allow-modals');
    iframe.style.cssText='position:fixed;left:-10000px;top:-10000px;width:1280px;height:800px;opacity:0;pointer-events:none;border:0;';
    const errors=[];
    let settled=false;
    const finish=()=>{
      if(settled)return; settled=true;
      clearTimeout(timer); iframe.remove(); resolve(errors);
    };
    const timer=setTimeout(finish,1800);
    iframe.addEventListener('load',()=>{
      try{
        iframe.contentWindow.addEventListener('error',e=>errors.push({stage:'runtime',message:e.message||'Runtime error'}));
        iframe.contentWindow.addEventListener('unhandledrejection',e=>errors.push({stage:'runtime',message:String(e.reason?.message||e.reason||'Unhandled promise rejection')}));
      }catch(e){errors.push({stage:'runtime',message:e.message});}
      setTimeout(finish,900);
    },{once:true});
    iframe.srcdoc=html;
    document.body.appendChild(iframe);
  });
}

async function verify(){
  const p=project();
  if(!p)return {status:'failed',stage:'source',errors:[{stage:'source',message:'No active project.'}],warnings:[]};
  const base=sourceChecks(p);
  if(base.errors.length) return {status:'failed',stage:base.errors[0].stage,errors:base.errors,warnings:base.warnings};
  const runtime=await runPreview(p.files['index.html']);
  const result={
    status:runtime.length?'failed':'passed',
    stage:runtime.length?'runtime':'preview',
    errors:runtime,
    warnings:base.warnings,
    checkedAt:new Date().toISOString(),
    projectId:p.id,
    projectName:p.name,
    stages:{source:'passed',preview:runtime.length?'failed':'passed',build:'not_run'}
  };
  localStorage.setItem(VERIFY_KEY,JSON.stringify(result));
  return result;
}

function panel(){
  let el=document.getElementById('merveil-verify-panel');
  if(el)return el;
  el=document.createElement('div'); el.id='merveil-verify-panel';
  el.style.cssText='position:fixed;inset:auto 18px 18px auto;width:min(430px,calc(100vw - 36px));z-index:99999;background:rgba(248,246,241,.98);border:1px solid rgba(50,90,100,.16);border-radius:24px;box-shadow:0 22px 70px rgba(30,45,55,.18);padding:18px;font:14px/1.5 Inter,system-ui,sans-serif;color:#26373b;backdrop-filter:blur(18px);';
  document.body.appendChild(el); return el;
}

function show(result){
  const el=panel();
  const ok=result.status==='passed';
  const errs=(result.errors||[]).map(e=>`<li>${esc(e.message)}</li>`).join('');
  el.innerHTML=`<div style="display:flex;align-items:center;gap:10px"><strong style="font-size:16px">Merveil verification</strong><span style="margin-left:auto;border-radius:999px;padding:5px 9px;background:${ok?'#e5f6ed':'#fff0ed'};color:${ok?'#18734b':'#b64a35'}">${ok?'Ready':'Needs attention'}</span></div><div style="margin-top:12px">Source ✓ &nbsp; Preview ${ok?'✓':'×'} &nbsp; Build <span style="opacity:.55">not run</span></div>${errs?`<ul style="margin:10px 0 0 18px">${errs}</ul>`:'<p style="margin:10px 0 0">The real project preview loaded without captured runtime errors.</p>'}<div style="display:flex;gap:8px;margin-top:14px"><button id="mv-close" style="flex:1;border:1px solid #ccd9d8;border-radius:12px;padding:10px;background:white">Close</button>${ok?'<button id="mv-ship" style="flex:1;border:0;border-radius:12px;padding:10px;background:#274f58;color:white">Continue to Ship</button>':'<button id="mv-fix" style="flex:1;border:0;border-radius:12px;padding:10px;background:#d97762;color:white">Debug & Fix</button>'}</div>`;
  el.querySelector('#mv-close').onclick=()=>el.remove();
  el.querySelector('#mv-fix')?.addEventListener('click',()=>{el.remove();document.querySelector('[data-agent-act="debug"]')?.click();});
  el.querySelector('#mv-ship')?.addEventListener('click',()=>showShip());
}

function showShip(){
  const el=panel();
  let tokens={};try{tokens=JSON.parse(localStorage.getItem('merveil_dev_tokens_v5')||'{}');}catch{}
  const github=!!tokens.github, vercel=!!tokens.vercel;
  el.innerHTML=`<strong style="font-size:16px">Ready to Ship</strong><p style="margin:8px 0">Verification passed. Choose a real destination.</p><div style="display:grid;gap:8px"><button id="mv-gh" ${github?'':'disabled'} style="border:1px solid #ccd9d8;border-radius:12px;padding:11px;background:white;opacity:${github?1:.5}">Push to GitHub${github?'':' — add token in Studio settings'}</button><button id="mv-vc" ${vercel?'':'disabled'} style="border:1px solid #ccd9d8;border-radius:12px;padding:11px;background:white;opacity:${vercel?1:.5}">Deploy to Vercel${vercel?'':' — add token in Studio settings'}</button><button id="mv-back" style="border:0;border-radius:12px;padding:10px;background:#eef3f2">Back</button></div><div id="mv-ship-status" style="margin-top:10px;font-size:13px"></div>`;
  el.querySelector('#mv-back').onclick=()=>show(JSON.parse(localStorage.getItem(VERIFY_KEY)||'{}'));
  el.querySelector('#mv-gh')?.addEventListener('click',()=>ship('github_create_and_push',tokens.github));
  el.querySelector('#mv-vc')?.addEventListener('click',()=>ship('vercel_deploy',tokens.vercel));
}

async function ship(action,token){
  const p=project(); if(!p)return;
  const status=document.getElementById('mv-ship-status'); if(status)status.textContent='Shipping…';
  try{
    const name=p.name.toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'merveil-app';
    const body=action==='github_create_and_push'
      ? {action,token,name,description:p.desc||'Built with Merveil Developer',private:true,files:p.files}
      : {action,token,name:name.slice(0,40),files:p.files,target:'production'};
    const r=await fetch(`${API_BASE}/api/dev/ship`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const data=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(data.message||data.error||`HTTP ${r.status}`);
    localStorage.setItem(SHIP_KEY,JSON.stringify({action,projectId:p.id,status:'success',at:new Date().toISOString(),url:data.url||data.html_url||data.id||null}));
    if(status)status.innerHTML=`<span style="color:#18734b">Success.</span> ${esc(data.url||data.html_url||data.id||'Completed')}`;
  }catch(e){if(status)status.innerHTML=`<span style="color:#b64a35">Ship failed:</span> ${esc(e.message)}`;}
}

let busy=false;
async function intercept(e){
  const btn=e.target.closest('[data-act="ship"]');
  if(!btn||busy)return;
  e.stopImmediatePropagation(); e.preventDefault();
  busy=true; btn.disabled=true; btn.textContent='Verifying…';
  try{const result=await verify();show(result);}finally{busy=false;}
}

document.addEventListener('click',intercept,true);
window.addEventListener('merveil:verify',async()=>show(await verify()));
