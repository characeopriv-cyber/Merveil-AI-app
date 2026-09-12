import { createClient } from '@supabase/supabase-js';
import { getSession, sendJson } from '../lib/supabaseServer.js';
import { diagnose, propose } from '../server/debug-v1.js';

export const config = { api: { bodyParser: false }, maxDuration: 60 };
const SUPABASE_URL = 'https://dixfybqlepticyudikuz.supabase.co';
const CITIZEN_ORIGIN = 'https://www.junction.technology';
const MAX_PROMPT = 6000;
const MAX_FILES = 300;
const MAX_FILE_BYTES = 750000;
const MAX_TOTAL_BYTES = 8000000;
const BLOCKED = /(^|\/)(\.env(?:\..*)?|node_modules|dist|build|\.git|coverage)(\/|$)|\.(pem|key|p12|pfx)$/i;

function adminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
  if (!key) throw new Error('Server misconfiguration: missing SUPABASE_SERVICE_ROLE_KEY');
  return createClient(SUPABASE_URL, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = []; for await (const chunk of req) chunks.push(chunk);
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return {}; }
}
async function requireAccess(req, res) {
  let s = { user: null, jwtSub: null }; try { s = await getSession(req, res); } catch {}
  const citizenId = s?.user?.id || s?.jwtSub || null;
  if (!citizenId) { sendJson(res, 401, { error: 'Sign in required', code: 'AUTH_REQUIRED', redirect: `${CITIZEN_ORIGIN}/?next=/developer` }); return null; }
  try {
    const svc = adminClient(); const { data: profile } = await svc.from('profiles').select('*').eq('id', citizenId).maybeSingle();
    const pct = profile ? [20, profile.avatar_url ? 15 : 0, profile.bio?.length > 10 ? 15 : 0, profile.city ? 10 : 0, profile.profession ? 10 : 0, profile.skills?.length ? 10 : 0, profile.languages?.length ? 10 : 0, (profile.portfolio_url || profile.website_url) ? 10 : 0].reduce((a,b)=>a+b,0) : 20;
    if (pct < 20) { sendJson(res, 403, { error: 'Complete your Merveil Passport to build in Developer.', code: 'PASSPORT_INCOMPLETE', completionPct: pct, required: 20, redirect: `${CITIZEN_ORIGIN}/?goto=passport&next=/developer` }); return null; }
    return { citizenId };
  } catch (e) { sendJson(res, 500, { error: e.message }); return null; }
}
function safeGenerated(files) {
  if (!Array.isArray(files) || !files.length || files.length > MAX_FILES) return { files: [], error: 'GENERATION_FILE_LIMIT' };
  const seen = new Set(); let total = 0; const out = [];
  for (const f of files) {
    const path = String(f?.path || '').replace(/\\/g,'/').replace(/^\/+/, '').trim(); const content = String(f?.content ?? '');
    if (!path || path.length > 500 || path.split('/').includes('..') || BLOCKED.test(path) || seen.has(path)) return { files: [], error: 'GENERATION_FILE_POLICY' };
    if (content.length > MAX_FILE_BYTES) return { files: [], error: 'GENERATION_FILE_TOO_LARGE' };
    total += Buffer.byteLength(content, 'utf8'); if (total > MAX_TOTAL_BYTES) return { files: [], error: 'GENERATION_PROJECT_TOO_LARGE' };
    seen.add(path); out.push({ path, content });
  }
  if (!out.some(x => x.path === 'package.json')) return { files: [], error: 'GENERATION_NO_MANIFEST' };
  return { files: out };
}
function emit(res, files, meta = {}) {
  res.writeHead(meta.error ? 502 : 200, { 'Content-Type':'text/plain; charset=utf-8', 'Cache-Control':'no-cache, no-transform', 'X-Merveil-Generator':meta.generator || 'offline', 'X-Merveil-Debug':meta.debug ? 'project-aware' : 'not-run', ...(meta.debug ? {'X-Merveil-Debug-Score':String(meta.debug.score),'X-Merveil-Debug-Status':encodeURIComponent(meta.debug.status),'X-Merveil-Debug-Errors':String(meta.debug.counts.error),'X-Merveil-Debug-Warns':String(meta.debug.counts.warn)} : {}), ...(meta.error ? {'X-Merveil-Generation-Error':meta.error} : {}) });
  if (meta.error) { res.end(`<MF:ERROR>\ncode: ${meta.error}\n<MF:END>`); return; }
  for (const f of files) res.write(`<MF:BEGIN>\npath: ${f.path}\n<MF:BYTES>\n${f.content}\n<MF:END>\n`); res.end();
}
function offlineProject(prompt) {
  const clean = String(prompt || 'Build a modern web application').replace(/[`<>]/g,'').trim().slice(0,180);
  const title = clean.replace(/^build\s+/i,'').replace(/\bwebsite\b/i,'').trim().replace(/\s+/g,' ').slice(0,55) || 'Merveil Project';
  const app = `import { useState } from 'react';\nexport default function App(){const [menu,setMenu]=useState(false);return <div className="app"><header className="nav"><b>MERVEIL</b><button onClick={()=>setMenu(!menu)}>Menu</button></header><main><section className="hero"><small>BUILT WITH MERVEIL</small><h1>${title}</h1><p>A polished responsive experience generated directly from your idea.</p><div><button>Get started</button><button>Explore</button></div></section><section className="grid"><article><b>01</b><h2>Clear by design</h2><p>Strong hierarchy and responsive layouts.</p></article><article><b>02</b><h2>Ready to extend</h2><p>Clean React structure for future development.</p></article><article><b>03</b><h2>Deployable</h2><p>Vite project with production build scripts.</p></article></section></main>{menu&&<aside><button onClick={()=>setMenu(false)}>Close</button><p>Home</p><p>Projects</p><p>Contact</p></aside>}</div>}`;
  const css = `:root{font-family:Inter,system-ui,sans-serif;color:#201d19;background:#eee9df}*{box-sizing:border-box}body{margin:0}.app{min-height:100vh}.nav{height:72px;padding:0 7vw;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #0001}.nav button,button{padding:10px 18px;border-radius:999px;border:1px solid #201d1930;background:transparent}.hero{padding:12vh 7vw;max-width:1050px}.hero h1{font-size:clamp(48px,8vw,100px);line-height:.95;margin:18px 0}.hero p{font-size:20px;line-height:1.6;max-width:680px;color:#5b554d}.hero button:first-child{background:#2f6f68;color:white}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:0 7vw 8vh}.grid article{background:#fff8;border:1px solid #0001;border-radius:24px;padding:28px;min-height:180px}aside{position:fixed;right:20px;top:80px;background:white;padding:24px;border-radius:20px}@media(max-width:700px){.grid{grid-template-columns:1fr}}`;
  return [{path:'package.json',content:'{"name":"merveil-generated-app","private":true,"version":"1.0.0","type":"module","scripts":{"dev":"vite --host 0.0.0.0","build":"vite build","preview":"vite preview --host 0.0.0.0"},"dependencies":{"@vitejs/plugin-react":"latest","vite":"latest","react":"latest","react-dom":"latest"},"devDependencies":{}}'},{path:'vite.config.ts',content:'import { defineConfig } from "vite"; import react from "@vitejs/plugin-react"; export default defineConfig({plugins:[react()]});'},{path:'index.html',content:'<div id="root"></div><script type="module" src="/src/main.tsx"></script>'},{path:'src/main.tsx',content:'import React from "react";import{createRoot}from"react-dom/client";import App from"./App";import"./styles.css";createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);'},{path:'src/App.tsx',content:app},{path:'src/styles.css',content:css},{path:'README.md',content:`# ${title}\n\nGenerated by Merveil Engine.`}];
}
function parseMF(text) { const out=[]; const re=/<MF:BEGIN>\s*path:\s*([^\n]+)\n<MF:BYTES>\n([\s\S]*?)\n<MF:END>/g; let m; while((m=re.exec(text||''))) out.push({path:m[1].trim(),content:m[2]}); return safeGenerated(out); }
async function fetchWithTimeout(url, options, ms=30000) { const c=new AbortController(); const timer=setTimeout(()=>c.abort(),ms); try{return await fetch(url,{...options,signal:c.signal});}finally{clearTimeout(timer);} }
async function aiProject(prompt, preferred='auto') {
  const providers = preferred === 'openai' ? ['openai'] : preferred === 'anthropic' ? ['anthropic'] : ['openai','anthropic'];
  const available = providers.filter(p=>p==='openai'?process.env.OPENAI_API_KEY:process.env.ANTHROPIC_API_KEY); if (!available.length) return { files:null, provider:'offline', error:null };
  const system='You are Merveil Engine. Emit ONLY files using <MF:BEGIN>\\npath: relative/path\\n<MF:BYTES>\\nfile content\\n<MF:END>. Emit a complete runnable Vite + React TypeScript project with package.json, vite.config.ts, index.html, src/main.tsx, src/App.tsx and src/styles.css. No prose. Never include secrets.';
  let last='PROVIDER_FAILED';
  for(const provider of available){try{let r,text='';if(provider==='openai'){r=await fetchWithTimeout('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify({model:process.env.MERVEIL_BUILD_MODEL||'gpt-5-mini',messages:[{role:'system',content:system},{role:'user',content:prompt}],max_tokens:12000})});if(r.ok){const j=await r.json();text=j?.choices?.[0]?.message?.content||'';}else last=`OPENAI_HTTP_${r.status}`;}else{r=await fetchWithTimeout('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:12000,system,messages:[{role:'user',content:prompt}]})});if(r.ok){const j=await r.json();text=(j?.content||[]).map(x=>x.text||'').join('');}else last=`ANTHROPIC_HTTP_${r.status}`;}if(text.includes('<MF:BEGIN>')){const parsed=parseMF(text);if(parsed.files.length)return{files:parsed.files,provider,error:null};last=parsed.error||'GENERATION_FILE_POLICY';}}catch(e){last=e?.name==='AbortError'?'PROVIDER_TIMEOUT':'PROVIDER_REQUEST_FAILED';}}
  return {files:null,provider:null,error:last};
}
export default async function handler(req,res){
  if(req.method!=='POST')return sendJson(res,405,{error:'Method not allowed'});
  const gate=await requireAccess(req,res);if(!gate)return;
  const body=await readJson(req);const prompt=String(body.prompt||'').slice(0,MAX_PROMPT);if(!prompt)return sendJson(res,400,{error:'Prompt required.',code:'PROMPT_REQUIRED'});
  const projectFiles=Array.isArray(body.files)?body.files:[];const debug=projectFiles.length?diagnose(projectFiles):null;const proposal=debug?propose(debug):null;
  const context=debug?`\n\nMerveil Debug V1 preflight (read-only): score=${debug.score}; status=${debug.status}; errors=${debug.counts.error}; warnings=${debug.counts.warn}.\n${(proposal?.proposals||[]).slice(0,20).map(p=>`- ${p.code}: ${p.action}${p.file?` [${p.file}]`:''}`).join('\n')}`:'';
  const result=await aiProject(prompt+context,body.provider||'auto');
  if(result.files)return emit(res,result.files,{generator:result.provider,debug});
  if(result.error && result.provider===null && process.env.OPENAI_API_KEY||process.env.ANTHROPIC_API_KEY){return emit(res,[],{error:result.error,debug});}
  return emit(res,offlineProject(prompt),{generator:'offline',debug});
}
