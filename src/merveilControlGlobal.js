let loaded=false;
export function startMerveilControl(){
  if(loaded||typeof document==='undefined')return;
  if(!location.pathname.includes('/merveil-admin-x9k2'))return;
  if(document.querySelector('script[data-merveil-control="true"]')){loaded=true;return;}
  loaded=true;
  const s=document.createElement('script');
  s.src='/developer-portal/merveil-control-admin-ui.js';
  s.async=true;
  s.dataset.merveilControl='true';
  document.head.appendChild(s);
}
