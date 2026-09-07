import React, { useEffect, useState, useRef } from "react";
import {
  Users,
  ChevronRight,
  Globe2,
  Volume2,
  Gamepad2,
  Phone,
  ReceiptText,
  TrendingUp,
  X,
  Plus,
  Code2,
  Layout,
} from "lucide-react";

/** In-app rooms (tabs inside citizen App) */
const FEATURES = [
  { label: "Invest", icon: TrendingUp, tab: "investor" },
  { label: "Community", icon: Users, tab: "community" },
  { label: "New to UAE", icon: Globe2, tab: "newcomer" },
  { label: "Sounds", icon: Volume2, tab: "sound" },
  { label: "Arena", icon: Gamepad2, tab: "arena", newId: "plus_arena", since: "2026-08-01" },
  { label: "AI Call", icon: Phone, tab: "ai-call", newId: "plus_ai_call", since: "2026-08-15" },
  { label: "Wallet", icon: ReceiptText, tab: "transactions", newId: "plus_wallet", since: "2026-09-01" },
];

function plusIsNew(newId, since) {
  if (!newId) return false;
  try {
    const all = JSON.parse(localStorage.getItem("merveil_new_flags_v1") || "{}") || {};
    if (all[newId]) return false;
    if (since && Date.now() - Date.parse(since) > 30 * 24 * 60 * 60 * 1000) return false;
    return true;
  } catch { return !!newId; }
}
function plusDismissNew(newId) {
  if (!newId) return;
  try {
    const all = JSON.parse(localStorage.getItem("merveil_new_flags_v1") || "{}") || {};
    all[newId] = Date.now();
    localStorage.setItem("merveil_new_flags_v1", JSON.stringify(all));
  } catch {}
}

/**
 * Ecosystem rooms — Developer Platform is a separate production Worker.
 * Citizen App remains on its own origin; only the Developer Platform room
 * crosses to its dedicated production surface.
 */
const ECOSYSTEM_ROOMS = [
  {
    id: "developer",
    label: "Developer Platform",
    sub: "APIs · apps · build on Merveil",
    path: "https://merveil-developer-platform.characeopriv.workers.dev",
    icon: Code2,
  },
  {
    id: "interface",
    label: "Interface",
    sub: "Org · family · community surfaces",
    path: "/interface",
    icon: Layout,
  },
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
  return candidates
    .filter((el) => isVisible(el))
    .filter((el) => normalize(el.innerText || el.getAttribute("aria-label") || el.getAttribute("title")) === target)
    .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0] || null;
}

function hideSecondaryFeatureStrip() {
  const floor = window.innerHeight * 0.78;
  FEATURES.forEach(({ label }) => {
    const target = findOriginalFeature(label);
    if (!target) return;
    const rect = target.getBoundingClientRect();
    if (rect.top < floor) return;
    originalTargets.set(normalize(label), target);
    target.dataset.merveilPlusHidden = "true";
    target.style.setProperty("display", "none", "important");
    const parent = target.parentElement;
    if (parent && parent.children.length <= 1 && normalize(parent.innerText) === normalize(label)) {
      parent.dataset.merveilPlusHidden = "true";
      parent.style.setProperty("display", "none", "important");
    }
  });
}

function openArenaHub() {
  window.dispatchEvent(new CustomEvent("merveil:set-tab", { detail: { tab: "arena" } }));
}

function trackEcosystemEnter(roomId, path, source) {
  try {
    const keyName = "merveil_vid";
    let vid = localStorage.getItem(keyName);
    if (!vid) {
      vid = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(keyName, vid);
    }
    let sid = sessionStorage.getItem("merveil_sid");
    if (!sid) {
      sid = "s_" + Date.now().toString(36);
      sessionStorage.setItem("merveil_sid", sid);
    }
    const trackPath = `${path}${path.includes("?") ? "&" : "?"}from=${encodeURIComponent(source || "plus")}&room=${encodeURIComponent(roomId)}`;
    fetch("/api/analytics?action=visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        path: trackPath,
        visitorKey: vid,
        isNewVisitor: false,
        referrer: `merveil-citizen:${source || "plus"}`,
        userAgent: navigator.userAgent,
        language: navigator.language,
        screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
        sessionId: sid,
      }),
    }).catch(() => {});
  } catch {}
}

function enterEcosystemRoom(room, source) {
  trackEcosystemEnter(room.id, room.path, source);
  setTimeout(() => {
    window.location.assign(room.path);
  }, 40);
}

function isIntroPhase() {
  try {
    const phase =
      document.body?.dataset?.merveilPhase ||
      document.documentElement?.dataset?.merveilPhase ||
      "";
    if (phase === "intro") return true;
    const splash = document.querySelector('[style*="#020D1A"]');
    if (splash && /TAP TO|ENTER MERVEIL|ALREADY AWAKE/i.test(document.body?.innerText || "")) {
      return true;
    }
  } catch {}
  return false;
}

function PlusHub() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [dragPos, setDragPos] = useState(null);
  const dragRef = useRef(null);
  const movedRef = useRef(false);

  useEffect(() => {
    const sync = () => setVisible(!isIntroPhase());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-merveil-phase"], childList: true, subtree: true });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-merveil-phase"] });
    const onPhase = () => sync();
    const onEnterRoom = (e) => {
      const id = e?.detail?.room;
      const source = e?.detail?.source || "event";
      const room = ECOSYSTEM_ROOMS.find((r) => r.id === id);
      if (room) enterEcosystemRoom(room, source);
    };
    window.addEventListener("merveil:phase", onPhase);
    window.addEventListener("merveil:enter-ecosystem", onEnterRoom);
    return () => {
      observer.disconnect();
      window.removeEventListener("merveil:phase", onPhase);
      window.removeEventListener("merveil:enter-ecosystem", onEnterRoom);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    hideSecondaryFeatureStrip();
    const observer = new MutationObserver(() => hideSecondaryFeatureStrip());
    observer.observe(document.body, { childList: true, subtree: true });
    const onResize = () => hideSecondaryFeatureStrip();
    window.addEventListener("resize", onResize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      originalTargets.clear();
    };
  }, [visible]);

  useEffect(() => {
    document.body.classList.toggle("merveil-no-scroll", open && visible);
    return () => document.body.classList.remove("merveil-no-scroll");
  }, [open, visible]);

  const activate = (label, tab) => {
    setOpen(false);
    if (label === "Arena" || tab === "arena") {
      openArenaHub();
      return;
    }
    if (label === "Sounds" || tab === "sound") {
      window.dispatchEvent(new CustomEvent("merveil:set-tab", { detail: { tab: "sound" } }));
      return;
    }
    if (tab) {
      window.dispatchEvent(new CustomEvent("merveil:set-tab", { detail: { tab } }));
    }
  };

  if (!visible) return null;

  return (
    <div data-merveil-plus-root="true" className="merveil-plus-root" data-arena-hub="game-spot-v1">
      <button
        type="button"
        className="merveil-plus-trigger"
        aria-label="Plus"
        aria-expanded={open}
        style={dragPos ? { position: "fixed", left: dragPos.x, top: dragPos.y, right: "auto", bottom: "auto", zIndex: 120 } : undefined}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          movedRef.current = false;
          const el = e.currentTarget;
          const rect = el.getBoundingClientRect();
          dragRef.current = {
            ox: e.clientX - rect.left,
            oy: e.clientY - rect.top,
            startX: e.clientX,
            startY: e.clientY,
          };
          el.setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!dragRef.current) return;
          const dx = e.clientX - dragRef.current.startX;
          const dy = e.clientY - dragRef.current.startY;
          if (Math.abs(dx) + Math.abs(dy) > 8) movedRef.current = true;
          if (!movedRef.current) return;
          const x = Math.max(8, Math.min(window.innerWidth - 72, e.clientX - dragRef.current.ox));
          const y = Math.max(8, Math.min(window.innerHeight - 72, e.clientY - dragRef.current.oy));
          setDragPos({ x, y });
        }}
        onPointerUp={() => { dragRef.current = null; }}
        onClick={() => {
          if (movedRef.current) { movedRef.current = false; return; }
          setOpen((value) => !value);
        }}
      >
        <Plus size={18} strokeWidth={2.4} />
        <span>Plus</span>
      </button>
      {open && (
        <div className="merveil-plus-overlay" role="dialog" aria-modal="true" aria-label="Plus">
          <button className="merveil-plus-backdrop" aria-label="Close Plus" onClick={() => setOpen(false)} />
          <section className="merveil-plus-panel" tabIndex={-1}>
            <header className="merveil-plus-header">
              <div>
                <div className="merveil-plus-eyebrow">MERVEIL</div>
                <h2>Plus</h2>
                <p>More of your city app — and doors into the wider Merveil ecosystem.</p>
              </div>
              <button type="button" className="merveil-plus-close" aria-label="Close Plus" onClick={() => setOpen(false)}>
                <X size={20} />
              </button>
            </header>

            <div className="merveil-plus-list">
              {FEATURES.map(({ label, icon: Icon, tab, newId, since }) => (
                <button
                  key={label}
                  type="button"
                  className="merveil-plus-item"
                  aria-label={plusIsNew(newId, since) ? `${label}, new` : label}
                  onClick={() => { plusDismissNew(newId); activate(label, tab); }}
                >
                  <span className="merveil-plus-icon" aria-hidden="true">
                    <Icon size={20} />
                  </span>
                  <span className="merveil-plus-label">
                    {label}
                    {plusIsNew(newId, since) ? <span aria-hidden="true"> 🆕</span> : null}
                  </span>
                  <ChevronRight size={18} className="merveil-plus-chevron" aria-hidden="true" />
                </button>
              ))}
            </div>

            <div className="merveil-plus-ecosystem">
              <div className="merveil-plus-ecosystem-label">Ecosystem</div>
              <p className="merveil-plus-ecosystem-hint">Enter another Merveil room. Same identity layer — different surface.</p>
              {ECOSYSTEM_ROOMS.map((room) => {
                const Icon = room.icon;
                return (
                  <button
                    key={room.id}
                    type="button"
                    className="merveil-plus-item merveil-plus-room"
                    onClick={() => {
                      setOpen(false);
                      enterEcosystemRoom(room, "plus");
                    }}
                  >
                    <span className="merveil-plus-icon merveil-plus-icon-room">
                      <Icon size={20} />
                    </span>
                    <span className="merveil-plus-label-stack">
                      <span className="merveil-plus-label">{room.label}</span>
                      <span className="merveil-plus-sub">{room.sub}</span>
                    </span>
                    <ChevronRight size={18} className="merveil-plus-chevron" />
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default PlusHub;
