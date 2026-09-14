/* Merveil living state: visualizes the existing real generator without faking progress. */
(function(){
  const app=()=>document.getElementById('app');
  let overlay,note,last='';
  function ensure(){
    if(overlay)return;
    overlay=document.createElement('div');overlay.className='m-living-overlay';overlay.innerHTML='<div class="m-living-stage"><div class="m-living-orb"><div class="m-living-core">M</div><i></i><i></i><i></i></div><h1 class="m-living-title">Merveil is making it real.</h1><p class="m-living-phase" id="m-living-phase">Understanding your idea…</p><div class="m-living-track"><span></span></div></div>';
    document.body.appendChild(overlay);
    note=document.createElement('div');note.className='m-result-note';document.body.appendChild(note);
  }
  function scan(){
    const a=app();if(!a)return;
    ensure();
    const text=(a.innerText||'').replace(/\s+/g,' ').trim();
    const building=/Merveil Boost running|Building your product|Merveil Boost|Writing real HTML|Finishing/.test(text);
    const result=!!a.querySelector('.result-shell,.result,.preview-shell') || /Your creation|Generated with Merveil|Live Preview/.test(text);
    if(building){
      document.body.classList.remove('m-living-result');
      overlay.classList.add('is-on');
      let phase='Understanding your idea…';
      if(/Planning/.test(text))phase='Planning the creation…';
      if(/Writing real HTML|Generate/.test(text))phase='Creating it now…';
      if(/Finishing|Packaging/.test(text))phase='Finishing the creation…';
      const p=document.getElementById('m-living-phase');if(p)p.textContent=phase;
      if(last!=='building'){last='building';}
    }else if(result){
      overlay.classList.remove('is-on');
      document.body.classList.add('m-living-result');
      note.classList.add('is-on');note.innerHTML='<strong>Your creation is alive.</strong>  ·  Edit · Validate · Studio';
      last='result';
    }else{
      overlay.classList.remove('is-on');
      document.body.classList.remove('m-living-result');
      if(last==='result'){note.classList.remove('is-on');last='';}
    }
  }
  const observer=new MutationObserver(()=>requestAnimationFrame(scan));
  window.addEventListener('load',()=>{ensure();scan();const a=app();if(a)observer.observe(a,{subtree:true,childList:true,characterData:true});});
})();