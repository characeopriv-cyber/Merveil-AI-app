import { API_BASE } from './config.js';

const PROJECTS_KEY='merveil_dev_projects_v5';
const ACTIVE_KEY='merveil_dev_active_v5';
const TOKENS_KEY='merveil_dev_tokens_v5';
const app=document.getElementById('app');
const state={projects:[],project:null,path:'index.html',tab:'files',preview:false,notice:'Ready',saving:false};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function load(){
  try{state.projects=JSON.parse(localStorage.getItem(PROJECTS_KEY)||'[]');}catch{state.projects=[];}
  const active=localStorage.getItem(ACTIVE_KEY);
  state.project=state.projects.find(p=>p.id===active)||state.projects.find(p=>p.generated)||state.projects[0]||null;
  if(!state.project){state.project={id:'workspace-'+Date.now().toString(36),name:'Untitled project',tag:'Project',desc:'New Merveil project',files:{'index.html':'<!doctype html>\n<html lang="en">\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Merveil Project</title></head>\n<body>\n  <main><h1>Start building.</h1></main>\n</body>\n</html>'}};}
  state.path=Object.keys(state.project.files||{})[0]||'index.html';
}
function save(){
  const i=state.projects.findIndex(p=>p.id===state.project.id);
  if(i>=0)state.projects[i]=state.project;else state.projects.unshift(state.project);
  localStorage.setItem(PROJECTS_KEY,JSON.stringify(state.projects));localStorage.setItem(ACTIVE_KEY,state.project.id);
}
function files(){return Object.keys(state.project.files||{}).sort((a,b)=>a.localeCompare(b));}
function validate(){const f=state.project.files||{};const errors=[];if(!f['index.html'])errors.push('index.html is missing');if(f['index.html']&&!/<html[\s>]/i.test(f['index.html']))errors.push('index.html has no html root');if(f['index.html']&&!/<body[\s>]/i.test(f['index.html']))errors.push('index.html has no body');state.notice=errors.length?errors.join(' · '):'Project structure looks valid';render();return !errors.length;}
function preview(){const html=state.project.files?.['index.html']||'';const w=window.open('about:blank','_blank');if(!w){state.notice='Preview blocked by browser';render();return;}w.document.open();w.document.write(html);w.document.close();state.notice='Preview opened';render();}
async function ship(){
  if(!validate())return;
  let tokens={};try{tokens=JSON.parse(localStorage.getItem(TOKENS_KEY)||'{}')}catch{}
  if(!tokens.github&&!tokens.vercel){state.notice='Add a GitHub or Vercel token before shipping';render();return;}
  state.saving=true;state.notice='Shipping…';render();
  try{
    if(tokens.github){
      const name=(state.project.name||'merveil-project').toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'merveil-project';
      const r=await fetch(`${API_BASE}/api/dev/ship`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'github_create_and_push',token:tokens.github,name,description:state.project.desc||'Built with Merveil',private:true,files:state.project.files})});
      const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||d.error||`GitHub HTTP ${r.status}`);state.project.githubUrl=d.html_url||state.project.githubUrl;state.notice='Shipped to GitHub';
    }else{
      const name=(state.project.name||'merveil-project').toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'merveil-project';
      const r=await fetch(`${API_BASE}/api/dev/ship`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'vercel_deploy',token:tokens.vercel,name,files:state.project.files,target:'production'})});
      const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||d.error||`Vercel HTTP ${r.status}`);state.project.vercelUrl=d.url||state.project.vercelUrl;state.notice='Deployment submitted';
    }
    save();
  }catch(e){state.notice=`Ship failed: ${e.message}`;}
  state.saving=false;render();
}
function render(){
  const f=files(),content=state.project.files?.[state.path]??'';
  app.innerHTML=`<div class="studio">
    <aside class="rail" aria-label="Studio navigation">
      <div class="rail-brand"><span class="mark"></span><span>Merveil</span></div>
      <nav>
        <button class="rail-item active" data-tab="files"><span>⌘</span><em>Files</em></button>
        <button class="rail-item" data-tab="preview"><span>◫</span><em>Preview</em></button>
        <button class="rail-item" data-tab="validate"><span>✓</span><em>Validate</em></button>
        <button class="rail-item" data-tab="ship"><span>↑</span><em>Ship</em></button>
      </nav>
      <div class="rail-bottom"><button class="rail-item" data-tab="project"><span>i</span><em>Project</em></button></div>
    </aside>
    <section class="workspace">
      <header class="bar"><div class="identity"><strong>${esc(state.project.name)}</strong><span>${esc(state.project.tag||'Project')}</span></div><div class="bar-actions"><span class="notice">${esc(state.notice)}</span><button class="action" data-act="preview">Preview</button><button class="action primary" data-act="ship">${state.saving?'Shipping…':'Ready to Ship'}</button></div></header>
      <div class="body">
        <aside class="files"><div class="files-head"><span>FILES</span><button data-act="newfile">+</button></div><div class="file-list">${f.map(x=>`<button class="file ${x===state.path?'selected':''}" data-path="${esc(x)}"><span>${esc(x.split('.').pop().toUpperCase())}</span><b>${esc(x)}</b></button>`).join('')}</div></aside>
        <main class="editor-area"><div class="tabbar"><span>${esc(state.path)}</span><span class="dirty">●</span></div><textarea id="editor" spellcheck="false" aria-label="Code editor">${esc(content)}</textarea></main>
        <aside class="merveil"><div class="merveil-head"><span class="mini-mark"></span><strong>Merveil</strong></div><div class="merveil-content"><p class="eyebrow">BUILD IT DEEPER</p><h2>Your project, not a dashboard.</h2><p>I work with the files that are actually in this project. Edit, preview, validate, then ship.</p><div class="status"><span></span><div><strong>${esc(state.notice)}</strong><small>Project-aware workspace</small></div></div></div><div class="merveil-footer">${state.project.githubUrl?`<a href="${esc(state.project.githubUrl)}" target="_blank" rel="noreferrer">GitHub ↗</a>`:''}${state.project.vercelUrl?`<a href="${esc(state.project.vercelUrl)}" target="_blank" rel="noreferrer">Live ↗</a>`:''}</div></aside>
      </div>
    </section>
  </div>`;
  document.querySelectorAll('[data-path]').forEach(b=>b.onclick=()=>{state.path=b.dataset.path;render()});
  document.querySelector('[data-act="preview"]').onclick=preview;
  document.querySelector('[data-act="ship"]').onclick=ship;
  document.querySelector('[data-act="newfile"]').onclick=()=>{const p=prompt('File path','src/new-file.ts');if(!p)return;const x=p.trim().replace(/^\/+/, '');if(!x||state.project.files[x]!=null)return;state.project.files[x]='';state.path=x;save();render()};
  document.querySelector('#editor').oninput=e=>{state.project.files[state.path]=e.target.value;state.project.updatedAt=Date.now();save();state.notice='Unsaved changes stored locally';};
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{const t=b.dataset.tab;if(t==='preview')preview();else if(t==='validate')validate();else if(t==='ship')ship();else if(t==='project')state.notice=state.project.desc||'Current project';render()});
}
load();render();