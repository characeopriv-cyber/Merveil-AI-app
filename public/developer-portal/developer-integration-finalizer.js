// Final Developer Platform lifecycle bridge: health, OAuth callback, and verified build flow.
(function(){
  const KEY='merveil:developer-health';
  const project=()=>{try{return JSON.parse(localStorage.getItem('merveil:developer-project')||'null')}catch{return null}};
  const emit=(name,detail)=>window.dispatchEvent(new CustomEvent(name,{detail}));
  async function health(){
    try{const r=await fetch('/api/developer-health',{credentials:'include',cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.code||d.error||'Health check failed');localStorage.setItem(KEY,JSON.stringify(d));emit('merveil:developer:health',d);return d}catch(e){emit('merveil:developer:health:error',{code:'HEALTH_CHECK_FAILED',error:e.message});return null}
  }
  async function refreshProjectContext(){
    const p=project();if(!p?.id)return;
    try{const r=await fetch('/api/developer-debug-project?projectId='+encodeURIComponent(p.id),{credentials:'include',cache:'no-store'});if(!r.ok)return;const d=await r.json();emit('merveil:project:context:refreshed',d)}catch{}
  }
  function callback(){
    const q=new URLSearchParams(location.search);const state=q.get('github');if(!state)return;
    const detail={status:state,projectId:q.get('projectId')||null,message:q.get('message')||null};
    emit('merveil:github:oauth',detail);
    if(state==='connected'){refreshProjectContext();health();}
    q.delete('github');q.delete('projectId');q.delete('message');const clean=location.pathname+(q.toString()?'?'+q.toString():'')+location.hash;history.replaceState({},'',clean);
  }
  async function verifiedBuild(){
    const p=project();if(!p?.id){const e=new Error('ACTIVE_PROJECT_REQUIRED');e.code='ACTIVE_PROJECT_REQUIRED';throw e}
    emit('merveil:build:flow:start',{projectId:p.id});
    const check=window.merveilDeveloperBuildCheck?await window.merveilDeveloperBuildCheck(p.id):null;
    if(check&&!check.ready){const e=new Error(check.blockers?.[0]||'BUILD_CHECK_BLOCKED');e.code='BUILD_CHECK_BLOCKED';throw e}
    if(!window.merveilDeveloperSandboxBuild){const e=new Error('SANDBOX_BUILD_UNAVAILABLE');e.code='SANDBOX_BUILD_UNAVAILABLE';throw e}
    const result=await window.merveilDeveloperSandboxBuild(p.id);emit('merveil:build:flow:finished',result);await health();return result;
  }
  window.merveilDeveloperHealth=health;
  window.merveilDeveloperVerifiedBuild=verifiedBuild;
  callback();health();
  window.addEventListener('merveil:project:active',()=>{health();refreshProjectContext()});
})();
