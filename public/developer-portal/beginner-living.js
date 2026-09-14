/* Merveil living state: visualizes the existing real generator and wires the real result into Pro Studio. */
(function(){
  const app=()=>document.getElementById('app');
  let overlay,note,last='';
  function ensure(){
    if(overlay)return;
    overlay=document.createElement('div');overlay.className='m-living-overlay';overlay.innerHTML='<div class="m-living-stage"><div class="m-living-orb"><div class="m-living-core">M</div><i></i><i></i><i></i></div><h1 class="m-living-title">Merveil is making it real.</h1><p class="m-living-phase" id="m-living-phase">Understanding your idea…</p><div class="m-living-track"><span></span></div></div></div>';
    document.body.appendChild(overlay);
    note=document.createElement('div');note.className='m-result-note';document.body.appendChild(note);
  }
  function projectFromResult(){
    const a=app(); if(!a)return null;
    const shell=a.querySelector('.result-shell,.result,.preview-shell');
    if(!shell)return null;
    const html=shell.querySelector('iframe')?.srcdoc || shell.querySelector('iframe')?.getAttribute('srcdoc') || '';
    const body=shell.querySelector('.generated-code,pre,textarea')?.value || shell.querySelector('.generated-code,pre')?.textContent || '';
    const source=html || body;
    if(!source.trim())return null;
    const title=(shell.querySelector('h1,h2,[data-project-name]')?.textContent||'Merveil creation').trim();
    return {name:title.slice(0,80)||'Merveil creation',files:{'index.html':source},createdAt:Date.now(),updatedAt:Date.now(),tag:'Generated',desc:'Created with Merveil'};
  }
  function wireStudio(){
    const a=app();if(!a)return;
    const buttons=[...a.querySelectorAll('button,a')].filter(el=>/\bStudio\b|Open Studio/i.test(el.textContent||''));
    buttons.forEach(btn=>{if(btn.dataset.merveilStudioWired)return;btn.dataset.merveilStudioWired='1';btn.addEventListener('click',e=>{
      const p=projectFromResult();
      if(p){try{localStorage.setItem('merveil_dev_projects_v5',JSON.stringify([p]));localStorage.setItem('merveil_dev_active_v5',p.id||'generated-'+Date.now());}catch(_){} }
      const url='/developer-portal/studio-v5.html?source=merveil-result';
      e.preventDefault();e.stopPropagation();location.href=url;
    },true);});
  }
  function scan(){
    const a=app();if(!a)return;
    ensure();
    const text=(a.innerText||'').replace(/\s+/g,' ').trim();
    const building=/Merveil Boost running|Building your product|Merveil Boost|Writing real HTML|Finishing/.test(text);
    const result=!!a.querySelector('.result-shell,.result,.preview-shell') || /Your creation|Generated with Merveil|Live Preview/.test(text);
    if(building){
      document.body.classList.remove('m-living-result'); overlay.classList.add('is-on');
      let phase='Understanding your idea…';
      if(/Planning/.test(text))phase='Planning the creation…';
      if(/Writing real HTML|Generate/.test(text))phase='Creating it now…';
      if(/Finishing|Packaging/.test(text))phase='Finishing the creation…';
      const p=document.getElementById('m-living-phase');if(p)p.textContent=phase;
      last='building';
    }else if(result){
      overlay.classList.remove('is-on'); document.body.classList.add('m-living-result');
      note.classList.add('is-on');
      note.innerHTML='<strong>Your creation is alive.</strong> <button type="button" data-merveil-studio>Open Studio →</button>';
      wireStudio(); last='result';
    }else{
      overlay.classList.remove('is-on'); document.body.classList.remove('m-living-result');
      if(last==='result'){note.classList.remove('is-on');last='';}
    }
  }
  const observer=new MutationObserver(()=>requestAnimationFrame(scan));
  window.addEventListener('load',()=>{ensure();scan();const a=app();if(a)observer.observe(a,{subtree:true,childList:true,characterData:true});});
})();