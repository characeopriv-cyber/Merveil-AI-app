/* Merveil Developer Home lifecycle guard.
 * Keeps rename/select actions safe even if the Home enhancer is re-rendered.
 */
(() => {
  if (window.__merveilHomeLifecycleGuard) return;
  window.__merveilHomeLifecycleGuard = true;
  const KEY='merveil:developer-project';
  const json=async(url,options={})=>{const r=await fetch(url,{credentials:'include',cache:'no-store',...options});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Request failed');return d};
  document.addEventListener('click', async (event) => {
    const button=event.target.closest?.('[data-rename]');
    if(!button) return;
    event.stopImmediatePropagation();
    event.preventDefault();
    try {
      const home=await json('/api/developer-home');
      const project=(home.projects||[]).find(p=>p.id===button.dataset.rename);
      if(!project)return;
      const name=window.prompt('Rename project',project.name||'Untitled project');
      if(!name||name.trim()===project.name)return;
      const result=await json('/api/developer-project',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'rename',projectId:project.id,name:name.trim()})});
      let active=null;try{active=JSON.parse(localStorage.getItem(KEY)||'null')}catch{}
      if(active?.id===project.id){localStorage.setItem(KEY,JSON.stringify({...result.project,source:active.source||'workspace'}));window.dispatchEvent(new CustomEvent('merveil:project-context',{detail:{project:result.project,source:active.source||'workspace'}}));window.dispatchEvent(new CustomEvent('merveil:project:active',{detail:{project:result.project,source:active.source||'workspace'}}));}
      window.location.reload();
    } catch(error) { alert(error?.message||'Project rename failed'); }
  }, true);
})();
