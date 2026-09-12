/* Merveil Pro Studio project bridge.
 * The existing Pro IDE remains intact. This layer makes its visible workspace
 * follow the authenticated active Developer project, persist edits, expose a
 * real build-check gate, and show persistent build history from Supabase.
 */
(() => {
  if (window.__merveilProProjectOverlay) return;
  window.__merveilProProjectOverlay = true;
  const KEY = 'merveil:developer-project';
  const state = { project:null, files:[], active:'', loaded:false, saving:false, builds:[] };
  const project = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const headers = () => {
    const h = {'content-type':'application/json'};
    try { for (let i=0;i<localStorage.length;i++) { const k=localStorage.key(i)||''; if(!k.includes('auth-token')) continue; const raw=localStorage.getItem(k); if(!raw) continue; const j=JSON.parse(raw); const t=j?.access_token||j?.currentSession?.access_token; if(t){h.authorization=`Bearer ${t}`;break;} } } catch {}
    return h;
  };
  const load = async () => {
    const p=project(); if(!p?.id) return false;
    if(state.loaded && state.project?.id===p.id) return true;
    const r=await fetch(`/api/developer-debug-project?projectId=${encodeURIComponent(p.id)}`,{credentials:'include'}); if(!r.ok) return false;
    const d=await r.json(); state.project=p; state.files=Array.isArray(d.files)?d.files:[]; state.active=state.files[0]?.path||''; state.loaded=true;
    await loadBuilds(); return true;
  };
  const loadBuilds = async () => {
    if(!state.project?.id) return;
    try { const r=await fetch(`/api/developer-builds?projectId=${encodeURIComponent(state.project.id)}`,{credentials:'include'}); const d=await r.json(); if(r.ok) state.builds=Array.isArray(d.builds)?d.builds:[]; } catch {}
  };
  const save = async (path,content) => {
    if(!state.project?.id||!path||state.saving) return;
    state.saving=true;
    try { const r=await fetch(`/api/developer-project-files?projectId=${encodeURIComponent(state.project.id)}`,{method:'POST',credentials:'include',headers:headers(),body:JSON.stringify({projectId:state.project.id,files:[{path,content}]})}); if(r.ok){const f=state.files.find(x=>x.path===path);if(f)f.content=content;} }
    finally {state.saving=false;}
  };
  const buildCheck = async () => {
    if(!state.project?.id) return {ready:false,error:'Choose an active developer project first.'};
    try { const r=await fetch('/api/build-check',{method:'POST',credentials:'include',headers:headers(),body:JSON.stringify({projectId:state.project.id})}); const d=await r.json(); return {...d,httpStatus:r.status}; } catch(e){return {ready:false,error:e?.message||String(e)};}
  };
  const recordCheck = async (result) => {
    const status=result?.ready?'success':'failed';
    const logs=result?.ready?`Build Check passed. ${result.warnings?.length||0} warning(s).`:`Build Check blocked: ${(result.blockers||[result.error||'unknown']).join(', ')}`;
    try { await fetch(`/api/developer-builds?projectId=${encodeURIComponent(state.project.id)}`,{method:'POST',credentials:'include',headers:headers(),body:JSON.stringify({projectId:state.project.id,status,logs})}); await loadBuilds(); } catch {}
  };
  const icon = p => /\.tsx?$/.test(p)?'TS':/\.jsx?$/.test(p)?'JS':/\.json$/.test(p)?'{}':/\.css$/.test(p)?'CSS':/\.md$/.test(p)?'MD':'·';
  const apply = () => {
    const root=document.getElementById('pro-root'); if(!root||!state.loaded)return;
    const filesBody=root.querySelector('.files-body');
    if(filesBody){const markup=state.files.map(f=>`<div class="node ${state.active===f.path?'on':''}" data-merveil-path="${esc(f.path)}"><span class="node-ico">${icon(f.path)}</span><span class="node-name">${esc(f.path)}</span></div>`).join('')||'<div style="padding:16px;opacity:.6">Project has no files.</div>';if(filesBody.innerHTML!==markup){filesBody.innerHTML=markup;filesBody.querySelectorAll('[data-merveil-path]').forEach(n=>n.addEventListener('click',()=>open(n.getAttribute('data-merveil-path'))));}}
    const editor=root.querySelector('#editor'); const active=state.files.find(f=>f.path===state.active); if(editor&&active&&editor.value!==String(active.content??''))editor.value=String(active.content??'');
    const titleRepo=root.querySelector('.title-repo'); if(titleRepo&&state.project?.name)titleRepo.textContent=state.project.name;
    const branch=root.querySelector('.title-branch'); if(branch)branch.textContent='⌥ main';
    mountToolbar(root);
  };
  const open = path => {const f=state.files.find(x=>x.path===path);if(!f)return;state.active=path;apply();const e=document.getElementById('editor');if(e){e.focus();e.selectionStart=e.selectionEnd=e.value.length;}};
  const watchEditor = () => {const e=document.getElementById('editor');if(!e||e.dataset.merveilProjectSync==='1')return;e.dataset.merveilProjectSync='1';e.addEventListener('input',()=>{const f=state.files.find(x=>x.path===state.active);if(f)f.content=e.value;clearTimeout(watchEditor.timer);watchEditor.timer=setTimeout(()=>save(state.active,e.value),700);});};
  const mountToolbar = root => {
    if(root.querySelector('#merveil-pro-actions')) return;
    const bar=document.createElement('div');bar.id='merveil-pro-actions';bar.style.cssText='position:fixed;top:42px;right:14px;z-index:10000;display:flex;gap:6px;align-items:center;padding:5px 7px;border:1px solid rgba(0,0,0,.1);border-radius:999px;background:rgba(250,247,241,.96);backdrop-filter:blur(10px);box-shadow:0 5px 18px rgba(0,0,0,.08);font:12px system-ui;color:#292723';
    bar.innerHTML=`<span id="merveil-pro-state" style="opacity:.7">${state.files.length} files</span><button id="merveil-pro-check" style="border:0;border-radius:999px;padding:5px 9px;background:#292723;color:#fff;cursor:pointer">Build check</button><button id="merveil-pro-history" style="border:0;border-radius:999px;padding:5px 9px;background:transparent;color:#292723;cursor:pointer">History</button>`;
    root.appendChild(bar);
    bar.querySelector('#merveil-pro-check').addEventListener('click',async e=>{const b=e.currentTarget;b.disabled=true;b.textContent='Checking…';const result=await buildCheck();await recordCheck(result);b.textContent=result.ready?'Ready':'Blocked';b.title=result.ready?`Ready — ${result.warnings?.length||0} warning(s)`:`Blocked — ${(result.blockers||[result.error||'failed']).join(', ')}`;setTimeout(()=>{b.disabled=false;b.textContent='Build check';},3000);});
    bar.querySelector('#merveil-pro-history').addEventListener('click',()=>showHistory());
  };
  const showHistory = () => {
    const old=document.getElementById('merveil-pro-history-panel');if(old){old.remove();return;}
    const p=document.createElement('div');p.id='merveil-pro-history-panel';p.style.cssText='position:fixed;top:82px;right:14px;z-index:10001;width:min(420px,calc(100vw - 28px));max-height:55vh;overflow:auto;padding:14px;border:1px solid rgba(0,0,0,.1);border-radius:16px;background:rgba(250,247,241,.98);box-shadow:0 12px 40px rgba(0,0,0,.14);font:12px system-ui;color:#292723';
    p.innerHTML=`<strong>Build history</strong><button id="merveil-pro-history-close" style="float:right;border:0;background:none;cursor:pointer">×</button><div style="margin-top:10px">${state.builds.length?state.builds.map(b=>`<div style="padding:9px 0;border-top:1px solid rgba(0,0,0,.08)"><b>${esc(b.status)}</b> <span style="opacity:.55">${esc(b.created_at||'')}</span><div style="opacity:.7;margin-top:3px">${esc(String(b.logs||'').slice(0,500))}</div></div>`).join(''):'No build history yet.'}</div>`;
    document.body.appendChild(p);p.querySelector('#merveil-pro-history-close').onclick=()=>p.remove();
  };
  const boot=async()=>{if(!project()?.id)return;try{if(await load()){apply();watchEditor();}}catch{}};
  const observer=new MutationObserver(()=>{if(state.loaded){apply();watchEditor();}else boot();});observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('merveil:project:active',()=>{state.loaded=false;state.builds=[];boot();});
  setTimeout(boot,600);
})();
