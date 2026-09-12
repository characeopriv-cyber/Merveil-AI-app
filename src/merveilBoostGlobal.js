let loaded=false;
export function startMerveilBoost(){
  if(loaded || typeof document==='undefined') return;
  const allowed=location.pathname.includes('/interface') || location.pathname.includes('/developer') || location.pathname.includes('/studio');
  if(!allowed) return;
  if(document.querySelector('script[data-merveil-boost="true"]')) { loaded=true; return; }
  loaded=true;
  const s=document.createElement('script');
  s.src='/developer-portal/merveil-boost-ui.js';
  s.async=true;
  s.dataset.merveilBoost='true';
  document.head.appendChild(s);
}
