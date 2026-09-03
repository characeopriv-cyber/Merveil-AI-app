import React, { useEffect, useMemo, useState } from "react";
import { Check, Copy, Link2, Share2, UserPlus, X } from "lucide-react";

const APP_NAME = "Merveil AI";

function getInviteCode() {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("invite") || params.get("ref");
    if (fromUrl) return fromUrl;
    return localStorage.getItem("merveil_invite_code") || "MERVEIL";
  } catch {
    return "MERVEIL";
  }
}

export default function MerveilInvite() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [inviteCode, setInviteCode] = useState("MERVEIL");

  useEffect(() => {
    setInviteCode(getInviteCode());
  }, []);

  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.origin + "/invite");
    url.searchParams.set("invite", inviteCode);
    return url.toString();
  }, [inviteCode]);

  const shareText = `Join me on ${APP_NAME}. Connect with me in one tap and discover a smarter way to interact.`;

  async function shareInvite() {
    try {
      if (navigator.share) {
        await navigator.share({ title: `Join me on ${APP_NAME}`, text: shareText, url: inviteUrl });
        setShared(true);
        return;
      }
      await navigator.clipboard.writeText(`${shareText}\n${inviteUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {}
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copy your Merveil invite link", inviteUrl);
    }
  }

  const isInviteLanding = typeof window !== "undefined" && window.location.pathname === "/invite";

  if (isInviteLanding) {
    return (
      <div className="merveil-invite-landing" role="dialog" aria-label="Merveil invitation">
        <div className="merveil-invite-card">
          <div className="merveil-invite-mark">M</div>
          <div className="merveil-invite-eyebrow">MERVEIL AI</div>
          <h1>Connect. Discover. Belong.</h1>
          <p>{shareText}</p>
          <button className="merveil-invite-primary" onClick={() => { window.location.href = "/"; }}>
            <UserPlus size={19} /> Join & connect
          </button>
          <button className="merveil-invite-secondary" onClick={() => { window.location.href = "/"; }}>
            Explore Merveil AI
          </button>
          <span className="merveil-invite-trust">Private by design · Powered by IVONIX</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <button className="merveil-invite-fab" onClick={() => setOpen(true)} aria-label="Invite people to Merveil AI">
        <Share2 size={18} /> <span>Invite</span>
      </button>

      {open && (
        <div className="merveil-invite-overlay" role="dialog" aria-modal="true" aria-label="Invite to Merveil AI">
          <button className="merveil-invite-backdrop" onClick={() => setOpen(false)} aria-label="Close" />
          <div className="merveil-invite-panel">
            <button className="merveil-invite-close" onClick={() => setOpen(false)} aria-label="Close"><X size={19} /></button>
            <div className="merveil-invite-icon"><Link2 size={21} /></div>
            <div className="merveil-invite-eyebrow">GROW YOUR CIRCLE</div>
            <h2>Invite someone to connect</h2>
            <p>One link. One tap. Start your connection on Merveil AI.</p>
            <div className="merveil-invite-linkbox">{inviteUrl}</div>
            <div className="merveil-invite-actions">
              <button className="merveil-invite-primary" onClick={shareInvite}>
                {shared ? <Check size={18} /> : <Share2 size={18} />}
                {shared ? "Shared" : "Share invite"}
              </button>
              <button className="merveil-invite-copy" onClick={copyInvite}>
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
            <div className="merveil-invite-note">Your invite link carries your referral code so Merveil can attribute new connections and traction.</div>
          </div>
        </div>
      )}
    </>
  );
}
