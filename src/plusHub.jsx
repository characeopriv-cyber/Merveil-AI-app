import React, { useEffect, useState } from "react";
import { Users, ChevronRight, Globe2, Volume2, Gamepad2, Phone, ReceiptText, X, Plus } from "lucide-react";

const FEATURES = [
  { label: "Community", icon: Users },
  { label: "New to UAE", icon: Globe2 },
  { label: "Sounds", icon: Volume2 },
  { label: "Arena", icon: Gamepad2 },
  { label: "AI Call", icon: Phone },
  { label: "Transaction", icon: ReceiptText },
];

const normalize = (value) => String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
const originalTargets = new Map();

function isVisible(element) {
  if (!element || element.closest("[data-merveil-plus-root]")) return false;
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
}

function findOriginalFeature(label) {
  const target = normalize(label);
  const candidates = Array.from(document.querySelectorAll("button, a, [role='button'], [onclick]"));
  return candidates.filter((el) => isVisible(el))
    .filter((el) => normalize(el.innerText || el.getAttribute("aria-label") || el.getAttribute("title")) === target)
    .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0] || null;
}

function hideSecondaryFeatureStrip() {
  FEATURES.forEach(({ label }) => {
    const target = findOriginalFeature(label);
    if (!target) return;
    const rect = target.getBoundingClientRect();
    if (rect.top <= Math.max(520, window.innerHeight * 0.42)) {
      originalTargets.set(normalize(label), target);
      target.dataset.merveilPlusHidden = "true";
      target.style.setProperty("display", "none", "important");
      const parent = target.parentElement;
      if (parent && parent.children.length <= 1 && normalize(parent.innerText) === normalize(label)) {
        parent.dataset.merveilPlusHidden = "true";
        parent.style.setProperty("display", "none", "important");
      }
    }
  });
}

function activateOriginalFeature(label) {
  const key = normalize(label);
  let target = originalTargets.get(key);
  if (!target || !target.isConnected) {
    target = findOriginalFeature(label);
    if (target) originalTargets.set(key, target);
  }
  if (target) target.click();
}

function openArenaHub() { window.location.assign("/arena/index.html"); }

function PlusHub() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    hideSecondaryFeatureStrip();
    const observer = new MutationObserver(() => hideSecondaryFeatureStrip());
    observer.observe(document.body, { childList: true, subtree: true });
    const onResize = () => hideSecondaryFeatureStrip();
    window.addEventListener("resize", onResize);
    return () => { observer.disconnect(); window.removeEventListener("resize", onResize); originalTargets.clear(); };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("merveil-no-scroll", open);
    return () => document.body.classList.remove("merveil-no-scroll");
  }, [open]);

  const activate = (label) => {
    setOpen(false);
    if (label === "Sounds") { window.dispatchEvent(new CustomEvent("merveil:open-sounds")); return; }
    if (label === "Arena") { openArenaHub(); return; }
    activateOriginalFeature(label);
  };

  return <div data-merveil-plus-root="true" className="merveil-plus-root" data-arena-hub="game-spot-v1">
    <button type="button" className="merveil-plus-trigger" aria-label="Plus" aria-expanded={open} onClick={() => setOpen((value) => !value)}><Plus size={18} strokeWidth={2.4}/><span>Plus</span></button>
    {open && <div className="merveil-plus-overlay" role="dialog" aria-modal="true" aria-label="Plus">
      <button className="merveil-plus-backdrop" aria-label="Close Plus" onClick={() => setOpen(false)}/>
      <section className="merveil-plus-panel" tabIndex={-1}>
        <header className="merveil-plus-header"><div><div className="merveil-plus-eyebrow">MERVEIL</div><h2>Plus</h2><p>Community, New to UAE, Sounds, Arena, AI Call and Transaction.</p></div><button type="button" className="merveil-plus-close" aria-label="Close Plus" onClick={() => setOpen(false)}><X size={20}/></button></header>
        <div className="merveil-plus-list">{FEATURES.map(({ label, icon: Icon }) => <button key={label} type="button" className="merveil-plus-item" onClick={() => activate(label)}><span className="merveil-plus-icon"><Icon size={20}/></span><span className="merveil-plus-label">{label}</span><ChevronRight size={18} className="merveil-plus-chevron"/></button>)}</div>
      </section>
    </div>}
  </div>;
}
export default PlusHub;
