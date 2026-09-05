import React from "react";

export default function MerveilSecurityStatus({ verified = false, compact = false }) {
  const label = verified ? "E2EE protected" : "E2EE not yet verified";
  const detail = verified
    ? "Only the intended participants should hold the decryption keys."
    : "Merveil will not claim end-to-end encryption until both devices complete the cryptographic handshake.";
  return (
    <div role="status" aria-label={label} style={{display:"flex",alignItems:"center",gap:8,padding:compact?"6px 9px":"9px 11px",borderRadius:12,border:"1px solid rgba(255,255,255,.12)",background:"rgba(255,255,255,.045)",color:"#eef2ff",fontSize:compact?10:11}}>
      <span aria-hidden="true" style={{fontSize:12}}>{verified ? "✓" : "•"}</span>
      <span>
        <strong>{label}</strong>
        {!compact && <span style={{display:"block",marginTop:2,color:"#aab5ca",fontSize:10,lineHeight:1.4}}>{detail}</span>}
      </span>
    </div>
  );
}
