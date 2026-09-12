(() => {
  const host = document.createElement('div');
  host.id = 'merveil-interface-publish-control';
  host.style.cssText = 'margin:14px auto 0;max-width:1380px;padding:0 28px;position:relative;z-index:20';

  function card(project) {
    const wrap = document.createElement('section');
    wrap.style.cssText = 'border:1px solid #d8cdbf;border-radius:18px;padding:16px;background:#fffaf3;box-shadow:0 10px 28px rgba(20,18,12,.05)';
    const title = document.createElement('div');
    title.innerHTML = `<strong style="display:block">Publish in Merveil Interface</strong><span style="display:block;font-size:12px;opacity:.7;margin-top:4px">ON by default · ${String(project.name || 'Project').replace(/[<>]/g,'')} will appear in Interface automatically when completed.</span>`;
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:12px';
    const select = document.createElement('select');
    select.style.cssText = 'flex:1;min-width:160px;padding:9px;border:1px solid #d8cdbf;border-radius:10px;background:#fff';
    const projects = window.__merveilDeveloperProjects || [project];
    projects.forEach(p => { const o = document.createElement('option'); o.value = p.id; o.textContent = p.name || p.id; if (p.id === project.id) o.selected = true; select.appendChild(o); });
    const button = document.createElement('button');
    button.type = 'button';
    button.style.cssText = 'min-width:72px;padding:9px 13px;border:0;border-radius:999px;font-weight:700;cursor:pointer';
    const state = { enabled: true, live: false, verified: false, projectId: project.id };
    async function load(id) {
      const r = await fetch(`/api/developer-interface?projectId=${encodeURIComponent(id)}`, { credentials:'include' });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(b.error || 'Interface setting unavailable');
      state.projectId=id; state.enabled=b.publishToInterface !== false; state.live=Boolean(b.interface?.live); state.verified=Boolean(b.interface?.verified); render();
    }
    function render() {
      button.textContent = state.enabled ? 'ON' : 'OFF';
      button.style.background = state.enabled ? '#29251f' : '#c9c0b5';
      button.style.color = '#fff';
      note.textContent = state.live ? `● Live in Interface${state.verified ? ' · ✓ Verified' : ' · Profile completion required for verification'}` : state.enabled ? 'Will publish automatically when completed' : 'Private — not published to Interface';
    }
    const note = document.createElement('div'); note.style.cssText='font-size:11px;opacity:.72;margin-top:9px';
    button.onclick = async () => {
      button.disabled=true;
      try {
        const next=!state.enabled;
        const r=await fetch('/api/developer-interface',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'toggle',projectId:state.projectId,enabled:next})});
        const b=await r.json().catch(()=>({})); if(!r.ok) throw new Error(b.error||'Unable to update');
        state.enabled=Boolean(b.publishToInterface); state.live=Boolean(b.listing); render();
      } catch(e) { note.textContent=e.message||'Unable to update Interface setting'; }
      finally { button.disabled=false; }
    };
    select.onchange=()=>load(select.value).catch(e=>{note.textContent=e.message});
    row.append(select,button); wrap.append(title,row,note); load(project.id).catch(e=>{note.textContent=e.message});
    return wrap;
  }

  async function init() {
    try {
      const r=await fetch('/api/developer-home',{credentials:'include'}); const b=await r.json().catch(()=>({}));
      if(!r.ok || !Array.isArray(b.projects) || !b.projects.length) return;
      window.__merveilDeveloperProjects=b.projects;
      const first=b.projects[0]; host.appendChild(card(first));
      const anchor=document.querySelector('.mlh') || document.querySelector('main') || document.body.firstElementChild;
      if(anchor?.parentNode) anchor.parentNode.insertBefore(host,anchor); else document.body.prepend(host);
    } catch {}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
