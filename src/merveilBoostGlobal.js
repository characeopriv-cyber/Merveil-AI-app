let loaded=false;
export function startMerveilBoost(){
  if(loaded || typeof document==='undefined') return;
  if(!location.pathname.includes('/interface')) return;
  loaded=true;
  const s=document.createElement('script');
  s.src='/developer-portal/merveil-boost-ui.js';
  s.async=true;
  s.dataset.merveilBoost='true';
  document.head.appendChild(s);
}
