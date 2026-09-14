/**
 * Merveil Developer V5 — Beginner + Pro
 * Real tools: local projects, seeds, ZIP export, GitHub push, Vercel deploy.
 * Tokens stay in the browser (localStorage). Ship API proxies with user token per request.
 */
import { API_BASE } from './config.js';
import { SEED_PROJECTS, blankProject } from './seeds.js';

const LS_KEY = 'merveil_dev_projects_v5';
const LS_ACTIVE = 'merveil_dev_active_v5';
const LS_MODE = 'merveil_dev_mode_v5';
const LS_TOKENS = 'merveil_dev_tokens_v5';
const LS_SEEDED = 'merveil_dev_seeded_v5';

const state = {
  mode: localStorage.getItem(LS_MODE) === 'pro' ? 'pro' : 'beginner', view: 'dash', projects: [], activeId: null,
  openTabs: [], activePath: null, dirty: new Set(), rail: 'files',
  termLines: ['Merveil Developer ready.', 'Beginner + Pro share the same projects.'],
  health: { storage: 'ok', api: 'warn', ship: 'warn', engine: 'warn' }, modal: null, modalName: '', filter: '',
  tokens: { github: '', vercel: '', githubLogin: '', vercelUser: '' }, shipping: false, toast: null,
};
const app = document.getElementById('app');
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function loadTokens(){try{const t=JSON.parse(localStorage.getItem(LS_TOKENS)||'{}');state.tokens={github:'',vercel:'',githubLogin:'',vercelUser:'',...t};}catch{}}
function saveTokens(){localStorage.setItem(LS_TOKENS,JSON.stringify({github:state.tokens.github||'',vercel:state.tokens.vercel||'',githubLogin:state.tokens.githubLogin||'',vercelUser:state.tokens.vercelUser||''}));}
function importGeneratedResult(){
  const raw=localStorage.getItem('merveil_studio_import_v1'); if(!raw)return false;
  try{
    const incoming=JSON.parse(raw); if(!incoming?.files?.['index.html'])return false;
    const id=incoming.id||'generated-'+Date.now().toString(36);
    const project={id,name:incoming.name||'Merveil creation',tag:'Generated',desc:incoming.desc||'Created with Merveil',color:incoming.color||'#72dfe7',files:incoming.files,createdAt:incoming.createdAt||Date.now(),updatedAt:Date.now(),generated:true};
    const existing=state.projects.findIndex(p=>p.id===id);
    if(existing>=0)state.projects[existing]=project;else state.projects.unshift(project);
    state.activeId=id; state.view='workspace'; localStorage.setItem(LS_ACTIVE,id); localStorage.removeItem('merveil_studio_import_v1');
    state.openTabs=['index.html']; state.activePath='index.html';
    log(`Imported generated creation: ${project.name}`,'ok'); return true;
  }catch(e){log(`Studio import failed: ${e.message}`,'err');return false;}
}
function load(){
  loadTokens();
  try{const raw=localStorage.getItem(LS_KEY);if(raw)state.projects=JSON.parse(raw);}catch{state.projects=[];}
  importGeneratedResult();
  if(!localStorage.getItem(LS_SEEDED)&&state.projects.length===0){const now=Date.now();SEED_PROJECTS.forEach((s,i)=>state.projects.push({id:'seed-'+s.id,name:s.name,tag:s.tag,desc:s.desc,color:s.color,files:{...s.files},createdAt:now-(SEED_PROJECTS.length-i)*1000,updatedAt:now-(SEED_PROJECTS.length-i)*1000,fromSeed:s.id}));localStorage.setItem(LS_SEEDED,'1');save();log('Loaded 10 starter projects into your workspace','ok');}
  state.activeId=state.activeId||localStorage.getItem(LS_ACTIVE); if(state.activeId&&!state.projects.find(p=>p.id===state.activeId))state.activeId=null;
}
function save(){localStorage.setItem(LS_KEY,JSON.stringify(state.projects));if(state.activeId)localStorage.setItem(LS_ACTIVE,state.activeId);else localStorage.removeItem(LS_ACTIVE);localStorage.setItem(LS_MODE,state.mode);}
function activeProject(){return state.projects.find(p=>p.id===state.activeId)||null;}
function log(msg,cls=''){const t=new Date().toLocaleTimeString();state.termLines.push((cls?`[${cls}] `:'')+`${t}  ${msg}`);if(state.termLines.length>200)state.termLines=state.termLines.slice(-150);}
function toast(msg,href){state.toast={msg,href,at:Date.now()};setTimeout(()=>{if(state.toast&&Date.now()-state.toast.at>=5000){state.toast=null;render();}},5200);}
function iconFor(path){if(/\.tsx?$/.test(path))return'TS';if(/\.jsx?$/.test(path))return'JS';if(/\.css$/.test(path))return'CSS';if(/\.json$/.test(path))return'{}';if(/\.html?$/.test(path))return'<>';if(/\.md$/.test(path))return'MD';return'·';}
function pathsOf(proj){return Object.keys(proj.files||{}).sort((a,b)=>a.localeCompare(b));}
function openProject(id){const p=state.projects.find(x=>x.id===id);if(!p)return;state.activeId=id;state.view='workspace';state.openTabs=[];state.activePath=null;state.dirty=new Set();const prefer=['src/App.tsx','src/App.jsx','index.html','README.md'];const first=prefer.find(f=>p.files[f])||pathsOf(p)[0];if(first){state.openTabs=[first];state.activePath=first;}save();log(`Opened ${p.name}`);render();}
function createFromSeed(seed){const id=seed.id+'-'+Date.now().toString(36);const proj={id,name:seed.name,tag:seed.tag,desc:seed.desc,color:seed.color,files:{...seed.files},createdAt:Date.now(),updatedAt:Date.now(),fromSeed:seed.id};state.projects.unshift(proj);save();log(`Cloned template: ${seed.name}`,'ok');openProject(id);}
function createBlank(){const name=(state.modalName||'untitled-app').trim()||'untitled-app';const seed=blankProject(name);const proj={id:seed.id,name:seed.name,tag:'Blank',desc:seed.desc,color:seed.color,files:seed.files,createdAt:Date.now(),updatedAt:Date.now()};state.projects.unshift(proj);state.modal=null;state.modalName='';save();log(`Created blank: ${proj.name}`,'ok');openProject(proj.id);}
function deleteProject(id){if(!confirm('Delete this project from this browser?'))return;state.projects=state.projects.filter(p=>p.id!==id);if(state.activeId===id){state.activeId=null;state.view='dash';}save();log('Project deleted');render();}
function setFileContent(path,content){const p=activeProject();if(!p)return;p.files[path]=content;p.updatedAt=Date.now();state.dirty.add(path);save();}
function addFile(){const p=activeProject();if(!p)return;const path=prompt('File path (e.g. src/util.ts)','src/new-file.ts');if(!path||!path.trim())return;const clean=path.trim().replace(/^\/+/, '');if(p.files[clean]!=null){alert('File already exists');return;}p.files[clean]='';p.updatedAt=Date.now();state.openTabs.push(clean);state.activePath=clean;state.dirty.add(clean);save();log(`Added ${clean}`);render();}
function closeTab(path){state.openTabs=state.openTabs.filter(t=>t!==path);if(state.activePath===path)state.activePath=state.openTabs[state.openTabs.length-1]||null;render();}
function exportZip(){const p=activeProject();if(!p)return;const files=Object.entries(p.files);const parts=[],central=[];let offset=0;const enc=new TextEncoder();function crc32(buf){let c=~0;for(let i=0;i<buf.length;i++){c^=buf[i];for(let k=0;k<8;k++)c=(c>>>1)^(0xedb88320&-(c&1));}return~c>>>0;}for(const[name,text]of files){const data=enc.encode(text),nameBytes=enc.encode(name),crc=crc32(data),local=new Uint8Array(30+nameBytes.length+data.length);const view=new DataView(local.buffer);view.setUint32(0,0x04034b50,true);view.setUint16(4,20,true);view.setUint32(14,crc,true);view.setUint32(18,data.length,true);view.setUint32(22,data.length,true);view.setUint16(26,nameBytes.length,true);local.set(nameBytes,30);local.set(data,30+nameBytes.length);parts.push(local);const cen=new Uint8Array(46+nameBytes.length),cv=new DataView(cen.buffer);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint32(16,crc,true);cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);cv.setUint16(28,nameBytes.length,true);cv.setUint32(42,offset,true);cen.set(nameBytes,46);central.push(cen);offset+=local.length;}const centralSize=central.reduce((s,x)=>s+x.length,0),end=new Uint8Array(22),ev=new DataView(end.buffer);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,centralSize,true);ev.setUint32(16,offset,true);const blob=new Blob([...parts,...central,end],{type:'application/zip'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${p.name.replace(/\s+/g,'-').toLowerCase()}.zip`;a.click();URL.revokeObjectURL(a.href);log(`Exported ${p.name}.zip (${files.length} files)`,'ok');toast(`Downloaded ${p.name}.zip — run npm i && npm run dev`);render();}
async function shipApi(body){const res=await fetch(`${API_BASE}/api/dev/ship`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const data=await res.json().catch(()=>({}));if(!res.ok){const err=new Error(data.message||data.error||`HTTP ${res.status}`);err.data=data;err.status=res.status;throw err;}return data;}
async function pushGithub(){const p=activeProject();if(!p)return;if(!state.tokens.github){state.modal='settings';toast('Add a GitHub token in Settings first');render();return;}state.shipping=true;render();const repoName=p.name.toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'merveil-app';log(`GitHub: creating ${repoName}…`,'cmd');try{const data=await shipApi({action:'github_create_and_push',token:state.tokens.github,name:repoName,description:p.desc||`Built with Merveil Developer — ${p.tag||'app'}`,private:true,files:p.files});log(`GitHub OK → ${data.html_url} (${data.files} files)`,'ok');toast('Pushed to GitHub',data.html_url);p.githubUrl=data.html_url;p.updatedAt=Date.now();save();}catch(e){log(`GitHub failed: ${e.message}`,'err');toast(String(e.message));}state.shipping=false;state.modal=null;render();}
async function deployVercel(){const p=activeProject();if(!p)return;if(!state.tokens.vercel){state.modal='settings';toast('Add a Vercel token in Settings first');render();return;}state.shipping=true;render();const name=p.name.toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'merveil-app';log(`Vercel: deploying ${name}…`,'cmd');try{const data=await shipApi({action:'vercel_deploy',token:state.tokens.vercel,name,files:p.files,target:'production'});log(`Vercel OK → ${data.url||data.id}`,'ok');toast('Deploy started',data.url);p.vercelUrl=data.url;p.updatedAt=Date.now();save();}catch(e){log(`Vercel failed: ${e.message}`,'err');toast(String(e.message));}state.shipping=false;state.modal=null;render();}
async function verifyTokens(){if(state.tokens.github){try{const d=await shipApi({action:'github_whoami',token:state.tokens.github});state.tokens.githubLogin=d.login||'';log(`GitHub linked: @${d.login}`,'ok');}catch(e){state.tokens.githubLogin='';log(`GitHub token invalid: ${e.message}`,'err');}}if(state.tokens.vercel){try{const d=await shipApi({action:'vercel_whoami',token:state.tokens.vercel});state.tokens.vercelUser=d.user||d.email||'';log(`Vercel linked: ${state.tokens.vercelUser}`,'ok');}catch(e){state.tokens.vercelUser='';log(`Vercel token invalid: ${e.message}`,'err');}}saveTokens();render();}
async function checkHealth(){try{const r=await fetch(`${API_BASE}/api/health`,{cache:'no-store'});state.health.api=r.ok?'ok':'fail';}catch{state.health.api='fail';}state.health.ship=(state.tokens.github||state.tokens.vercel)?'ok':'warn';render();}
function render(){
  const p=activeProject();
  if(state.view==='workspace'&&p){
    const paths=pathsOf(p),content=p.files[state.activePath]||'';
    app.innerHTML=`<header class="top"><div class="brand"><span class="orb"></span>Merveil Developer</div><span class="sep"></span><span class="proj-name">${esc(p.name)}</span><span class="spacer"></span><span class="pill"><span class="live"></span>Build it deeper.</span><button class="btn primary" data-act="preview">Preview</button><button class="btn ship" data-act="ship">Ready to Ship</button></header><div class="shell"><aside class="panel"><div class="panel-h">Files <button class="btn sm" data-act="add-file">+ File</button></div><div class="panel-body">${paths.map(f=>`<button class="tree-item ${state.activePath===f?'on':''}" data-file="${esc(f)}"><span class="ico">${iconFor(f)}</span><span class="nm">${esc(f)}</span></button>`).join('')}</div></aside><main class="main"><div class="tabs">${state.openTabs.map(t=>`<button class="tab ${t===state.activePath?'on':''}" data-file="${esc(t)}">${esc(t)} <span class="x" data-close="${esc(t)}">×</span></button>`).join('')}</div><div class="editor-wrap"><textarea class="editor" spellcheck="false" aria-label="Code editor">${esc(content)}</textarea><aside class="guide"><h4>Merveil</h4><p>Build it deeper.</p><p>I’m working with the real project files. Change code, preview it, validate it, then ship when it is ready.</p><ol><li>Edit the active file.</li><li>Preview the current source.</li><li>Validate before shipping.</li></ol></aside></div></main></div>`;
    const ed=app.querySelector('.editor');if(ed)ed.addEventListener('input',()=>{setFileContent(state.activePath,ed.value);});
    app.querySelectorAll('[data-file]').forEach(b=>b.addEventListener('click',e=>{if(e.target.closest('[data-close]'))return;const f=b.dataset.file;if(!state.openTabs.includes(f))state.openTabs.push(f);state.activePath=f;render();}));
    app.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();closeTab(b.dataset.close);}));
    app.querySelector('[data-act="add-file"]')?.addEventListener('click',addFile);
    app.querySelector('[data-act="preview"]')?.addEventListener('click',()=>{const html=p.files['index.html']||content;const w=window.open('about:blank','_blank');if(w){w.document.open();w.document.write(html);w.document.close();}});
    app.querySelector('[data-act="ship"]')?.addEventListener('click',()=>{if(validateProject(p)){state.modal='ship';render();}else toast('Validate the project before shipping.');});
    return;
  }
  app.innerHTML=`<main class="dash"><section class="hero"><h1>Build it deeper.</h1><p>Open a real project when you want files, code, preview and shipping controls.</p><div class="hero-actions"><button class="btn primary" data-act="new">+ New project</button></div></section><div class="section-t">Your projects <span class="count">${state.projects.length}</span></div><div class="cards">${state.projects.map(x=>`<button class="card" data-project="${esc(x.id)}"><div class="swatch" style="background:${esc(x.color||'#72dfe7')}">M</div><h3>${esc(x.name)}</h3><div class="tag">${esc(x.tag||'Project')}</div><p>${esc(x.desc||'')}</p></button>`).join('')}</div></main>`;
  app.querySelectorAll('[data-project]').forEach(b=>b.addEventListener('click',()=>openProject(b.dataset.project)));
}
function validateProject(p){const html=p?.files?.['index.html']||'';return /<html[\s>]/i.test(html)&&/<body[\s>]/i.test(html)&&/<\/html>/i.test(html);}
load();if(!state.activeId)state.view='dash';else state.view='workspace';render();checkHealth();