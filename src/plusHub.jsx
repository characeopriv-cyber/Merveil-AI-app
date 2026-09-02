import React, { useEffect, useState } from "react";
import { Bell, ChevronRight, Community, Globe2, Volume2, Gamepad2, Phone, ReceiptText, X, Plus } from "lucide-react";

const FEATURES = [
  { label: "Community", icon: Community },
  { label: "New to UAE", icon: Globe2 },
  { label: "Sounds", icon: Volume2 },
  { label: "Arena", icon: Gamepad2 },
  { label: "AI Call", icon: Phone },
  { label: "Transaction", icon: ReceiptText },
];

const normalize = (value) => String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
const wanted = new Set(FEATURES.map((item) => normalize(item.label)));

function isVisible(element) {
  if (!element || element.closest("[data-merveil-plus-root]") || element.dataset?.merveilPlusHidden === "true") return false;
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
}

function getClickTarget(node) {
  return node.closest("button, a, [role='button'], [onclick]") || node;
}

function findOriginalFeature(label) {
  const target = normalize(label);
  const candidates = Array.from(document.querySelectorAll("button, a, [role='button'], [onclick]"));
  return candidates
    .filter((el) => isVisible(el) && !el.closest("[data-merveil-plus-root]"))
    .filter((el) => normalize(el.innerText || el.getAttribute("aria-label") || el.getAttribute("title")) === target)
    .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0] || null;
}

function hideSecondaryFeatureStrip() {
  FEATURES.forEach(({ label }) => {
    const target = findOriginalFeature(label);
    if (!target) return;
    const rect = target.getBoundingClientRect();
    // These are the secondary home features. Only hide the compact top-area
    // navigation item, never a feature card deeper in the application.
    if (rect.top <= Math.max(520, window.innerHeight * 0.42)) {
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

function PlusHub() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    hideSecondaryFeatureStrip();
    const observer = new MutationObserver(() => hideSecondaryFeatureStrip());
    observer.observe(document.body, { childList: true, subtree: true });
    const onResize = () => hideSecondaryFeatureStrip();
    window.addEventListener("resize", onResize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("merveil-no-scroll", open);
    return () => document.body.classList.remove("merveil-no-scroll");
  }, [open]);

  const activate = (label) => {
    const target = findOriginalFeature(label);
    setOpen(false);
    if (target) {
      target.click();
      return;
    }
    // React may re-render the secondary strip after the menu closes; retry once.
    window.setTimeout(() => findOriginalFeature(label)?.click(), 80);
  };

  return (
    <div data-merveil-plus-root="true" className="merveil-plus-root">
      <button
        type="button"
        className="merveil-plus-trigger"
        aria-label="Plus"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Plus size={18} strokeWidth={2.4} />
        <span>Plus</span>
      </button>

      {open && (
        <div className="merveil-plus-overlay" role="dialog" aria-modal="true" aria-label="Plus">
          <button className="merveil-plus-backdrop" aria-label="Close Plus" onClick={() => setOpen(false)} />
          <section className="merveil-plus-panel">
            <header className="merveil-plus-header">
              <div>
                <div className="merveil-plus-eyebrow">MERVEIL</div>
                <h2>Plus</h2>
                <p>Your Merveil features, together.</p>
              </div>
              <button type="button" className="merveil-plus-close" aria-label="Close Plus" onClick={() => setOpen(false)}>
                <X size={20} />
              </button>
            </header>

            <div className="merveil-plus-list">
              {FEATURES.map(({ label, icon: Icon }) => (
                <button key={label} type="button" className="merveil-plus-item" onClick={() => activate(label)}>
                  <span className="merveil-plus-icon"><Icon size={20} /></span>
                  <span className="merveil-plus-label">{label}</span>
                  <ChevronRight size={18} className="merveil-plus-chevron" />
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default PlusHub;
