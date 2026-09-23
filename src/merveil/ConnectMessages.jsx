/** Connect — IncomingConnectionRequests … MessagesView + Groups (from App.jsx) */

import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback, useId, Fragment } from "react";
import { deps, bindMerveilDeps } from "./deps.js";
export { bindMerveilDeps };

const merveilFetch = (...a) => deps.merveilFetch(...a);
const t = (...a) => (deps.t ? deps.t(...a) : String(a[0] || ""));
const T = new Proxy({}, { get: (_o, p) => (deps.T ? deps.T[p] : undefined) });
const Avatar = (props) => deps.Avatar(props);
const timeAgo = (...a) => deps.timeAgo(...a);
const stableMergeById = (...a) => deps.stableMergeById(...a);
const ensureRealtimeAuth = (...a) => deps.ensureRealtimeAuth?.(...a);
const supabaseBrowser = (...a) => deps.supabaseBrowser(...a);
const loadChatSettings = (...a) => deps.loadChatSettings(...a);
const saveChatSettings = (...a) => deps.saveChatSettings(...a);
const ChatEnvelopeReceipt = (props) => deps.ChatEnvelopeReceipt(props);
const CreatorProfileModal = (props) => deps.CreatorProfileModal(props);
const CitizenPassportSheet = (props) => deps.CitizenPassportSheet?.(props) ?? null;
const RealCallScreen = (props) => deps.RealCallScreen(props);
const PresenceDot = (props) => deps.PresenceDot(props);
const VirtualWindow = (props) => deps.VirtualWindow(props);
const CountBadge = (props) => deps.CountBadge?.(props) ?? null;
const formatBadgeCount = (...a) => deps.formatBadgeCount?.(...a) ?? (a[0] || 0);
const useAppBack = (...a) => deps.useAppBack(...a);
const passportCompletionOf = (...a) => deps.passportCompletionOf(...a);
const canEngage = (...a) => deps.canEngage(...a);
const canCreate = (...a) => deps.canCreate(...a);
const MerveilSeen = new Proxy({}, {
  get: (_o, p) => {
    const S = deps.MerveilSeen;
    if (!S) return undefined;
    const v = S[p];
    return typeof v === "function" ? v.bind(S) : v;
  },
});
const MerveilAiMiniMark = (props) => deps.MerveilAiMiniMark?.(props) ?? null;
const LikeButton = (props) => deps.LikeButton?.(props) ?? null;
const AnimatedEye = (props) => deps.AnimatedEye?.(props) ?? null;
const AnimatedPhone = (props) => deps.AnimatedPhone?.(props) ?? null;
const EditPropertyModal = (props) => deps.EditPropertyModal?.(props) ?? null;
const PostPropertyModal = (props) => deps.PostPropertyModal?.(props) ?? null;
const InventoryUploadFlow = (props) => deps.InventoryUploadFlow?.(props) ?? null;
const InventoryCard = (props) => deps.InventoryCard?.(props) ?? null;
const InventoryDetailView = (props) => deps.InventoryDetailView?.(props) ?? null;
const ScoreRing = (props) => deps.ScoreRing?.(props) ?? null;
const merveilScoreOf = (...a) => deps.merveilScoreOf?.(...a);
const PassportUpgradeSheet = (props) => deps.PassportUpgradeSheet?.(props) ?? null;
const passportTierOf = (...a) => deps.passportTierOf?.(...a);
const hasAccess = (...a) => deps.hasAccess?.(...a);
const SegmentedTabs = (props) => deps.SegmentedTabs?.(props) ?? null;
const sharePost = (...a) => deps.sharePost?.(...a);
const merveilPreloadWorldVideos = (...a) => deps.merveilPreloadWorldVideos?.(...a);
const merveilStartTransition = (fn) => (deps.merveilStartTransition ? deps.merveilStartTransition(fn) : (typeof fn === "function" ? fn() : undefined));
const ReportModal = (props) => deps.ReportModal?.(props) ?? null;
const CircularReel = (props) => deps.CircularReel?.(props) ?? null;
const downloadWorldToDevice = (...a) => deps.downloadWorldToDevice?.(...a);
const findMerveilSong = (...a) => deps.findMerveilSong?.(...a);
const MerveilWaveform = (props) => deps.MerveilWaveform?.(props) ?? null;
const UAEFlagStripe = (props) => deps.UAEFlagStripe?.(props) ?? null;
const isNewCitizen = (...a) => deps.isNewCitizen?.(...a);
const NewEmojiBadge = (props) => deps.NewEmojiBadge?.(props) ?? null;
const MerveilTrustBadge = (props) => deps.MerveilTrustBadge?.(props) ?? null;
const shallowSameRecord = (...a) => deps.shallowSameRecord?.(...a);

// Icon bag — any lucide name used as free identifier
function makeIcons() {
  return new Proxy({}, {
    get: (_o, name) => {
      if (name === "__esModule") return false;
      return function IconCmp(props) {
        const C = deps.icons?.[name];
        if (!C) return null;
        return React.createElement(C, props);
      };
    },
  });
}
const _icons = makeIcons();
// Bind common names expected as free identifiers (subset + Proxy fallback via with not allowed)
const {
  Building2, LayoutGrid, TrendingUp, Store, Users, BarChart3, Leaf, X, Bookmark, Heart,
  MessageCircle, Phone, Video, Share2, MoreVertical, Send, Search, Plus, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, MapPin, Eye, Star, Filter, Camera, Mic, MicOff, PhoneOff, Volume2, VolumeX,
  Play, Pause, Trash2, Edit2, Edit3, Check, CheckCheck, Clock, Bell, Settings, User, UserPlus, Home,
  Globe, Image, Film, Sparkles, Zap, Crown, Shield, Lock, Download, Upload, Link2, ExternalLink, Copy,
  Flag, AlertTriangle, Info, Loader2, RefreshCw, ArrowLeft, ArrowRight, MoreHorizontal, Paperclip,
  Smile, Inbox, Archive, Pin, Menu, Grid, List, Layers, Compass, Navigation, Briefcase, Building,
  Hotel, Key, FileText, Calendar, Gift, Award, Target, Activity, DollarSign, Percent, Wallet,
  CreditCard, ShoppingBag, ShoppingCart, Bot, Brain, Rocket, Car, Plane, Map, ThumbsUp, ThumbsDown,
  MessageSquare, PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed, VideoOff, UserCheck, UserX,
  BadgeCheck, Verified, Tag, Tags, Hash, AtSign, Wifi, WifiOff, Maximize2, Minimize2, RotateCcw,
  Save, Printer, QrCode, Hand, Handshake, Sun, Moon, Cloud, Waves, Mountain, Trees, Flame, Lightbulb,
  Package, Truck, Factory, Landmark, School, GraduationCap, Wrench, Hammer, Clipboard, ClipboardList,
  Book, BookOpen, Newspaper, Megaphone, Mail, Reply, Forward, Quote, Ban, Circle, Square, Minus,
  PlusCircle, MinusCircle, XCircle, CheckCircle, CheckCircle2, HelpCircle, AlertCircle, Coins,
  Banknote, Receipt, Calculator, Gem, Footprints, Bike, Bus, Train, Ship, Anchor, Coffee, Utensils,
  Music, Headphones, Radio, Tv, Monitor, Smartphone, Tablet, Laptop, Watch, Battery, Power, Cast,
  SkipBack, SkipForward, Repeat, Shuffle, Volume1, Clapperboard, Ticket, Locate, Route, Images,
  ImagePlus, Captions, ScreenShare, Brush, Palette, Crop, Scissors, Move, GripVertical, PanelLeft,
  PanelRight, LayoutDashboard, LayoutList, Columns, Box, Boxes, SendHorizontal, Voicemail, Sliders,
  SlidersHorizontal, ToggleLeft, ToggleRight, Aperture, Focus, Crosshair, Scan, ScanLine, ZoomIn,
  ZoomOut, Expand, Shrink, Fullscreen, Gamepad2, Puzzle, Sword, Swords, ShieldCheck, ShieldAlert,
  HeartPulse, Stethoscope, Pill, Syringe, FlaskConical, Atom, Dna, Microscope, Cpu, Keyboard,
  MousePointer, Bluetooth, Usb, Plug, Signal, Antenna, Satellite, Orbit, Sparkle, Wand2, PartyPopper,
  ChefHat, CookingPot, UtensilsCrossed, LeafyGreen, Recycle, Hospital, Ambulance, Ribbon,
} = Object.fromEntries(
  [
    "Building2","LayoutGrid","TrendingUp","Store","Users","BarChart3","Leaf","X","Bookmark","Heart",
    "MessageCircle","Phone","Video","Share2","MoreVertical","Send","Search","Plus","ChevronLeft","ChevronRight",
    "ChevronDown","ChevronUp","MapPin","Eye","Star","Filter","Camera","Mic","MicOff","PhoneOff","Volume2","VolumeX",
    "Play","Pause","Trash2","Edit2","Edit3","Check","CheckCheck","Clock","Bell","Settings","User","UserPlus","Home",
    "Globe","Image","Film","Sparkles","Zap","Crown","Shield","Lock","Download","Upload","Link2","ExternalLink","Copy",
    "Flag","AlertTriangle","Info","Loader2","RefreshCw","ArrowLeft","ArrowRight","MoreHorizontal","Paperclip",
    "Smile","Inbox","Archive","Pin","Menu","Grid","List","Layers","Compass","Navigation","Briefcase","Building",
    "Hotel","Key","FileText","Calendar","Gift","Award","Target","Activity","DollarSign","Percent","Wallet",
    "CreditCard","ShoppingBag","ShoppingCart","Bot","Brain","Rocket","Car","Plane","Map","ThumbsUp","ThumbsDown",
    "MessageSquare","PhoneCall","PhoneIncoming","PhoneOutgoing","PhoneMissed","VideoOff","UserCheck","UserX",
    "BadgeCheck","Verified","Tag","Tags","Hash","AtSign","Wifi","WifiOff","Maximize2","Minimize2","RotateCcw",
    "Save","Printer","QrCode","Hand","Handshake","Sun","Moon","Cloud","Waves","Mountain","Trees","Flame","Lightbulb",
    "Package","Truck","Factory","Landmark","School","GraduationCap","Wrench","Hammer","Clipboard","ClipboardList",
    "Book","BookOpen","Newspaper","Megaphone","Mail","Reply","Forward","Quote","Ban","Circle","Square","Minus",
    "PlusCircle","MinusCircle","XCircle","CheckCircle","CheckCircle2","HelpCircle","AlertCircle","Coins",
    "Banknote","Receipt","Calculator","Gem","Footprints","Bike","Bus","Train","Ship","Anchor","Coffee","Utensils",
    "Music","Headphones","Radio","Tv","Monitor","Smartphone","Tablet","Laptop","Watch","Battery","Power","Cast",
    "SkipBack","SkipForward","Repeat","Shuffle","Volume1","Clapperboard","Ticket","Locate","Route","Images",
    "ImagePlus","Captions","ScreenShare","Brush","Palette","Crop","Scissors","Move","GripVertical","PanelLeft",
    "PanelRight","LayoutDashboard","LayoutList","Columns","Box","Boxes","SendHorizontal","Voicemail","Sliders",
    "SlidersHorizontal","ToggleLeft","ToggleRight","Aperture","Focus","Crosshair","Scan","ScanLine","ZoomIn",
    "ZoomOut","Expand","Shrink","Fullscreen","Gamepad2","Puzzle","Sword","Swords","ShieldCheck","ShieldAlert",
    "HeartPulse","Stethoscope","Pill","Syringe","FlaskConical","Atom","Dna","Microscope","Cpu","Keyboard",
    "MousePointer","Bluetooth","Usb","Plug","Signal","Antenna","Satellite","Orbit","Sparkle","Wand2","PartyPopper",
    "ChefHat","CookingPot","UtensilsCrossed","LeafyGreen","Recycle","Hospital","Ambulance","Ribbon",
  ].map((n) => [n, _icons[n]])
);

function IncomingConnectionRequests({ currentUser, onChanged }) {
  const [requests, setRequests] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    if (!currentUser?.id) return;
    merveilFetch("/api/connections?action=list&kind=incoming")
      .then((r) => (r.ok ? r.json() : { connections: [] }))
      .then((d) => setRequests(d.connections || []))
      .catch(() => {});
  }, [currentUser?.id]);

  useEffect(() => {
    load();
    const onEvt = () => load();
    window.addEventListener("merveil:connection-changed", onEvt);
    const id = setInterval(load, 15000);
    // Realtime: connection INSERT/UPDATE for this citizen as recipient.
    // Always remove any prior channel with the same name first — React Strict Mode
    // / tab switches re-run effects; calling .on() on an already-subscribed channel throws
    // "cannot add postgres_changes callbacks after subscribe()".
    let ch = null;
    if (currentUser?.id && supabaseBrowser?.channel) {
      try {
        // Unique topic per mount — avoids "callbacks after subscribe()" when React remounts
        const topic = `connections-in-${currentUser.id}-${Math.random().toString(36).slice(2, 9)}`;
        try {
          (supabaseBrowser.getChannels?.() || []).forEach((c) => {
            const t = String(c.topic || "");
            if (t.includes(`connections-in-${currentUser.id}`)) {
              try { supabaseBrowser.removeChannel(c); } catch {}
            }
          });
        } catch {}
        ch = supabaseBrowser
          .channel(topic)
          .on("postgres_changes", {
            event: "*",
            schema: "public",
            table: "connections",
            filter: `connected_user_id=eq.${currentUser.id}`,
          }, () => {
            load();
            try { window.dispatchEvent(new CustomEvent("merveil:connection-changed")); } catch {}
          })
          .subscribe();
      } catch (e) {
        console.warn("[connections realtime]", e?.message || e);
        ch = null;
      }
    }
    return () => {
      window.removeEventListener("merveil:connection-changed", onEvt);
      clearInterval(id);
      if (ch) try { supabaseBrowser.removeChannel(ch); } catch {}
    };
  }, [load, currentUser?.id]);

  const respond = async (connectionId, accept) => {
    setBusyId(connectionId);
    try {
      const res = await merveilFetch(`/api/connections?action=${accept ? "accept" : "decline"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.connectionId !== connectionId));
        try {
          window.dispatchEvent(new CustomEvent("merveil:connection-changed"));
          window.dispatchEvent(new CustomEvent("merveil:toast", {
            detail: {
              type: accept ? "success" : "info",
              message: accept
                ? "You're connected — they were added to My Circle."
                : "Connection request declined.",
            },
          }));
        } catch {}
        onChanged?.();
      }
    } catch {}
    setBusyId(null);
  };

  if (!currentUser?.id || requests.length === 0) return null;

  return (
    <div className="px-3 pb-2">
      <div className="text-[11px] font-bold px-1 mb-1.5" style={{ color: T.sub }}>
        Connection requests ({requests.length}) — accept to add to My Circle
      </div>
      <div className="flex flex-col gap-1.5">
        {requests.map((r) => (
          <div key={r.connectionId} className="flex items-center gap-2 rounded-xl p-2" style={{ background: T.panel }}>
            {r.person.avatar_url
              ? <img src={r.person.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
              : <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "#0E9AA7" }}>{(r.person.name || "?")[0]}</div>}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate" style={{ color: T.ink }}>{r.person.name || "Merveil Citizen"}</div>
              {r.person.profession && <div className="text-[10px] truncate" style={{ color: T.sub }}>{r.person.profession}</div>}
            </div>
            <button onClick={() => respond(r.connectionId, true)} disabled={busyId === r.connectionId}
              className="text-[10px] font-semibold px-2.5 py-1.5 rounded-full" style={{ background: "#1F7A4D", color: "#fff" }}>Accept</button>
            <button onClick={() => respond(r.connectionId, false)} disabled={busyId === r.connectionId}
              className="text-[10px] font-semibold px-2.5 py-1.5 rounded-full" style={{ background: T.line, color: T.sub }}>Decline</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConnectionSuggestions({ currentUser, onOpenChat }) {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestState, setRequestState] = useState({}); // personId -> "pending" | "accepted"

  useEffect(() => {
    if (!currentUser?.id) { setLoading(false); return; }
    merveilFetch("/api/connections?action=suggestions")
      .then(r => r.ok ? r.json() : { suggestions: [] })
      .then(d => setPeople(d.suggestions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser?.id]);

  const sendRequest = async (personId) => {
    setRequestState((prev) => ({ ...prev, [personId]: "pending" }));
    const result = await requestMerveilConnection(personId);
    if (result.status === "error") {
      setRequestState((prev) => { const n = { ...prev }; delete n[personId]; return n; });
      return;
    }
    setRequestState((prev) => ({
      ...prev,
      [personId]: result.status === "accepted" || result.alreadyConnected ? "accepted" : "pending",
    }));
  };

  if (loading || people.length === 0) return null;

  return (
    <div className="px-3 pb-2">
      <div className="text-[11px] font-bold px-1 mb-1.5 flex items-center gap-1" style={{ color: T.sub }}>
        <Sparkles size={11} color="#0E9AA7"/> People to connect with
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {people.map(p => {
          const state = requestState[p.id];
          return (
            <div key={p.id} className="flex flex-col items-center gap-1 shrink-0 rounded-xl p-2 text-center" style={{ width: 84, background: T.panel }}>
              <button onClick={() => onOpenChat?.(p)} className="flex flex-col items-center gap-1">
                {p.avatar_url
                  ? <img src={p.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover"
                      style={{ border: p.account_type === "company" ? `2px solid ${T.brass}` : `2px solid #0E9AA7` }}/>
                  : <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ background: p.account_type === "company" ? T.brass : "#0E9AA7", border: "2px solid #fff", boxShadow: "0 0 0 1px " + (p.account_type === "company" ? T.brass : "#0E9AA7") }}>
                      {(p.name || "?")[0]}
                    </div>}
                <span className="text-[10px] font-semibold truncate w-full" style={{ color: T.ink }}>{p.name || "Merveil Citizen"}</span>
                <span className="text-[9px] truncate w-full" style={{ color: T.sub }}>{p.reason}</span>
              </button>
              <button onClick={() => sendRequest(p.id)} disabled={!!state}
                className="text-[9px] font-semibold px-2 py-1 rounded-full mt-0.5"
                style={{ background: state ? T.line : "#0E9AA7", color: state ? T.sub : "#fff" }}>
                {state === "accepted" ? "Connected" : state === "pending" ? "Requested" : "Connect"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// BUG FIX (Aug 2026): Connect only ever showed a person's online/busy/
// offline status if you already had a chat thread with them, or if you
// searched for them by name via the "@" new-chat box. There was no
// default view of your actual connections with live status — this adds
// one, reusing the same presence poll pattern the thread list already
// uses.
function MyConnectionsPresence({ currentUser, onOpenChat }) {
  const [people, setPeople] = useState([]);
  const [presence, setPresence] = useState({});
  const [loading, setLoading] = useState(true);

  const presenceDot = (status) => ({ online: "#1F7A4D", busy: "#0891B2", offline: T.line }[status] || T.line);

  useEffect(() => {
    if (!currentUser?.id) { setLoading(false); return; }
    let cancelled = false;
    const load = () => {
      merveilFetch("/api/connections?action=list&kind=accepted")
        .then((r) => (r.ok ? r.json() : { connections: [] }))
        .then((d) => { if (!cancelled) setPeople((d.connections || []).map((c) => c.person).filter((p) => p?.id)); })
        .catch(() => {})
        .finally(() => { if (!cancelled) setLoading(false); });
    };
    load();
    const onEvt = () => load();
    window.addEventListener("merveil:connection-changed", onEvt);
    return () => { cancelled = true; window.removeEventListener("merveil:connection-changed", onEvt); };
  }, [currentUser?.id]);

  useEffect(() => {
    const ids = people.map((p) => p.id);
    if (!ids.length) return;
    const poll = () =>
      fetch(`/api/conversations?action=presence&userIds=${ids.join(",")}`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d?.presence) setPresence(d.presence); })
        .catch(() => {});
    poll();
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, [people]);

  if (loading || people.length === 0) return null;

  return (
    <div className="px-3 pb-2">
      <div className="text-[11px] font-bold px-1 mb-1.5" style={{ color: T.sub }}>Your connections</div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {people.map((p) => {
          const status = presence[p.id] || "offline";
          return (
            <button key={p.id} onClick={() => onOpenChat?.(p)}
              className="flex flex-col items-center gap-1 shrink-0 rounded-xl p-2 text-center" style={{ width: 72, background: T.panel }}>
              <div className="relative">
                {p.avatar_url
                  ? <img src={p.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                  : <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: T.navy }}>
                      {(p.name || "?")[0]}
                    </div>}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2" style={{ background: presenceDot(status), borderColor: T.panel }} />
              </div>
              <span className="text-[10px] font-semibold truncate w-full" style={{ color: T.ink }}>{p.name || "Merveil Citizen"}</span>
              <span className="text-[9px] capitalize" style={{ color: T.sub }}>{status}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// CONNECT V1 — Citizens / My Circle / Messages
// Dedicated visual identity for Connect only (deliberately not T.signal
// orange — Connect gets its own accent per the V1 spec). Applied to the
// new Citizens + My Circle surfaces now; the existing conversation/thread
// UI keeps T tokens for this pass and gets folded into CT in the later
// visual-unification step so we don't rewrite proven messaging/call code
// in the same pass as the realtime + structural changes.
// ---------------------------------------------------------------
const CT = {
  // LOCKED — cream luxury + blue online + soft glass (Connect + Call)
  bg: "#F3EDE4",
  panel: "#FFFBF6",
  panelHover: "#EDE6DB",
  line: "rgba(45, 38, 32, 0.10)",
  ink: "#1A1612",
  sub: "#6B6158",
  accent: "#C4A574",
  online: "#1D6FBF",
  busy: "#C4841D",
  offline: "#9A9086",
  chatBg: "linear-gradient(180deg, #F7F1E8 0%, #F0E9DF 50%, #E8E0D4 100%)",
  bubbleMine: "linear-gradient(135deg, #1D6FBF 0%, #155A9C 100%)",
  bubbleOther: "#FFFBF6",
  headerBg: "#EDE6DB",
  brand: "#0E9AA7",
  // Light liquid glass on cream
  glass: "rgba(255, 251, 246, 0.72)",
  glassBorder: "rgba(45, 38, 32, 0.10)",
  glassHighlight: "rgba(255, 255, 255, 0.65)",
  glassBlur: "blur(14px) saturate(140%)",
  glassShadow: "0 6px 24px rgba(45,38,32,0.08), inset 0 1px 0 rgba(255,255,255,0.7)",
};
/** Soft haptic — vibration when supported; no-op otherwise */
function merveilHaptic(kind = "light") {
  try {
    if (typeof navigator === "undefined" || !navigator.vibrate) return;
    if (kind === "success") navigator.vibrate([12, 40, 18]);
    else if (kind === "call") navigator.vibrate([20, 30, 20, 30, 40]);
    else if (kind === "select") navigator.vibrate(10);
    else navigator.vibrate(8);
  } catch {}
}
/** Shared liquid-glass chip style (presence, call HUD) */
function glassChipStyle(extra = {}) {
  return {
    background: CT.glass,
    backdropFilter: CT.glassBlur,
    WebkitBackdropFilter: CT.glassBlur,
    border: `1px solid ${CT.glassBorder}`,
    boxShadow: CT.glassShadow,
    ...extra,
  };
}


function connectPresenceDot(status) {
  return PRESENCE_COLORS[status] || PRESENCE_COLORS.offline;
}

// Unfiltered presence: no id allow-list. `presence` SELECT RLS is public
// (`true`) by design, so every citizen's status is meant to be visible —
// this is what lets a brand-new signup appear in Citizens/Online the
// instant their heartbeat lands, not just citizens this client already
// knew about. Requires `presence` to be in the supabase_realtime
// publication (added via the enable_realtime_connect_v1 migration).
function useUnfilteredPresence(currentUser) {
  const [presenceMap, setPresenceMap] = useState({});
  const knownIdsRef = useRef(new Set());

  useEffect(() => {
    if (!currentUser?.id) return;
    let cancelled = false;
    // No UI time limits (no 4min/hour/day hold). While this session is open the
    // Realtime channel stays subscribed; status is whatever the server reports.
    // List order does NOT depend on status — only the green/grey dot does.
    const normalize = (row) => {
      if (!row?.user_id) return null;
      const st = String(row.status || "online").toLowerCase();
      // Trust row if it has a recent updated_at; otherwise still accept explicit status
      // from live postgres_changes (always fresh on the wire).
      let status = "offline";
      if (st === "busy") status = "busy";
      else if (st !== "offline" && st !== "away") status = "online";
      // If updated_at is ancient (client closed long ago), force offline
      if (row.updated_at) {
        const age = Date.now() - new Date(row.updated_at).getTime();
        // Server heartbeat window is the only expiry — mirrors "they're connected or not"
        if (age > 5 * 60 * 1000) status = "offline";
      }
      return { userId: String(row.user_id), status };
    };
    const patchPresence = (userId, status) => {
      const st = String(status || "offline").toLowerCase();
      const next = st === "busy" ? "busy" : (st === "online" ? "online" : "offline");
      setPresenceMap((prev) => {
        if (prev[userId] === next) return prev;
        return { ...prev, [userId]: next };
      });
    };
    let channel = null;
    try {
      const topic = `presence-citizens-${currentUser.id}-${Math.random().toString(36).slice(2, 9)}`;
      try {
        (supabaseBrowser.getChannels?.() || []).forEach((c) => {
          const t = String(c.topic || "");
          if (t.includes(`presence-citizens-${currentUser.id}`)) {
            try { supabaseBrowser.removeChannel(c); } catch {}
          }
        });
      } catch {}
      channel = supabaseBrowser
        .channel(topic)
        .on("postgres_changes", { event: "*", schema: "public", table: "presence" }, (payload) => {
          if (cancelled) return;
          const row = payload.new || payload.old;
          if (!row?.user_id) return;
          knownIdsRef.current.add(String(row.user_id));
          if (payload.eventType === "DELETE") {
            patchPresence(String(row.user_id), "offline");
            return;
          }
          const n = normalize(payload.new);
          if (n) patchPresence(n.userId, n.status);
        })
        .subscribe();
    } catch (e) {
      console.warn("[presence realtime]", e?.message || e);
    }

    // Polling safety-net: every 20s (Realtime is primary). Seeded by directory.
    const poll = () => {
      if (cancelled) return;
      const ids = [...knownIdsRef.current];
      if (!ids.includes(String(currentUser.id))) ids.push(String(currentUser.id));
      if (!ids.length) return;
      const chunk = ids.slice(0, 120);
      fetch(`/api/conversations?action=presence&userIds=${chunk.join(",")}`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (cancelled || !d?.presence) return;
          setPresenceMap((prev) => {
            let changed = false;
            const next = { ...prev };
            for (const [id, st] of Object.entries(d.presence)) {
              const s = String(st || "offline").toLowerCase();
              const held = s === "busy" ? "busy" : (s === "online" ? "online" : "offline");
              if (next[id] !== held) { next[id] = held; changed = true; }
            }
            return changed ? next : prev;
          });
        })
        .catch(() => {});
    };
    const onSeed = (ev) => {
      const ids = ev?.detail?.ids || [];
      ids.forEach((id) => knownIdsRef.current.add(String(id)));
      poll();
    };
    window.addEventListener("merveil:presence-seed", onSeed);
    const onVis = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVis);
    const pollId = setInterval(poll, 20000);
    // Initial seed after a short delay so first realtime events land first
    const seed = setTimeout(poll, 800);

    return () => {
      cancelled = true;
      clearInterval(pollId);
      clearTimeout(seed);
      window.removeEventListener("merveil:presence-seed", onSeed);
      document.removeEventListener("visibilitychange", onVis);
      try { channel?.unsubscribe(); } catch {}
    };
  }, [currentUser?.id]);

  return presenceMap;
}

async function initiateCitizenCall(user, mode) {
  if (!user?.id) { alert("Can't call — missing user."); return; }
  try {
    merveilHaptic("call");
    const at = Date.now();
    ContactClock.bump(user.id, at);
    window.dispatchEvent(new CustomEvent("merveil:contact-bump", {
      detail: { userId: String(user.id), at },
    }));
  } catch {}
  const tryCreate = async () => {
    const res = await merveilFetch("/api/calls?action=create", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: user.id, type: mode || "voice" }),
    });
    const data = await res.json().catch(() => null);
    return { res, data };
  };
  try {
    // Hard session restore before create (handles refresh races + cookie lag).
    try {
      const sess = await fetch("/api/auth/session", { credentials: "include", cache: "no-store" });
      if (sess.ok) {
        const body = await sess.json().catch(() => null);
        if (body?.user?.id) {
          try { window.dispatchEvent(new CustomEvent("merveil:session-user", { detail: body.user })); } catch {}
        }
      }
    } catch {}
    let { res, data } = await tryCreate();
    if (!res.ok && /sign in|auth|session|authentication/i.test(String(data?.error || ""))) {
      try {
        await fetch("/api/auth/session", { credentials: "include", cache: "no-store" });
      } catch {}
      await new Promise((r) => setTimeout(r, 500));
      ({ res, data } = await tryCreate());
    }
    if (!res.ok) {
      const raw = String(data?.error || "");
      const friendly = /sign in|auth|session|authentication/i.test(raw)
        ? "Session expired — open Passport or pull to refresh, then try the call again."
        : (raw || "Couldn't start the call. Check your connection and try again.");
      alert(friendly);
      return;
    }
    if (!data?.call?.id) {
      alert("Call created but no call id returned.");
      return;
    }
    // WhatsApp-style: called person rises to top immediately (Citizens / Circle / Messages)
    try {
      const at = Date.now();
      ContactClock.bump(user.id, at);
      window.dispatchEvent(new CustomEvent("merveil:contact-bump", {
        detail: { userId: String(user.id), at },
      }));
      // Optimistic call line in Messages list (server also writes on end/miss)
      const callLabel = (mode || "voice") === "video" ? "📹 Outgoing video call" : "📞 Outgoing call";
      window.dispatchEvent(new CustomEvent("merveil:call-thread-hint", {
        detail: {
          otherUserId: String(user.id),
          last_body: callLabel,
          at: new Date().toISOString(),
        },
      }));
    } catch {}
    window.dispatchEvent(new CustomEvent("merveil:start-call", {
      detail: {
        callId: data.call.id,
        mode: mode || "voice",
        otherName: user.name || user.full_name || "Merveil Citizen",
        otherId: user.id,
        otherAvatar: user.avatar_url || user.avatarUrl || null,
      },
    }));
  } catch (e) {
    alert(`Couldn't start the call — ${e.message || "check your connection."}`);
  }
}

function CitizenRowImpl({ user, status, onMessage, onCall, onProfile }) {
  const trusted = user.passport_tier === "professional" || user.passport_tier === "investor" || user.passport_tier === "company";
  const live = status === "online" || status === "busy";
  // Shared clock so Citizens / Circle / Messages never disagree after a call
  const contactIso = ContactClock.maxIso(
    user.id,
    user.lastContactAt,
    user.last_contact_at,
    user.last_message_at,
    user.last_seen_at
  );
  const contactLabel = contactIso ? timeAgo(contactIso) : "";
  const statusLabel = status === "online" ? "Online now" : status === "busy" ? "Busy" : (user.role_label || "Away");
  return (
    <div
      className="flex items-center gap-3 mx-2 px-2.5 py-3 rounded-2xl transition-colors"
      style={{
        background: live
          ? "linear-gradient(135deg, #FFFFFF 0%, #F7F1E8 100%)"
          : "linear-gradient(180deg, #FFFBF6 0%, #F5EFE6 100%)",
        minHeight: 56,
        border: `1px solid ${live ? "rgba(29,111,191,0.28)" : CT.line}`,
        boxShadow: live
          ? "0 4px 16px rgba(29,111,191,0.10), inset 0 1px 0 rgba(255,255,255,0.9)"
          : "0 2px 10px rgba(45,38,32,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
        marginBottom: 6,
      }}
      role="listitem"
    >
      <button type="button" onClick={() => onProfile(user.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left" aria-label={`${user.name || "Citizen"}, ${statusLabel}`}>
        <div className="relative shrink-0">
          {user.avatar_url
            ? <img src={user.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" style={{ border: `2px solid ${live ? "rgba(29,111,191,0.55)" : CT.line}` }} />
            : <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: "linear-gradient(145deg,#0E9AA7,#0A7A85)", color: "#fff", border: `2px solid ${live ? "rgba(29,111,191,0.55)" : CT.line}` }}>
                {(user.name || "?").slice(0, 1).toUpperCase()}
              </div>}
          <span className="absolute -bottom-0.5 -right-0.5" style={{ lineHeight: 0 }}>
            <PresenceDot status={status} size={14} />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-bold truncate" style={{
              color: CT.ink,
              fontFamily: "'Space Grotesk',sans-serif",
              letterSpacing: "-0.02em",
              textShadow: "0 1px 0 rgba(255,255,255,0.55), 0 1px 2px rgba(26,24,22,0.06)",
            }}>
              {user.name || "Merveil Citizen"}
            </span>
            <NewEmojiBadge show={isNewCitizen(user)} />
            {trusted && <BadgeCheck size={14} style={{ color: CT.accent }} aria-label="Verified" />}
          </div>
          <div className="text-[12px] truncate flex items-center gap-1.5 mt-0.5" style={{ color: CT.sub }}>
            <span className="inline-flex items-center gap-1 font-semibold" style={{ color: live ? CT.online : CT.offline }}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: connectPresenceDot(status), boxShadow: live ? `0 0 6px ${connectPresenceDot(status)}` : "none" }} />
              {statusLabel}
            </span>
            {user.role_label && status === "online" ? ` · ${user.role_label}` : ""}
          </div>
        </div>
        {contactLabel && (
          <span className="text-[11px] tabular-nums shrink-0 ml-1 font-medium" style={{ color: live ? CT.accent : CT.sub }}>{contactLabel}</span>
        )}
      </button>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onCall(user, "voice")}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: CT.panel, border: `1px solid ${CT.line}` }}
          aria-label="Voice call"
        >
          <Phone size={14} style={{ color: CT.ink }} />
        </button>
        <button
          type="button"
          onClick={() => onMessage(user)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: CT.accent, boxShadow: "0 0 12px rgba(129,140,248,0.35)" }}
          aria-label="Message"
        >
          <MessageCircle size={14} style={{ color: "#0B0E14" }} />
        </button>
      </div>
    </div>
  );
}

// CITIZENS — everyone registered in Merveil. No friendship/follow gate.
// Presence determines WHERE a citizen appears (Online vs Offline), never
// WHETHER they appear.
const CitizenRow = React.memo(CitizenRowImpl);

function CitizensTab({ currentUser, presenceMap, onMessage, onCall, onProfile }) {
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const knownIdsRef = useRef(new Set());

  useEffect(() => {
    if (!currentUser?.id) return;
    let cancelled = false;
    let first = true;
    let emptyRetries = 0;
    const load = async () => {
      try {
        // Soft session keep so directory is not empty after cookie lag
        try { await fetch("/api/auth/session", { credentials: "include", cache: "no-store" }); } catch {}
        const r = await merveilFetch(`/api/conversations?action=directory`);
        const data = r.ok ? await r.json().catch(() => null) : null;
        if (cancelled) return;
        if (!data?.users) {
          if (first) setLoading(false);
          // Identity race: server returned no payload — retry soon without sign-out
          if (emptyRetries < 4) {
            emptyRetries += 1;
            setTimeout(() => { if (!cancelled) load(); }, 800 * emptyRetries);
          }
          return;
        }
        const users = data.users.map((u) => {
          const { status, ...rest } = u;
          return rest;
        });
        // Empty array with signed-in user is almost always session lag — retry
        if (users.length === 0 && emptyRetries < 4) {
          emptyRetries += 1;
          if (first) setLoading(false);
          setTimeout(() => { if (!cancelled) load(); }, 800 * emptyRetries);
          return;
        }
        emptyRetries = 0;
        setCitizens((prev) => stableMergeById(prev, users));
        knownIdsRef.current = new Set(users.map((u) => String(u.id)));
        try {
          window.dispatchEvent(new CustomEvent("merveil:presence-seed", {
            detail: { ids: users.map((u) => String(u.id)) },
          }));
        } catch {}
      } catch {}
      finally {
        if (!cancelled && first) { first = false; setLoading(false); }
      }
    };
    load();
    const onConn = () => load();
    const onBump = (e) => {
      const uid = String(e?.detail?.userId || "");
      const at = Number(e?.detail?.at) || Date.now();
      if (!uid) return;
      ContactClock.bump(uid, at);
      setCitizens((prev) => prev.map((u) =>
        String(u.id) === uid
          ? { ...u, contactRank: 1, lastContactAt: at, last_message_at: new Date(at).toISOString() }
          : u
      ));
    };
    window.addEventListener("merveil:connection-changed", onConn);
    window.addEventListener("merveil:contact-bump", onBump);
    const id = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener("merveil:connection-changed", onConn);
      window.removeEventListener("merveil:contact-bump", onBump);
    };
  }, [currentUser?.id]);

  // A presence event for an id we haven't fetched yet (brand-new signup)
  // — fetch just that profile via the existing column-scoped endpoint
  // and fold them in, instead of waiting for a manual refresh.
  useEffect(() => {
    const unknown = Object.keys(presenceMap).filter(
      (id) => !knownIdsRef.current.has(String(id)) && String(id) !== String(currentUser?.id)
    );
    if (!unknown.length) return;
    unknown.forEach((id) => knownIdsRef.current.add(String(id)));
    fetch(`/api/conversations?action=profiles&ids=${unknown.join(",")}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.profiles) return;
        setCitizens((prev) => {
          const next = [...prev];
          for (const id of unknown) {
            const p = data.profiles[id];
            if (p) next.push({ id, name: p.name, avatar_url: p.avatar_url, role_label: null, passport_tier: null });
          }
          return next;
        });
      })
      .catch(() => {});
  }, [presenceMap, currentUser?.id]);

  // Forever-stable order while you are in the session: contact rank + name only.
  // Presence never reorders the list — it only updates the status dot (Facebook-style).
  const rowCacheRef = useRef(new Map());
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = citizens
      .filter((u) => String(u.id) !== String(currentUser?.id))
      .map((u) => {
        const id = String(u.id);
        const liveStatus = presenceMap[id] || presenceMap[u.id] || "offline";
        const prev = rowCacheRef.current.get(id);
        if (
          prev
          && prev.status === liveStatus
          && prev.name === u.name
          && prev.avatar_url === u.avatar_url
          && (prev.contactRank || 0) === (u.contactRank || 0)
          && (prev.lastContactAt || 0) === (u.lastContactAt || 0)
        ) {
          return prev;
        }
        const next = { ...u, status: liveStatus };
        rowCacheRef.current.set(id, next);
        return next;
      });
    if (q) list = list.filter((u) => (u.name || "").toLowerCase().includes(q));
    list.sort((a, b) => {
      if ((b.contactRank || 0) !== (a.contactRank || 0)) return (b.contactRank || 0) - (a.contactRank || 0);
      if ((a.contactRank || 0) > 0 && (b.lastContactAt || 0) !== (a.lastContactAt || 0)) {
        return (b.lastContactAt || 0) - (a.lastContactAt || 0);
      }
      return (a.name || "").localeCompare(b.name || "");
    });
    return list;
  }, [citizens, presenceMap, query, currentUser?.id]);

  // Optional labels only — same order as rows (no Online/Away reshuffle)
  const online = rows.filter((r) => r.status === "online" || r.status === "busy");
  const offline = rows.filter((r) => r.status !== "online" && r.status !== "busy");

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: CT.bg }}>
      <div className="px-3 pt-2 pb-2 shrink-0">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the network…"
          className="w-full text-sm px-3.5 py-2.5 rounded-xl outline-none"
          style={{
            background: "rgba(255,251,246,0.9)",
            backdropFilter: CT.glassBlur,
            WebkitBackdropFilter: CT.glassBlur,
            color: CT.ink,
            border: `1px solid ${CT.line}`,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 2px 8px rgba(45,38,32,0.04)",
          }}
        />
      </div>
      <div className="overflow-y-auto flex-1 min-h-0" style={{ paddingBottom: "calc(var(--nav-h) + var(--safe-bottom) + 24px)" }}>
        {loading && <div className="px-4 py-6 text-xs" style={{ color: CT.sub }}>{t("connect.scanning")}</div>}
        {!loading && rows.length === 0 && (
          <div className="px-4 py-6 text-xs text-center" style={{ color: CT.sub }}>
            {query.trim() ? t("connect.noMatch") : "No citizens loaded yet — pull to refresh or check back shortly."}
          </div>
        )}
        {(() => {
          const connected = rows.filter((r) => (r.contactRank || 0) > 0);
          const rest = rows.filter((r) => !(r.contactRank > 0));
          const Section = ({ label, count, accent }) => (
            <div className="px-4 pt-3 pb-1.5 flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-[0.16em] uppercase" style={{ color: accent || CT.sub }}>{label}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(196,165,116,0.18)", color: CT.accent }}>{count}</span>
              <div className="flex-1 h-px" style={{ background: CT.line }} />
            </div>
          );
          return (
            <>
              {connected.length > 0 && (
                <>
                  <Section label={t("connect.inContact")} count={connected.length} accent={CT.accent} />
                  {connected.map((u) => (
                    <CitizenRow key={u.id} user={u} status={u.status} onMessage={onMessage} onCall={onCall} onProfile={onProfile} />
                  ))}
                </>
              )}
              {rest.length > 0 && (
                <>
                  <Section label={t("connect.network") || "Network"} count={rest.length} />
                  {rest.length > 40 ? (
                    <VirtualWindow
                      items={rest}
                      itemHeight={72}
                      overscan={10}
                      style={{ maxHeight: "min(70vh, 640px)" }}
                      getKey={(u) => u.id}
                      renderItem={(u) => (
                        <CitizenRow user={u} status={u.status} onMessage={onMessage} onCall={onCall} onProfile={onProfile} />
                      )}
                    />
                  ) : (
                    rest.map((u) => (
                      <CitizenRow key={u.id} user={u} status={u.status} onMessage={onMessage} onCall={onCall} onProfile={onProfile} />
                    ))
                  )}
                </>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}

// MY CIRCLE — people the citizen has actually connected with. Distinct
// data source from Citizens (connections, not the full directory).
function MyCircleTab({ currentUser, connectionPeople, presenceMap, onMessage, onCall, onProfile }) {
  // Re-render when ContactClock bumps so Circle times match Citizens/Messages
  const [, setClockTick] = useState(0);
  useEffect(() => ContactClock.subscribe(() => setClockTick((t) => t + 1)), []);
  const rows = useMemo(() => {
    const list = connectionPeople.map((p) => {
      const status = presenceMap[p.id] || p.status || "offline";
      const lastContactAt = contactTs(
        ContactClock.get(p.id),
        p.lastContactAt,
        p.last_contact_at,
        p.last_message_at,
        p.last_seen_at
      );
      return { ...p, status, lastContactAt: lastContactAt || p.lastContactAt };
    });
    list.sort((a, b) => {
      const ta = contactTs(a.lastContactAt, ContactClock.get(a.id));
      const tb = contactTs(b.lastContactAt, ContactClock.get(b.id));
      if (tb !== ta) return tb - ta;
      return (a.name || "").localeCompare(b.name || "");
    });
    return list;
  }, [connectionPeople, presenceMap]);

  const online = rows.filter((r) => r.status === "online" || r.status === "busy");
  const offline = rows.filter((r) => r.status === "offline");

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: CT.bg }}>
      <div className="overflow-y-auto flex-1 min-h-0 pt-2" style={{ paddingBottom: "calc(var(--nav-h) + var(--safe-bottom) + 24px)" }}>
        {rows.length === 0 && (
          <div className="px-6 py-10 text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: "rgba(129,140,248,0.12)", border: "1px solid rgba(129,140,248,0.25)" }}>
              <Users size={22} style={{ color: CT.accent }} />
            </div>
            <div className="text-sm font-bold mb-1" style={{ color: CT.ink, fontFamily: "'Space Grotesk',sans-serif" }}>Your circle is empty</div>
            <div className="text-xs" style={{ color: CT.sub }}>
              Connect with citizens to build a trusted network. Accepted connections land here.
            </div>
          </div>
        )}
        {online.length > 0 && (
          <div className="px-4 pb-1.5 flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-[0.16em] uppercase" style={{ color: CT.online }}>Live in circle</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(6,182,212,0.10)", color: CT.sub }}>{online.length}</span>
            <div className="flex-1 h-px" style={{ background: CT.line }} />
          </div>
        )}
        {online.map((u) => <CitizenRow key={u.id} user={u} status={u.status} onMessage={onMessage} onCall={onCall} onProfile={onProfile} />)}
        {offline.length > 0 && (
          <div className="px-4 pt-3 pb-1.5 flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-[0.16em] uppercase" style={{ color: CT.sub }}>Away</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(6,182,212,0.10)", color: CT.sub }}>{offline.length}</span>
            <div className="flex-1 h-px" style={{ background: CT.line }} />
          </div>
        )}
        {offline.map((u) => <CitizenRow key={u.id} user={u} status={u.status} onMessage={onMessage} onCall={onCall} onProfile={onProfile} />)}
      </div>
    </div>
  );
}


// ============================================================
// AREA GROUPS — public Emirates RE lead channels (WhatsApp-style)
// ============================================================

function TopGroupPostersStrip() {
  const [leaders, setLeaders] = useState([]);
  useEffect(() => {
    merveilFetch("/api/groups?action=leaderboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setLeaders(d?.leaders || []))
      .catch(() => {});
  }, []);
  if (!leaders.length) return null;
  return (
    <div className="mt-2 rounded-xl border p-2.5" style={{ borderColor: "rgba(0,0,0,0.06)", background: "#fff" }}>
      <div className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "#8A7B6C" }}>
        Top real-lead posters · boost credits
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {leaders.slice(0, 8).map((u, i) => (
          <div key={u.user_id} className="shrink-0 flex flex-col items-center w-14">
            <div className="relative">
              <Avatar name={u.name} src={u.avatar_url} size={36} />
              <span className="absolute -top-1 -right-1 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center text-white"
                style={{ background: i < 3 ? "#0E9AA7" : "#8A7B6C" }}>{i + 1}</span>
            </div>
            <div className="text-[9px] font-semibold truncate w-full text-center mt-0.5" style={{ color: "#1A1612" }}>{u.name}</div>
            <div className="text-[8px]" style={{ color: "#8A7B6C" }}>{u.real_leads || 0} leads</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AreaGroupsView({ currentUser, onSignIn, onMessage, onCall, onProfile }) {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emirate, setEmirate] = useState(null);
  const [area, setArea] = useState(null);
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postLoading, setPostLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [mediaUrls, setMediaUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const fileRef = useRef(null);
  const textareaRef = useRef(null);

  const insertEmoji = (emoji) => {
    const el = textareaRef.current;
    const sym = typeof emoji === "string" ? emoji : (emoji?.e || "");
    if (!sym) return;
    if (el && typeof el.selectionStart === "number") {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = draft.slice(0, start) + sym + draft.slice(end);
      setDraft(next);
      requestAnimationFrame(() => {
        try {
          el.focus();
          const pos = start + sym.length;
          el.setSelectionRange(pos, pos);
          el.style.height = "auto";
          el.style.height = Math.min(el.scrollHeight, 120) + "px";
        } catch {}
      });
    } else {
      setDraft((d) => d + sym);
    }
  };

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById("merveil-uae-flag-css")) return;
    const st = document.createElement("style");
    st.id = "merveil-uae-flag-css";
    st.textContent = `
      @keyframes merveilUaeWave {
        0% { background-position: 0% 0; }
        100% { background-position: 200% 0; }
      }
      @keyframes merveilFlagFloat {
        0%, 100% { transform: translateY(0) rotate(-4deg); opacity: 0.3; }
        50% { transform: translateY(-14px) rotate(5deg); opacity: 0.75; }
      }
    `;
    document.head.appendChild(st);
  }, []);

  const loadCatalog = useCallback(() => {
    setLoading(true);
    merveilFetch("/api/groups?action=catalog")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const ems = d?.emirates || [];
        setCatalog(ems);
        if (d?.note) setNote(d.note);
        try {
          const total = ems.reduce((n, em) => n + (em.areas || []).reduce((a, ar) => a + (ar.unread_count || 0), 0), 0);
          window.dispatchEvent(new CustomEvent("merveil:group-unread", { detail: { total } }));
        } catch {}
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadCatalog(); }, [loadCatalog]);

  // Open specific group+post from shared link
  useEffect(() => {
    const openFromDetail = async (groupId, postId) => {
      if (!groupId) return;
      try {
        // Prefer catalog entry; else minimal object
        let g = null;
        for (const em of catalog || []) {
          for (const ar of em.areas || []) {
            const hit = (ar.groups || []).find((x) => String(x.id) === String(groupId));
            if (hit) { g = hit; break; }
          }
          if (g) break;
        }
        if (!g) g = { id: groupId, title: "Group", area: "", emirate: "", i_member: false };
        await openGroup(g, { forceJoin: false });
        if (postId) {
          setTimeout(() => {
            try {
              const el = document.querySelector(`[data-group-post-id="${postId}"]`);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            } catch {}
          }, 600);
        }
      } catch (e) {
        console.warn("[open-group]", e);
      }
    };
    const onOpen = (e) => {
      const { groupId, postId } = e?.detail || {};
      openFromDetail(groupId, postId);
    };
    window.addEventListener("merveil:open-group", onOpen);
    const pending = window.__merveilPendingGroup;
    if (pending?.groupId) {
      window.__merveilPendingGroup = null;
      // Wait catalog if empty
      const t = setTimeout(() => openFromDetail(pending.groupId, pending.postId), catalog?.length ? 100 : 800);
      return () => {
        clearTimeout(t);
        window.removeEventListener("merveil:open-group", onOpen);
      };
    }
    return () => window.removeEventListener("merveil:open-group", onOpen);
  }, [catalog, currentUser?.id]);


  // Explore = open + load posts without join. Enter = join then member mode.
  const openGroup = async (g, { forceJoin = false } = {}) => {
    if (forceJoin && !currentUser?.id) { onSignIn?.(); return; }
    setGroup({ ...g, i_member: !!g.i_member });
    setPostLoading(true);
    setPosts([]);
    setNote("");
    try {
      if (forceJoin) {
        const j = await merveilFetch(`/api/groups/${g.id}?action=join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        if (!j.ok) {
          const err = await j.json().catch(() => ({}));
          throw new Error(err.error || "Could not enter group");
        }
      }
      const res = await merveilFetch(`/api/groups/${g.id}?action=posts`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not load posts");
      setPosts(data.posts || []);
      const merged = data.group || g;
      setGroup({
        ...merged,
        i_member: forceJoin ? true : !!merged.i_member,
      });
    } catch (e) {
      setNote(e.message || "Couldn't open group");
    } finally {
      setPostLoading(false);
    }
  };

  const leaveGroup = async () => {
    if (!group?.id) return;
    try {
      await merveilFetch(`/api/groups/${group.id}?action=leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      setGroup((g) => (g ? { ...g, i_member: false } : g));
      loadCatalog();
    } catch {
      setNote("Could not leave group");
    }
  };

  const uploadMedia = async (file) => {
    if (!file) return;
    if (mediaUrls.length >= 8) {
      setNote("Max 8 HD photos or clips per lead.");
      return;
    }
    setUploading(true);
    setNote("");
    try {
      const isVideo = String(file.type || "").startsWith("video/");
      const isImage = String(file.type || "").startsWith("image/");
      if (isVideo) {
        const dur = await new Promise((resolve) => {
          const v = document.createElement("video");
          v.preload = "metadata";
          v.onloadedmetadata = () => {
            const d = v.duration;
            URL.revokeObjectURL(v.src);
            resolve(d);
          };
          v.onerror = () => resolve(0);
          v.src = URL.createObjectURL(file);
        });
        if (dur > 60.5) {
          throw new Error("Video max 60 seconds (HD). Trim shorter, then re-upload.");
        }
        if (file.size < 200 * 1024) {
          throw new Error("Video looks too low quality — upload HD (or ask Merveil AI to enhance with boost credits).");
        }
      }
      if (isImage) {
        const dims = await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            resolve({ w: img.naturalWidth, h: img.naturalHeight });
            URL.revokeObjectURL(img.src);
          };
          img.onerror = () => resolve({ w: 0, h: 0 });
          img.src = URL.createObjectURL(file);
        });
        if (dims.w > 0 && dims.w < 720 && dims.h < 720) {
          throw new Error("Only HD photos (min ~720px). Ask Merveil AI to enhance with boost credits, or pick a sharper photo.");
        }
      }
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "group-leads");
      const res = await fetch("/api/people?action=upload", { method: "POST", credentials: "include", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        if (data.code === "HD_REQUIRED" && data.enhance_available) {
          throw new Error((data.error || "HD required") + " — Merveil AI enhance uses boost credits or Passport.");
        }
        throw new Error(data.error || "Upload failed");
      }
      setMediaUrls((u) => [...u, data.url].slice(0, 8));
    } catch (e) {
      setNote(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const publishLead = async () => {
    if (!group?.id || posting) return;
    const text = draft.trim();
    if (!text && !mediaUrls.length) return;
    if (!currentUser?.id) { onSignIn?.(); return; }
    if (!group.i_member) {
      setNote("Enter the group first to post a lead.");
      return;
    }
    setPosting(true);
    setNote("");
    try {
      const res = await merveilFetch(`/api/groups/${group.id}?action=post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text, mediaUrls }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't post — try again");
      if (data.hidden) {
        setNote(data.warning || "Lead hidden by Merveil AI.");
        setDraft("");
        setMediaUrls([]);
        return;
      }
      if (data.warning) setNote(data.warning);
      if (data.passport_reminder) setNote(data.passport_reminder);
      else if (data.pulse_bridged) setNote("Also live on Pulse Discover — open Pulse to refine the listing.");
      setDraft("");
      setMediaUrls([]);
      if (data.post) {
        setPosts((prev) => [{
          ...data.post,
          author: { id: currentUser.id, name: currentUser.name, avatar_url: currentUser.avatar_url },
          author_status: "online",
          is_mine: true,
          i_supered: false,
        }, ...prev]);
      } else {
        const reload = await merveilFetch(`/api/groups/${group.id}?action=posts`);
        const rd = await reload.json().catch(() => ({}));
        setPosts(rd.posts || []);
      }
    } catch (e) {
      setNote(e.message || "Post failed");
    } finally {
      setPosting(false);
    }
  };

  const superPost = async (post) => {
    if (!currentUser?.id) { onSignIn?.(); return; }
    if (!group?.i_member) { setNote("Enter the group to Super a lead."); return; }
    const was = post.i_supered;
    setPosts((prev) => prev.map((p) => p.id === post.id
      ? { ...p, i_supered: !was, super_count: Math.max(0, (p.super_count || 0) + (was ? -1 : 1)) }
      : p));
    try {
      const res = await merveilFetch(`/api/groups/${group.id}?action=super`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.super_count != null) {
        setPosts((prev) => prev.map((p) => p.id === post.id
          ? { ...p, i_supered: !!data.supered, super_count: data.super_count }
          : p));
      }
    } catch {}
  };

  const deletePost = async (post) => {
    if (!window.confirm("Delete this lead?")) return;
    try {
      const res = await merveilFetch(`/api/groups/${group.id}?action=delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Delete failed");
      }
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch (e) {
      setNote(e.message || "Delete failed");
    }
  };

  const saveEdit = async (post) => {
    const body = editText.trim();
    if (!body) return;
    try {
      const res = await merveilFetch(`/api/groups/${group.id}?action=edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Edit failed");
      setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, body } : p));
      setEditingId(null);
    } catch (e) {
      setNote(e.message || "Edit failed");
    }
  };

  const sharePost = async (post) => {
    // Short OG URL → WhatsApp shows photo + "Merveil AI" title (not the long query string)
    const origin = window.location.origin;
    const url = `${origin}/api/share?type=group&id=${encodeURIComponent(post.id)}`;
    const line = String(post.body || "Lead on Merveil").split("\n").map((l) => l.trim()).filter(Boolean)[0] || "Lead on Merveil";
    const text = line.slice(0, 100);
    try {
      if (typeof shareMerveilContent === "function") {
        const media = Array.isArray(post.media_urls) ? post.media_urls : [];
        const imageUrl = media.find((u) => u && !String(u).match(/\.(mp4|webm|mov)(\?|$)/i)) || null;
        await shareMerveilContent({ title: "Merveil AI", text, url, imageUrl });
      } else if (navigator.share) {
        await navigator.share({ title: "Merveil AI", text, url });
      } else {
        await navigator.clipboard?.writeText(`${text}\n${url}`);
        setNote("Link copied");
        setTimeout(() => setNote(""), 2000);
      }
    } catch (e) {
      if (e?.name !== "AbortError") {
        try {
          await navigator.clipboard?.writeText(`${text}\n${url}`);
          setNote("Link copied");
          setTimeout(() => setNote(""), 2000);
        } catch {}
      }
    }
  };

  const replyToPoster = async (post) => {
    const author = post.author || {};
    const person = {
      id: post.author_id || author.id,
      name: author.name || "Citizen",
      avatar_url: author.avatar_url,
    };
    if (!person.id) return;
    // Opens chat if connected; otherwise connection request (same gate as call)
    await requireConnectedThen(person, "message");
  };

  const recordView = async (post) => {
    if (!currentUser?.id || !group?.id || post._viewed) return;
    post._viewed = true;
    try {
      const res = await merveilFetch(`/api/groups/${group.id}?action=view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.views_count != null) {
        setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, views_count: data.views_count } : p));
      }
    } catch {}
  };

  const intentStyle = (intent) => {
    if (intent === "sell") return { bg: "linear-gradient(145deg,#0E9AA7,#087F8A)", chipBg: "rgba(14,154,167,0.15)", chipFg: "#0A6B75" };
    if (intent === "buy") return { bg: "linear-gradient(145deg,#1FA64A,#15803D)", chipBg: "rgba(31,166,74,0.15)", chipFg: "#15803D" };
    return { bg: "linear-gradient(145deg,#D97706,#B45309)", chipBg: "rgba(217,119,6,0.18)", chipFg: "#B45309" };
  };

  const requireConnectedThen = async (person, kind) => {
    if (!person?.id) return;
    if (!currentUser?.id) { onSignIn?.(); return; }
    if (String(person.id) === String(currentUser.id)) return;
    const st = await fetchConnectionStatus(person.id);
    if (st.status === "accepted") {
      if (kind === "call") onCall?.(person, "voice");
      else onMessage?.(person);
      return;
    }
    if (st.status === "pending") {
      alert("Connection request pending — wait until they accept to call or message.");
      return;
    }
    const go = window.confirm("You're not connected yet. Send a connection request first?");
    if (!go) return;
    const result = await requestMerveilConnection(person.id);
    if (result.status === "error") {
      alert(result.error || "Couldn't send connection request.");
      return;
    }
    if (result.status === "accepted" || result.alreadyConnected) {
      if (kind === "call") onCall?.(person, "voice");
      else onMessage?.(person);
    } else {
      alert("Connection request sent. You can call or message after they accept.");
    }
  };

  const toggleFavorite = async (g) => {
    if (!currentUser?.id) { onSignIn?.(); return; }
    try {
      const res = await merveilFetch(`/api/groups/${g.id}?action=favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNote(data.error || "Favorite failed");
        return;
      }
      // refresh catalog favorite flags
      loadCatalog();
      if (group && String(group.id) === String(g.id)) {
        setGroup((prev) => prev ? { ...prev, is_favorite: !!data.favorited } : prev);
      }
    } catch (e) {
      setNote(e.message || "Favorite failed");
    }
  };

  const reportPost = async (post) => {
    if (!currentUser?.id) { onSignIn?.(); return; }
    const category = window.prompt("Report reason: spam | scam | harassment | hate | violence | fake | other", "spam");
    if (!category) return;
    try {
      const res = await merveilFetch(`/api/groups/${group.id}?action=report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, category: category.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Report failed");
      setNote(data.autoHidden ? "Reported — Merveil AI removed this lead." : "Report sent. Merveil AI is reviewing.");
      if (data.autoHidden) setPosts((prev) => prev.filter((p) => p.id !== post.id));
      setTimeout(() => setNote(""), 4000);
    } catch (e) {
      setNote(e.message || "Report failed");
    }
  };

  const openPulseArea = () => {
    if (!group?.area) return;
    try {
      window.dispatchEvent(new CustomEvent("merveil:open-pulse-area", {
        detail: { emirate: group.emirate, area: group.area },
      }));
      // Deep link fallback
      window.location.href = `/?tab=pulse&community=1&emirate=${encodeURIComponent(group.emirate || "")}&area=${encodeURIComponent(group.area || "")}`;
    } catch {
      window.location.href = "/?tab=pulse";
    }
  };

  const pinPost = async (post) => {
    if (!group?.i_member) { setNote("Enter the group to pin leads."); return; }
    try {
      const res = await merveilFetch(`/api/groups/${group.id}?action=pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Pin failed");
      setPosts((prev) => {
        const next = prev.map((p) => p.id === post.id
          ? { ...p, pinned_at: data.pinned ? new Date().toISOString() : null }
          : p);
        return [...next].sort((a, b) => {
          const pa = a.pinned_at ? 1 : 0;
          const pb = b.pinned_at ? 1 : 0;
          if (pb !== pa) return pb - pa;
          return (new Date(b.created_at).getTime() || 0) - (new Date(a.created_at).getTime() || 0);
        });
      });
    } catch (e) {
      setNote(e.message || "Pin failed");
    }
  };

  // —— Inside a group: FULL SCREEN (hide Connect chrome + bottom nav)
  if (group) {
    const inGroup = !!group.i_member;
    return (
      <div
        className="fixed inset-0 z-[160] flex flex-col"
        style={{ background: "#F5F0E8", paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}
      >
        <div className="px-2 py-2 flex items-center gap-1.5 border-b shrink-0 relative overflow-hidden" style={{ borderColor: "rgba(0,0,0,0.06)", background: "#FFFFFF" }}>
          <div className="absolute inset-x-0 top-0 h-1 pointer-events-none" aria-hidden style={{
            background: "linear-gradient(90deg,#000 0 25%,#00732F 25% 50%,#FFFFFF 50% 75%,#FF0000 75% 100%)",
            backgroundSize: "200% 100%",
            animation: "merveilUaeWave 6s linear infinite",
          }} />
          <button type="button" onClick={() => { setGroup(null); setPosts([]); loadCatalog(); }} className="p-2 rounded-full relative z-10" style={{ color: "#5C5346" }}>
            <ChevronLeft size={18} />
          </button>
          <div className="min-w-0 flex-1 relative z-10">
            <div className="text-sm font-bold truncate" style={{ color: "#1A1612" }}>{group.title || group.area}</div>
            <div className="text-[10px]" style={{ color: "#8A7B6C" }}>
              🇦🇪 {group.emirate} · Public · {(group.member_count || 0)} in group
              {inGroup ? " · Member" : " · Exploring"} · Guarded by Merveil AI
            </div>
          </div>
          <div className="flex items-center gap-1 relative z-10 shrink-0">
            <button type="button" onClick={openPulseArea} title="Open area in Pulse Community"
              className="text-[10px] font-bold px-2 py-1.5 rounded-full"
              style={{ background: "rgba(14,154,167,0.12)", color: "#0A6B75" }}>
              Pulse
            </button>
            <button type="button" onClick={() => toggleFavorite(group)} title="Favorite"
              className="w-9 h-9 rounded-full flex items-center justify-center text-base"
              style={{ background: group.is_favorite ? "rgba(14,154,167,0.15)" : "rgba(0,0,0,0.04)" }}>
              {group.is_favorite ? "★" : "☆"}
            </button>
            {inGroup ? (
              <button type="button" onClick={leaveGroup} className="text-[11px] font-bold px-2.5 py-1.5 rounded-full"
                style={{ background: "rgba(224,85,76,0.12)", color: "#C0392B" }}>Leave</button>
            ) : (
              <button type="button" onClick={() => openGroup(group, { forceJoin: true })}
                className="text-[11px] font-bold px-2.5 py-1.5 rounded-full text-white"
                style={{ background: "#0E9AA7" }}>Enter</button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 relative">
          <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.16]" aria-hidden>
            {Array.from({ length: 14 }).map((_, i) => (
              <span key={i} className="absolute text-2xl" style={{
                left: `${(i * 17 + 5) % 92}%`,
                top: `${(i * 23 + 8) % 88}%`,
                animation: `merveilFlagFloat ${4.5 + (i % 5)}s ease-in-out infinite`,
                animationDelay: `${(i % 7) * 0.45}s`,
                fontSize: `${18 + (i % 4) * 4}px`,
              }}>🇦🇪</span>
            ))}
          </div>
          {note && <div className="text-[11px] text-center font-semibold relative z-10" style={{ color: "#B45309" }}>{note}</div>}
          {!inGroup && (
            <div className="relative z-10 rounded-xl px-3 py-2 text-[11px] font-semibold text-center"
              style={{ background: "rgba(14,154,167,0.1)", color: "#0A6B75" }}>
              Exploring — tap <strong>Enter</strong> to post in this area
            </div>
          )}
          {postLoading && <div className="text-xs text-center py-8 relative z-10" style={{ color: "#8A7B6C" }}>Loading leads…</div>}
          {!postLoading && posts.length === 0 && (
            <div className="text-center py-10 px-4 relative z-10">
              <div className="text-sm font-bold" style={{ color: "#1A1612" }}>No leads yet</div>
              <p className="text-xs mt-1" style={{ color: "#8A7B6C" }}>Be the first in {group.area}.</p>
            </div>
          )}
          {posts.map((post) => {
            const author = post.author || {};
            const name = author.name || "Citizen";
            const mine = post.is_mine || String(post.author_id) === String(currentUser?.id);
            return (
              <div
                key={post.id}
                data-group-post-id={post.id}
                className="rounded-2xl border p-3 relative z-10"
                style={{ borderColor: "rgba(0,0,0,0.06)", background: "#FFFFFF", boxShadow: "0 2px 12px rgba(26,22,18,0.04)" }}
                ref={(el) => {
                  if (!el || post._viewed) return;
                  const io = new IntersectionObserver((entries) => {
                    if (entries.some((e) => e.isIntersecting)) {
                      recordView(post);
                      io.disconnect();
                    }
                  }, { threshold: 0.35 });
                  io.observe(el);
                }}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <button type="button" className="shrink-0 rounded-full" onClick={() => (() => { const pid = post.author_id || author?.id; if (!pid) { try { window.dispatchEvent(new CustomEvent('merveil:toast', { detail: { message: 'Profile not linked on this lead yet' } })); } catch {} return; } onProfile?.({ id: String(pid), name: name || author?.name || 'Citizen', avatar_url: author?.avatar_url || null }); })()}>
                    <Avatar name={name} src={author.avatar_url} size={40} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <button type="button" className="text-left w-full min-w-0" onClick={() => (() => { const pid = post.author_id || author?.id; if (!pid) { try { window.dispatchEvent(new CustomEvent('merveil:toast', { detail: { message: 'Profile not linked on this lead yet' } })); } catch {} return; } onProfile?.({ id: String(pid), name: name || author?.name || 'Citizen', avatar_url: author?.avatar_url || null }); })()}>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[13px] font-bold truncate" style={{ color: "#1A1612" }}>{name}</span>
                        <PresenceDot status={post.author_status || "offline"} size={10} />
                        <MerveilTrustBadge
                          compact
                          passportVerified={!!post.passport_verified}
                          reVerified={!!post.re_verified}
                          trustLevel={post.trust_level || post.author?.trust_level}
                          trustLabel={post.trust_label || post.author?.trust_label}
                          trustScore={post.trust_score ?? post.author?.trust_score}
                        />
                        {post.source === "pulse" && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(14,154,167,0.12)", color: "#0A6B75" }}>From Pulse</span>
                        )}
                        {post.bridged_to_pulse && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(31,166,74,0.12)", color: "#15803D" }}>On Pulse</span>
                        )}
                      </div>
                      {author.profession && (
                        <div className="text-[10px] mt-0.5 truncate" style={{ color: "#8A7B6C" }}>{author.profession}</div>
                      )}
                      <div className="text-[10px]" style={{ color: "#8A7B6C" }}>
                        {post.created_at ? timeAgo(post.created_at) : ""}
                      </div>
                    </button>
                  </div>
                  {!mine && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => requireConnectedThen({ id: post.author_id || author.id, name, avatar_url: author.avatar_url }, "call")}
                      className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(14,154,167,0.1)" }}>
                      <Phone size={14} color="#0E9AA7" />
                    </button>
                    <button type="button" onClick={() => requireConnectedThen({ id: post.author_id || author.id, name, avatar_url: author.avatar_url }, "message")}
                      className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(31,166,74,0.12)" }}>
                      <MessageCircle size={14} color="#1FA64A" />
                    </button>
                  </div>
                  )}
                </div>
                {editingId === post.id ? (
                  <div className="space-y-2">
                    <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3}
                      className="w-full text-sm rounded-xl border px-3 py-2 outline-none resize-none"
                      style={{ borderColor: "rgba(0,0,0,0.1)", background: "#FFF", color: "#1A1612" }} />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => saveEdit(post)} className="text-[11px] font-bold px-3 py-1.5 rounded-full text-white" style={{ background: "#0E9AA7" }}>Save</button>
                      <button type="button" onClick={() => setEditingId(null)} className="text-[11px] font-bold px-3 py-1.5 rounded-full" style={{ color: "#5C5346" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  post.body && <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: "#2A241C" }}>{post.body}</p>
                )}
                {Array.isArray(post.media_urls) && post.media_urls.length > 0 && (
                  <div className="mt-2 flex gap-1.5 overflow-x-auto">
                    {post.media_urls.map((url) => (
                      String(url).match(/\.(mp4|webm|mov)(\?|$)/i)
                        ? <video key={url} src={url} controls className="h-36 rounded-xl object-cover max-w-[220px]" />
                        : <img key={url} src={url} alt="" className="h-36 rounded-xl object-cover max-w-[220px]" />
                    ))}
                  </div>
                )}
                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-semibold" style={{ color: "#8A7B6C" }}>👁 {post.views_count || 0}</span>
                  <button type="button" onClick={() => superPost(post)}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{
                      background: post.i_supered ? "rgba(14,154,167,0.15)" : "rgba(0,0,0,0.04)",
                      color: post.i_supered ? "#0E9AA7" : "#5C5346",
                    }}>
                    ★ Super {post.super_count || 0}
                  </button>
                  <button type="button" onClick={() => sharePost(post)} className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ color: "#5C5346" }}>Share</button>
                  {inGroup && (
                    <button type="button" onClick={() => pinPost(post)}
                      className="text-[11px] font-bold px-2 py-1 rounded-full"
                      style={{ color: post.pinned_at ? "#0E9AA7" : "#5C5346" }}>
                      {post.pinned_at ? "📌 Pinned" : "Pin"}
                    </button>
                  )}
                  <button type="button" onClick={() => replyToPoster(post)}
                    className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ color: "#0E9AA7" }}>
                    Reply
                  </button>
                  <button type="button" onClick={() => reportPost(post)}
                    className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ color: "#C0392B" }}>
                    Report
                  </button>
                  {post.duplicate_rank >= 2 && (
                    <span className="text-[9px] font-semibold" style={{ color: "#8A7B6C" }}>
                      Similar · #{post.duplicate_rank}
                    </span>
                  )}
                  {post.pinned_at && (
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full" style={{ background: "rgba(14,154,167,0.12)", color: "#0A6B75" }}>Top</span>
                  )}
                  {mine && inGroup && (
                    <>
                      <button type="button" onClick={() => { setEditingId(post.id); setEditText(post.body || ""); }}
                        className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ color: "#0E9AA7" }}>Edit</button>
                      <button type="button" onClick={() => deletePost(post)}
                        className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ color: "#C0392B" }}>Delete</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {inGroup ? (
          <div className="shrink-0 border-t px-2 py-2" style={{ borderColor: "rgba(0,0,0,0.08)", background: "#ECE5DD" }}>
            {mediaUrls.length > 0 && (
              <div className="flex gap-1.5 px-1 pb-2 overflow-x-auto">
                {mediaUrls.map((url) => (
                  <div key={url} className="relative shrink-0">
                    <img src={url} alt="" className="h-14 w-14 rounded-lg object-cover" />
                    <button type="button" onClick={() => setMediaUrls((u) => u.filter((x) => x !== url))}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-[10px] font-bold"
                      style={{ background: "#C0392B" }}>×</button>
                  </div>
                ))}
              </div>
            )}
            {showEmoji && (
              <div className="mb-2 max-h-40 overflow-y-auto rounded-2xl border p-2 grid grid-cols-8 gap-1"
                style={{ background: "#FFFFFF", borderColor: "rgba(0,0,0,0.08)", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
                {(typeof UAE_REACTIONS !== "undefined" ? UAE_REACTIONS : []).map((item) => (
                  <button
                    key={item.e + item.label}
                    type="button"
                    onClick={() => insertEmoji(item)}
                    className="text-xl leading-none p-1.5 rounded-lg hover:bg-black/5"
                    title={item.label}
                  >{item.e}</button>
                ))}
              </div>
            )}
            <div className="flex items-end gap-1.5">
              <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()}
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "#FFFFFF", color: "#0E9AA7", boxShadow: "0 1px 2px rgba(0,0,0,0.08)" }}
                aria-label="Attach">
                {uploading ? "…" : "+"}
              </button>
              <button type="button" onClick={() => setShowEmoji((v) => !v)}
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg"
                style={{ background: showEmoji ? "rgba(14,154,167,0.15)" : "#FFFFFF", boxShadow: "0 1px 2px rgba(0,0,0,0.08)" }}
                aria-label="Emoji">
                😊
              </button>
              <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadMedia(f); e.target.value = ""; }} />
              <div className="flex-1 min-w-0 rounded-2xl px-3 py-2" style={{ background: "#FFFFFF", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }}>
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    const el = e.target;
                    el.style.height = "auto";
                    el.style.height = Math.min(el.scrollHeight, 120) + "px";
                  }}
                  rows={1}
                  placeholder={`Message ${group.area}…`}
                  className="w-full text-[15px] outline-none resize-none border-0 bg-transparent leading-snug"
                  style={{ color: "#1A1612", maxHeight: 120, caretColor: "#0E9AA7" }}
                />
              </div>
              <button type="button" disabled={posting || (!draft.trim() && !mediaUrls.length)} onClick={publishLead}
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold"
                style={{ background: (posting || (!draft.trim() && !mediaUrls.length)) ? "#A8C5C9" : "#0E9AA7", boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }}
                aria-label="Send">
                {posting ? "…" : "➤"}
              </button>
            </div>
            {note && <div className="text-[10px] mt-1 px-1 font-semibold" style={{ color: "#B45309" }}>{note}</div>}
          </div>
        ) : (
          <div className="shrink-0 border-t px-3 py-3 text-center" style={{ borderColor: "rgba(0,0,0,0.06)", background: "#fff" }}>
            <button type="button" onClick={() => openGroup(group, { forceJoin: true })}
              className="text-sm font-bold px-5 py-2.5 rounded-full text-white" style={{ background: "#0E9AA7" }}>
              Enter group to post
            </button>
          </div>
        )}
      </div>
    );
  }

  if (area && emirate) {
    const em = catalog.find((e) => e.emirate === emirate);
    const ar = em?.areas?.find((a) => a.area === area);
    const groups = ar?.groups || [];
    return (
      <div className="flex flex-col h-full min-h-0" style={{ background: "#F5F0E8" }}>
        <div className="px-3 py-2.5 flex items-center gap-2 border-b" style={{ borderColor: "rgba(0,0,0,0.06)", background: "#fff" }}>
          <button type="button" onClick={() => setArea(null)} className="p-1.5"><ChevronLeft size={18} color="#5C5346" /></button>
          <div>
            <div className="text-sm font-bold" style={{ color: "#1A1612" }}>{area}</div>
            <div className="text-[10px]" style={{ color: "#8A7B6C" }}>{emirate} · Sell · Buy · Rent</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {groups.map((g) => {
            const st = intentStyle(g.intent);
            return (
              <div key={g.id} className="w-full rounded-2xl border p-3.5 flex items-center gap-2"
                style={{ borderColor: "rgba(0,0,0,0.06)", background: "#fff" }}>
                <button type="button" onClick={() => openGroup(g)} className="flex-1 min-w-0 text-left flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-sm"
                    style={{ background: st.bg }}>
                    {g.intent === "sell" ? "S" : g.intent === "buy" ? "B" : "R"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-[13px] font-bold" style={{ color: "#1A1612" }}>{g.title}</div>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                        style={{ background: st.chipBg, color: st.chipFg }}>{g.intent}</span>
                      {(g.unread_count || 0) > 0 && (
                        <span className="text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-white" style={{ background: "#0E9AA7" }}>
                          {g.unread_count > 99 ? "99+" : g.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px]" style={{ color: "#8A7B6C" }}>
                      {(g.member_count || 0)} members · {(g.post_count || 0)} leads
                      {g.i_member ? " · Joined" : " · Public"}
                    </div>
                  </div>
                </button>
                <button type="button" onClick={(e) => { e.stopPropagation(); toggleFavorite(g); }}
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-base"
                  style={{ background: g.is_favorite ? "rgba(14,154,167,0.12)" : "transparent" }}
                  aria-label="Favorite">
                  {g.is_favorite ? "★" : "☆"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (emirate) {
    const em = catalog.find((e) => e.emirate === emirate);
    const areas = em?.areas || [];
    return (
      <div className="flex flex-col h-full min-h-0" style={{ background: "#F5F0E8" }}>
        <div className="px-3 py-2.5 flex items-center gap-2 border-b" style={{ borderColor: "rgba(0,0,0,0.06)", background: "#fff" }}>
          <button type="button" onClick={() => setEmirate(null)} className="p-1.5"><ChevronLeft size={18} color="#5C5346" /></button>
          <div className="text-sm font-bold" style={{ color: "#1A1612" }}>🇦🇪 {emirate}</div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {areas.map((a) => (
            <button key={a.area} type="button" onClick={() => setArea(a.area)}
              className="w-full text-left rounded-2xl border p-3.5 flex items-center justify-between"
              style={{ borderColor: "rgba(0,0,0,0.06)", background: "#fff" }}>
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-[13px] font-bold" style={{ color: "#1A1612" }}>{a.area}</div>
                  {(a.unread_count || 0) > 0 && (
                    <span className="text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-white" style={{ background: "#0E9AA7" }}>
                      {a.unread_count > 99 ? "99+" : a.unread_count}
                    </span>
                  )}
                </div>
                <div className="text-[10px]" style={{ color: "#8A7B6C" }}>{(a.groups || []).length} groups · Sell / Buy / Rent</div>
              </div>
              <ChevronRight size={16} color="#C4B8A8" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: "#F5F0E8" }}>
      <div className="px-4 pt-3 pb-2">
        <div className="text-sm font-bold" style={{ color: "#1A1612" }}>Area Groups</div>
        <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "#8A7B6C" }}>
          Explore freely · Enter to post · Moderated by Merveil AI · Top posters earn boost credits
        </p>
        {note && <p className="text-[10px] mt-1" style={{ color: "#B45309" }}>{note}</p>}
        <TopGroupPostersStrip />
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
        {loading && <div className="text-xs text-center py-10" style={{ color: "#8A7B6C" }}>Loading emirates…</div>}
        {!loading && catalog.length === 0 && (
          <div className="rounded-2xl border p-4 text-center" style={{ borderColor: "rgba(0,0,0,0.06)", background: "#fff" }}>
            <div className="text-sm font-bold" style={{ color: "#1A1612" }}>Groups not seeded yet</div>
            <p className="text-xs mt-1" style={{ color: "#8A7B6C" }}>Run supabase-area-groups-ALL.sql in Supabase.</p>
          </div>
        )}
        {catalog.map((em) => {
          const unread = (em.areas || []).reduce((n, a) => n + (a.unread_count || 0), 0);
          return (
            <button key={em.emirate} type="button" onClick={() => setEmirate(em.emirate)}
              className="w-full text-left rounded-2xl border p-3.5 flex items-center justify-between"
              style={{ borderColor: "rgba(0,0,0,0.06)", background: "#fff" }}>
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-[14px] font-bold" style={{ color: "#1A1612" }}>🇦🇪 {em.emirate}</div>
                  {unread > 0 && (
                    <span className="text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-white" style={{ background: "#0E9AA7" }}>
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </div>
                <div className="text-[10px]" style={{ color: "#8A7B6C" }}>{(em.areas || []).length} areas</div>
              </div>
              <ChevronRight size={16} color="#C4B8A8" />
            </button>
          );
        })}
      </div>
    </div>
  );
}


function MessagesView({ currentUser, onSignIn, onReadThread, acceptedCall, onAcceptedCallConsumed }) {
  const [threads, setThreads] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [connectFilter, setConnectFilter] = useState("all"); // all | favorites | archived
  // Default: no thread selected — citizens chat first; AI is optional at bottom of list
  const [activeId, setActiveId] = useState(null);
  const [aiMessages, setAiMessages] = useState([{ from: "them", text: "Hi! I'm Merveil AI — ask me anything about listings, areas, or how the app works." }]);
  const [threadMessages, setThreadMessages] = useState([]);
  const activeThreadIdRef = useRef(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [mobileView, setMobileView] = useState("list");
  const [activeCall, setActiveCall] = useState(null); // { callId, mode, role: "caller" }
  const [callError, setCallError] = useState(null);
  const [msgMenuId, setMsgMenuId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  const [msgActionError, setMsgActionError] = useState("");
  const [viewingProfileId, setViewingProfileId] = useState(null);
  const [peerTyping, setPeerTyping] = useState(false);
  const [chatSettings, setChatSettings] = useState(() => loadChatSettings());
  const [showChatSettings, setShowChatSettings] = useState(false);
  const typingChannelRef = useRef(null);
  const typingStopTimerRef = useRef(null);
  const lastTypedEmitRef = useRef(0);
  const chatBgInputRef = useRef(null);

  // World / Creator / Pulse Message opens the exact conversation (not AI default).
  // Pending open is stored because MessagesView may not be mounted when the
  // event fires (user is still on Pulse/World) — apply on mount + live.
  useEffect(() => {
    const applyOpen = (d) => {
      const conversationId = d?.conversationId;
      if (!conversationId) return;
      // Never divert a human chat into the AI assistant thread
      if (String(conversationId) === String(MERVEIL_AI_THREAD_ID)) return;
      try { setConnectTab("messages"); } catch {}
      if (d.otherUserId) {
        try {
          const at = Date.now();
          ContactClock.bump(d.otherUserId, at);
          window.dispatchEvent(new CustomEvent("merveil:contact-bump", { detail: { userId: String(d.otherUserId), at } }));
        } catch {}
      }
      setThreads((p) => {
        const existing = p.find((t) => String(t.id) === String(conversationId));
        if (existing) {
          return [{ ...existing, last_message_at: existing.last_message_at || new Date().toISOString() }, ...p.filter((t) => String(t.id) !== String(conversationId))];
        }
        return [{
          id: conversationId,
          participant_ids: d.participantIds || (d.otherUserId && currentUser?.id ? [currentUser.id, d.otherUserId] : (d.otherUserId ? [d.otherUserId] : [])),
          other_user_id: d.otherUserId || null,
          context_label: null,
          last_body: d.last_body || "",
          last_message_at: new Date().toISOString(),
          unread_count: 0,
        }, ...p];
      });
      setActiveId(conversationId);
      setMobileView("chat");
    };
    const onOpen = (e) => {
      const d = e?.detail || {};
      if (d.conversationId) {
        try {
          sessionStorage.setItem("merveil_pending_conversation", JSON.stringify({
            conversationId: d.conversationId,
            otherUserId: d.otherUserId || null,
            participantIds: d.participantIds || [],
            at: Date.now(),
          }));
        } catch {}
        applyOpen(d);
      }
    };
    window.addEventListener("merveil:open-conversation", onOpen);
    const onCallHint = (e) => {
      const d = e?.detail || {};
      const otherId = d.otherUserId ? String(d.otherUserId) : null;
      if (!otherId || !currentUser?.id) return;
      const body = d.last_body || "📞 Call";
      const at = d.at || new Date().toISOString();
      try {
        ContactClock.bump(otherId, Date.now());
      } catch {}
      setThreads((prev) => {
        const hit = prev.find((t) => {
          const ids = (t.participant_ids || []).map(String);
          return ids.includes(String(currentUser.id)) && ids.includes(otherId);
        });
        if (hit) {
          const row = { ...hit, last_body: body, last_message_at: at, updated_at: at };
          return [row, ...prev.filter((t) => String(t.id) !== String(hit.id))];
        }
        // Placeholder until server conversation row arrives
        return [{
          id: `pending-call-${otherId}`,
          participant_ids: [String(currentUser.id), otherId],
          other_user_id: otherId,
          last_body: body,
          last_message_at: at,
          unread_count: 0,
        }, ...prev];
      });
    };
    window.addEventListener("merveil:call-thread-hint", onCallHint);
    // Consume pending open from Pulse/World (event may have fired before mount)
    try {
      const raw = sessionStorage.getItem("merveil_pending_conversation");
      if (raw) {
        const pending = JSON.parse(raw);
        if (pending?.conversationId && Date.now() - (pending.at || 0) < 60_000) {
          applyOpen(pending);
        }
        sessionStorage.removeItem("merveil_pending_conversation");
      }
    } catch {}
    return () => {
      window.removeEventListener("merveil:open-conversation", onOpen);
      window.removeEventListener("merveil:call-thread-hint", onCallHint);
    };
  }, [currentUser?.id]);

  const startEditMessage = (m) => {
    setMsgMenuId(null);
    setEditingMessageId(m.id);
    setEditText(m.body ?? m.text ?? "");
  };

  const saveEditMessage = async () => {
    if (!editText.trim()) return;
    const id = editingMessageId;
    const prevMessages = threadMessages;
    setThreadMessages((prev) => prev.map((m) => (m.id === id ? { ...m, body: editText.trim(), edited_at: new Date().toISOString() } : m)));
    setEditingMessageId(null);
    try {
      const res = await fetch(`/api/conversations/${activeId}/messages?action=edit`, {
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: id, body: editText.trim() }),
      });
      if (!res.ok) { setThreadMessages(prevMessages); setMsgActionError("Couldn't save that edit."); }
    } catch {
      setThreadMessages(prevMessages);
      setMsgActionError("Couldn't save that edit.");
    }
  };

  const deleteMessage = async (m) => {
    setMsgMenuId(null);
    const prevMessages = threadMessages;
    setThreadMessages((prev) => prev.filter((msg) => msg.id !== m.id));
    try {
      const res = await fetch(`/api/conversations/${activeId}/messages`, {
        method: "DELETE", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: m.id }),
      });
      if (!res.ok) { setThreadMessages(prevMessages); setMsgActionError("Couldn't delete that message."); }
    } catch {
      setThreadMessages(prevMessages);
      setMsgActionError("Couldn't delete that message.");
    }
  };

  const deleteConversation = async (convId) => {
    setThreads((prev) => prev.filter((t) => t.id !== convId));
    if (activeId === convId) { setActiveId(null); setMobileView("list"); }
    try {
      const res = await fetch(`/api/conversations/${convId}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) setMsgActionError("Couldn't delete that conversation.");
    } catch {
      setMsgActionError("Couldn't delete that conversation.");
    }
  };
  // CONNECT V1: which of the three sections is showing.
  const [connectTab, setConnectTab] = useState("messages"); // "citizens" | "circle" | "messages" | "ai-call"
  // Deep link: /?tab=connect&group=&post= → Groups tab (list pane, not blank chat)
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search || "");
      const groupId = q.get("group");
      const postId = q.get("post");
      const ctab = q.get("connectTab");
      if (groupId || ctab === "groups") {
        setActiveId(null);
        setMobileView("list");
        setConnectTab("groups");
        window.__merveilPendingGroup = { groupId, postId };
        // Delay event so AreaGroupsView is mounted after tab switch
        setTimeout(() => {
          try {
            window.dispatchEvent(new CustomEvent("merveil:open-group", { detail: { groupId, postId } }));
          } catch {}
        }, 350);
      }
    } catch {}
  }, []);

  // Offline hydrate: show last cached threads immediately
  useEffect(() => {
    if (!currentUser?.id) return;
    if (typeof navigator !== "undefined" && navigator.onLine) return;
    (async () => {
      const cached = await MerveilOfflineIdb.readThreads();
      if (cached?.length) {
        setThreads((prev) => (prev.length ? prev : cached));
      }
    })();
  }, [currentUser?.id]);

  const presence = useUnfilteredPresence(currentUser); // unfiltered — feeds Citizens, My Circle, and Messages alike
  const [profiles, setProfiles] = useState({});
  const [myStatus, setMyStatus] = useState(() => {
    try {
      const s = localStorage.getItem("merveil_presence_status");
      return s === "busy" ? "busy" : "online";
    } catch { return "online"; }
  }); // "online" | "busy"
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [outbox, setOutbox] = useOutbox();
  const [showEmoji, setShowEmoji] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatEmail, setNewChatEmail] = useState("");
  const [newChatError, setNewChatError] = useState("");
  const [directory, setDirectory] = useState([]);
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [directoryLoading, setDirectoryLoading] = useState(false);

  // Unified Connect: always load the people directory (not only the "new chat" panel)
  // so conversations + online/offline citizens live in one Messenger-style list.
  useEffect(() => {
    if (!currentUser?.id) return;
    let cancelled = false;
    let first = true;
    const q = directoryQuery.trim();
    const load = (isPoll = false) => {
      // Only flash loading on first load or when the search query changes — never on the 15s poll.
      if (!isPoll) setDirectoryLoading(true);
      merveilFetch(`/api/conversations?action=directory&q=${encodeURIComponent(q)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (cancelled) return;
          const raw = data?.users || [];
          const users = raw.map((u) => {
            const { status, ...rest } = u;
            return rest;
          });
          setDirectory((prev) => (q ? users : stableMergeById(prev, users)));
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled && (!isPoll || first)) {
            first = false;
            setDirectoryLoading(false);
          }
        });
    };
    const t = setTimeout(() => load(false), showNewChat ? 200 : 0);
    const id = setInterval(() => load(true), 30000);
    return () => { cancelled = true; clearTimeout(t); clearInterval(id); };
  }, [showNewChat, directoryQuery, currentUser?.id]);

  // Accepted connections = My Circle
  const [connectionPeople, setConnectionPeople] = useState([]);
  const [groupUnreadTotal, setGroupUnreadTotal] = useState(0);
  useEffect(() => {
    const onBump = (e) => {
      const uid = String(e?.detail?.userId || "");
      const at = Number(e?.detail?.at) || Date.now();
      if (!uid) return;
      ContactClock.bump(uid, at);
      setConnectionPeople((prev) => prev.map((p) =>
        String(p.id) === uid
          ? { ...p, lastContactAt: at, last_message_at: new Date(at).toISOString() }
          : p
      ));
      setThreads((prev) => {
        const uidMe = String(currentUser?.id || "");
        return [...prev].map((th) => {
          const ids = (th.participant_ids || []).map(String);
          const other = th.other_user_id ? String(th.other_user_id) : ids.find((x) => x !== uidMe);
          if (String(other) !== uid && !ids.includes(uid)) return th;
          return {
            ...th,
            last_message_at: new Date(at).toISOString(),
            updated_at: new Date(at).toISOString(),
            last_body: th.last_body || "Call",
          };
        }).sort((a, b) => contactTs(b.last_message_at) - contactTs(a.last_message_at));
      });
    };
    window.addEventListener("merveil:contact-bump", onBump);
    return () => window.removeEventListener("merveil:contact-bump", onBump);
  }, [currentUser?.id]);
  const reloadConnections = useCallback(() => {
    if (!currentUser?.id) return;
    merveilFetch("/api/connections?action=list&kind=accepted")
      .then((r) => (r.ok ? r.json() : { connections: [] }))
      .then((d) => {
        const people = (d.connections || []).map((c) => {
          const p = c.person;
          if (!p?.id) return null;
          return {
            ...p,
            lastContactAt: c.lastContactAt || p.lastContactAt || 0,
            last_message_at: c.last_message_at || p.last_message_at || null,
          };
        }).filter(Boolean);
        setConnectionPeople((prev) => stableMergeById(prev, people));
      })
      .catch(() => {});
  }, [currentUser?.id]);

  // Keep Circle ranking aligned with Messages: last_message_at / last contact from threads
  useEffect(() => {
    if (!threads?.length || !connectionPeople?.length) return;
    const uid = String(currentUser?.id || "");
    setConnectionPeople((prev) => {
      let changed = false;
      const next = prev.map((p) => {
        const pid = String(p.id);
        let best = 0;
        for (const th of threads) {
          const ids = (th.participant_ids || []).map(String);
          if (!ids.includes(pid) || !ids.includes(uid)) continue;
          const ts = new Date(th.last_message_at || th.updated_at || th.created_at || 0).getTime() || 0;
          if (ts > best) best = ts;
        }
        if (!best) return p;
        const prevTs = new Date(p.lastContactAt || p.last_message_at || 0).getTime() || 0;
        if (best <= prevTs) return p;
        changed = true;
        return { ...p, lastContactAt: best, last_message_at: new Date(best).toISOString() };
      });
      return changed ? next : prev;
    });
  }, [threads, currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const onGroupUnread = (e) => {
      const n = Number(e?.detail?.total || 0);
      if (!Number.isNaN(n)) setGroupUnreadTotal(n);
    };
    window.addEventListener("merveil:group-unread", onGroupUnread);
    return () => window.removeEventListener("merveil:group-unread", onGroupUnread);
  }, []);

  useEffect(() => {
    reloadConnections();
    const onEvt = () => reloadConnections();
    window.addEventListener("merveil:connection-changed", onEvt);

    // REALTIME My Circle — exact bug was: only IncomingConnectionRequests listened,
    // and only with filter connected_user_id=me. When a friend accepts YOUR request,
    // the row has user_id=you → that filter never fired → Circle stayed stale until
    // manual refresh. Subscribe BOTH directions + any status change.
    let chA = null;
    let chB = null;
    const uid = currentUser?.id;
    if (uid && supabaseBrowser?.channel) {
      try {
        (supabaseBrowser.getChannels?.() || []).forEach((c) => {
          const t = String(c.topic || "");
          if (t.includes(`connections-circle-${uid}`)) {
            try { supabaseBrowser.removeChannel(c); } catch {}
          }
        });
      } catch {}
      const onConnChange = () => {
        reloadConnections();
        try { window.dispatchEvent(new CustomEvent("merveil:connection-changed")); } catch {}
      };
      try {
        chA = supabaseBrowser
          .channel(`connections-circle-${uid}-a-${Math.random().toString(36).slice(2, 7)}`)
          .on("postgres_changes", {
            event: "*",
            schema: "public",
            table: "connections",
            filter: `user_id=eq.${uid}`,
          }, onConnChange)
          .subscribe();
        chB = supabaseBrowser
          .channel(`connections-circle-${uid}-b-${Math.random().toString(36).slice(2, 7)}`)
          .on("postgres_changes", {
            event: "*",
            schema: "public",
            table: "connections",
            filter: `connected_user_id=eq.${uid}`,
          }, onConnChange)
          .subscribe();
      } catch (e) {
        console.warn("[My Circle realtime]", e?.message || e);
      }
    }
    return () => {
      window.removeEventListener("merveil:connection-changed", onEvt);
      if (chA) try { supabaseBrowser.removeChannel(chA); } catch {}
      if (chB) try { supabaseBrowser.removeChannel(chB); } catch {}
    };
  }, [reloadConnections, currentUser?.id]);
  const fileInputRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const scrollRef = useRef(null);

  const isAiThread = activeId === MERVEIL_AI_THREAD_ID;
  const activeThread = threads.find((t) => t.id === activeId);
  // A call accepted via the global incoming-call banner (any tab) lands
  // here once the user is switched into Messages. Track the partner's
  // name from the acceptance payload itself, not from activeThread —
  // there may be no thread selected yet if the receiver wasn't already
  // chatting with this caller when the call came in.
  const [callPartnerName, setCallPartnerName] = useState(null);
  useEffect(() => {
    if (!acceptedCall) return;
    setActiveCall({ callId: acceptedCall.callId, mode: acceptedCall.mode, role: "receiver" });
    setCallPartnerName(acceptedCall.callerName);
    onAcceptedCallConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acceptedCall]);

  // Global call hand-off from Pulse / Services / World reel call buttons
  useEffect(() => {
    const onExternalCall = (e) => {
      const { callId, mode, otherName } = e.detail || {};
      if (!callId) return;
      setCallPartnerName(otherName || null);
      setActiveCall({ callId, mode: mode || "voice", role: "caller" });
    };
    window.addEventListener("merveil:start-call", onExternalCall);
    return () => window.removeEventListener("merveil:start-call", onExternalCall);
  }, []);

  const otherUserId = activeThread
    ? (activeThread.participant_ids || []).find((uid) => String(uid) !== String(currentUser?.id)) || null
    : null;

  const [e2eeUi, setE2eeUi] = useState({ enabled: false, verified: false, label: "" });
  useEffect(() => {
    if (!activeId || isAiThread) {
      setE2eeUi({ enabled: false, verified: false, label: "" });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const st = await merveilFetch(`/api/e2ee?action=status&conversationId=${encodeURIComponent(activeId)}`);
        const sj = st.ok ? await st.json() : null;
        if (cancelled) return;
        if (sj?.e2ee_enabled) {
          const hasKey = !!(sj.key_id && mvLoadKey(activeId, sj.key_id));
          setE2eeUi({
            enabled: true,
            verified: hasKey,
            label: hasKey
              ? "Only your trusted devices can read these messages."
              : "Keys not ready on this device yet — messages still use secure transport.",
          });
        } else {
          // Quiet status: transport is always HTTPS; full E2EE activates when both devices register keys.
          setE2eeUi({ enabled: false, verified: false, label: "Messages use secure transport. Full lock activates when both of you are on a trusted device." });
        }
      } catch {
        if (!cancelled) setE2eeUi({ enabled: false, verified: false, label: "" });
      }
    })();
    return () => { cancelled = true; };
  }, [activeId, isAiThread]);

  const startCall = async (mode) => {
    if (!otherUserId) return;
    setCallError(null);
    try { CallRingtone.unlock(); } catch {}
    try {
      // Soft session restore before call so refresh races never 401 a signed-in citizen
      try { await fetch("/api/auth/session", { credentials: "include" }); } catch { /* ignore */ }
      const res = await merveilFetch("/api/calls?action=create", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: otherUserId, type: mode }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setCallError(data?.error || "Couldn't start the call. Check your connection and try again.");
        setTimeout(() => setCallError(null), 6000);
        return;
      }
      setCallPartnerName(profiles[otherUserId]?.name || null);
      setActiveCall({ callId: data.call.id, mode, role: "caller" });
    } catch {
      setCallError("Couldn't start the call — check your connection.");
      setTimeout(() => setCallError(null), 4000);
    }
  };

  // Conversations list — realtime + short poll so new chats/calls appear like Citizens/Circle
  useEffect(() => {
    if (!currentUser?.id) return;
    let cancelled = false;
    const load = () => {
      merveilFetch(`/api/conversations?userId=${encodeURIComponent(currentUser.id)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (cancelled || !data?.conversations) return;
          try { MerveilOfflineIdb.cacheThreads(data.conversations); } catch {}
          setThreads((prev) => {
            const byId = Object.fromEntries((prev || []).map((t) => [String(t.id), t]));
            const merged = stableMergeById(prev, data.conversations).map((t) => {
              const old = byId[String(t.id)];
              if (!old) return t;
              // Never wipe a richer local preview (optimistic send / call line)
              const last_body = (t.last_body && String(t.last_body).trim())
                ? t.last_body
                : (old.last_body || t.last_body || "");
              const last_message_at = (() => {
                const a = new Date(t.last_message_at || 0).getTime() || 0;
                const b = new Date(old.last_message_at || 0).getTime() || 0;
                return a >= b ? (t.last_message_at || old.last_message_at) : old.last_message_at;
              })();
              return {
                ...t,
                last_body,
                last_message_at,
                unread_count: t.unread_count != null ? t.unread_count : (old.unread_count || 0),
              };
            });
            // Sort after merge so client bumps (ContactClock) keep thread on top
            return [...merged].sort((a, b) => {
              const otherA = (a.participant_ids || []).map(String).find((id) => id !== String(currentUser.id));
              const otherB = (b.participant_ids || []).map(String).find((id) => id !== String(currentUser.id));
              const ta = Math.max(
                new Date(a.last_message_at || a.updated_at || 0).getTime() || 0,
                ContactClock.get(otherA) || 0
              );
              const tb = Math.max(
                new Date(b.last_message_at || b.updated_at || 0).getTime() || 0,
                ContactClock.get(otherB) || 0
              );
              return tb - ta;
            });
          });
        })
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 2000);
    // Realtime: any message INSERT bumps the list (call system lines included)
    let channel = null;
    (async () => {
      try { await ensureRealtimeAuth(); } catch {}
      if (cancelled) return;
      try {
        channel = supabaseBrowser
          .channel(`conv-list-${currentUser.id}-${Date.now()}`)
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
            if (!cancelled) load();
          })
          .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conversations" }, () => {
            if (!cancelled) load();
          })
          .subscribe();
      } catch {}
    })();
    const onBump = () => { if (!cancelled) load(); };
    window.addEventListener("merveil:conversations-refresh", onBump);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("merveil:conversations-refresh", onBump);
      try { channel?.unsubscribe(); } catch {}
    };
  }, [currentUser?.id]);

  // Load messages for the active human conversation. Realtime + slow poll
  // so both sides see messages even when Realtime publication is incomplete.
  useEffect(() => {
    if (isAiThread || !activeId) return;
    let cancelled = false;
    // Only clear when the open thread actually changes — never on poll re-runs.
    if (activeThreadIdRef.current !== activeId) {
      activeThreadIdRef.current = activeId;
      setThreadMessages([]);
    }
    // Opening a thread always marks it read so the global badge clears
    if (currentUser?.id) {
      merveilFetch(`/api/conversations/${activeId}/messages`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readerId: currentUser.id }),
      }).then(() => onReadThread?.()).catch(() => {});
      setThreads((prev) => prev.map((th) => th.id === activeId ? { ...th, unread_count: 0 } : th));
    }
    const load = () => {
      merveilFetch(`/api/conversations/${activeId}/messages`)
        .then((r) => (r.ok ? r.json() : null))
        .then(async (data) => {
          if (cancelled || !data) return;
          const raw = data.messages || [];
          const msgs = [];
          for (const m of raw) {
            msgs.push(m.is_e2ee ? await mvDecryptRow(m, activeId) : m);
          }
          if (cancelled) return;
          setThreadMessages((prev) => {
            // Keep optimistic local bubbles until server rows appear (stops messages vanishing)
            const locals = prev.filter((m) => {
              const id = String(m.id || "");
              if (!id.startsWith("local-") && !id.startsWith("err-")) return false;
              if (id.startsWith("err-")) return true;
              return !msgs.some((s) => {
                if (String(s.sender_id) !== String(m.sender_id)) return false;
                if (m.body && s.body === m.body) return true;
                if (m.media_url && s.media_url === m.media_url) return true;
                // Near-time match for encrypted / empty body races
                const dt = Math.abs(new Date(s.created_at || 0) - new Date(m.created_at || 0));
                return dt < 15000 && !!m.body && (s.body === m.body || s.is_e2ee);
              });
            });
            const serverOnly = msgs;
            const prevServer = prev.filter((m) => {
              const id = String(m.id || "");
              return !id.startsWith("local-") && !id.startsWith("err-");
            });
            // Never wipe a non-empty thread with an empty poll (transient 401/empty)
            if (serverOnly.length === 0 && (prevServer.length > 0 || locals.length > 0)) {
              return prev;
            }
            const merged = stableMergeById(prevServer, serverOnly);
            const next = [...merged, ...locals];
            if (next.length === prev.length && next.every((m, i) => m === prev[i])) return prev;
            return next;
          });
        })
        .catch(() => {});
    };
    load();
    let channel = null;
    // Wait for Realtime JWT before subscribe so RLS auth.uid() is set (no race with setAuth).
    (async () => {
      try { await ensureRealtimeAuth(); } catch {}
      if (cancelled) return;
      try {
        channel = supabaseBrowser
          .channel(`msgs-${activeId}-${Date.now()}`)
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` },
            // receive tone fired inside callback below
            (payload) => {
              if (cancelled || !payload?.new) return;
              (async () => {
                const row = payload.new.is_e2ee ? await mvDecryptRow(payload.new, activeId) : payload.new;
                if (cancelled) return;
                const fromOther = String(row.sender_id) !== String(currentUser?.id);
                if (fromOther) {
                  try { MerveilChatTones.receive(); } catch {}
                }
                setThreadMessages((prev) => {
                  if (prev.some((m) => m.id === row.id)) return prev;
                  const withoutLocal = prev.filter((m) => !(String(m.id).startsWith("local-") && m.body === row.body));
                  return [...withoutLocal, row];
                });
              })();
              // Refresh thread list so last_body updates for the other side
              fetch(`/api/conversations?userId=${currentUser?.id}`, { credentials: "include" })
                .then((r) => (r.ok ? r.json() : null))
                .then((data) => {
                  if (cancelled || !data?.conversations) return;
                  const sorted = [...data.conversations].sort((a, b) => {
                    const ta = new Date(a.last_message_at || a.updated_at || a.created_at || 0).getTime();
                    const tb = new Date(b.last_message_at || b.updated_at || b.created_at || 0).getTime();
                    return tb - ta;
                  });
                  setThreads((prev) => stableMergeById(prev, sorted));
                })
                .catch(() => {});
            }
          )
          .subscribe();
      } catch {}
    })();
    // Realtime INSERT is primary; 2s poll keeps pace with Citizens/Circle
    const interval = setInterval(load, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      try { channel?.unsubscribe(); } catch {}
    };
  }, [activeId, isAiThread, currentUser?.id]);

  // Connect only writes preferred status — global heartbeat does the interval.
  // Avoids double POST every 8–12s from Connect + App shell.
  useEffect(() => {
    if (!currentUser?.id) return;
    const status = isOnline ? myStatus : "offline";
    try { localStorage.setItem("merveil_presence_status", status === "busy" ? "busy" : "online"); } catch {}
    fetch("/api/conversations?action=presence", {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => {});
  }, [currentUser?.id, myStatus, isOnline]);

  // Presence itself now comes from the unfiltered useUnfilteredPresence()
  // hook (declared above) so Citizens/My Circle/Messages all share one
  // realtime subscription instead of three id-scoped ones. This effect
  // just keeps `profiles` (name/avatar for thread partners) filled in.
  useEffect(() => {
    const threadIds = [...new Set(
      threads.map((t) => (t.participant_ids || []).find((uid) => String(uid) !== String(currentUser?.id))).filter(Boolean).map(String)
    )];
    if (!threadIds.length || !currentUser?.id) return;
    fetch(`/api/conversations?action=profiles&ids=${threadIds.join(",")}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setProfiles((prev) => ({ ...prev, ...data.profiles })))
      .catch(() => {});
  }, [threads.length, currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;
    fetch("/api/favorites", { credentials: "include" })
      .then(r => r.ok ? r.json() : { favoriteIds: [] })
      .then(d => setFavoriteIds(d.favoriteIds || []))
      .catch(() => {});
  }, [currentUser?.id]);

  const toggleFavorite = async (userId) => {
    const wasFav = favoriteIds.includes(userId);
    setFavoriteIds(prev => wasFav ? prev.filter(id => id !== userId) : [...prev, userId]);
    try {
      await fetch("/api/favorites", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    } catch {}
  };

  const toggleArchive = async (convId) => {
    setThreads(prev => prev.map(t => t.id === convId
      ? { ...t, archived_by: (t.archived_by || []).includes(currentUser.id) ? (t.archived_by || []).filter(id => id !== currentUser.id) : [...(t.archived_by || []), currentUser.id] }
      : t));
    try {
      await fetch(`/api/conversations/${convId}?action=archive`, { method: "PATCH", credentials: "include" });
    } catch {}
  };

  // Offline detection + auto-flush queued messages on reconnect / mount.
  useEffect(() => {
    const goOnline = () => { setIsOnline(true); flushOutbox(); };
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    // Resume any persisted queue from a previous session
    if (typeof navigator !== "undefined" && navigator.onLine && outbox.length > 0) {
      flushOutbox();
    }
    return () => { window.removeEventListener("online", goOnline); window.removeEventListener("offline", goOffline); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outbox.length]);

  const flushOutbox = async () => {
    if (outbox.length === 0) return;
    const remaining = [];
    const seen = new Set();
    for (const item of outbox) {
      const dedupeKey = `${item.conversationId}:${item.payload?.client_id || item.payload?.body || ""}:${item.queuedAt || 0}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      const attempts = (item.attempts || 0) + 1;
      try {
        const res = await merveilFetch(`/api/conversations/${item.conversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload),
        });
        if (!res.ok) {
          // Cap retries so a permanently failing message does not block the queue forever
          if (attempts < 8) remaining.push({ ...item, attempts });
        }
      } catch {
        if (attempts < 8) remaining.push({ ...item, attempts });
      }
    }
    setOutbox(remaining);
  };

  useEffect(() => { scrollRef.current?.scrollTo?.(0, scrollRef.current.scrollHeight); }, [threadMessages, aiMessages, peerTyping]);

  // Live typing channel (Realtime broadcast) — peer sees "typing…" + soft tone
  useEffect(() => {
    setPeerTyping(false);
    if (!activeId || isAiThread || !currentUser?.id) {
      try { typingChannelRef.current?.unsubscribe(); } catch {}
      typingChannelRef.current = null;
      return undefined;
    }
    let cancelled = false;
    let ch = null;
    (async () => {
      try { await ensureRealtimeAuth(); } catch {}
      if (cancelled) return;
      try {
        ch = supabaseBrowser.channel(`typing-${activeId}`, { config: { broadcast: { self: false } } });
        ch.on("broadcast", { event: "typing" }, (payload) => {
          const from = String(payload?.payload?.userId || "");
          if (!from || from === String(currentUser.id)) return;
          setPeerTyping(true);
          try { MerveilChatTones.typing(); } catch {}
          if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
          typingStopTimerRef.current = setTimeout(() => setPeerTyping(false), 2200);
        });
        ch.subscribe();
        typingChannelRef.current = ch;
      } catch {}
    })();
    return () => {
      cancelled = true;
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
      try { ch?.unsubscribe(); } catch {}
      typingChannelRef.current = null;
    };
  }, [activeId, isAiThread, currentUser?.id]);

  const emitTyping = useCallback(() => {
    if (!activeId || isAiThread || !currentUser?.id) return;
    const now = Date.now();
    if (now - lastTypedEmitRef.current < 700) return;
    lastTypedEmitRef.current = now;
    // Messenger-style: you hear your own soft key-reflect while typing
    try { MerveilChatTones.typing(); } catch {}
    try {
      typingChannelRef.current?.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: String(currentUser.id), at: now },
      });
    } catch {}
  }, [activeId, isAiThread, currentUser?.id]);

  const updateChatSettings = (patch) => {
    setChatSettings((prev) => {
      const next = { ...prev, ...patch };
      saveChatSettings(next);
      return next;
    });
  };

  const sendToAi = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    const userMsg = { from: "me", text };
    setDraft("");
    setAiMessages((p) => [...p, userMsg]);
    setSending(true);
    try {
      const reply = await callMerveilAI({
        system: merveilVoiceSystem(currentUser),
        messages: [...aiMessages, userMsg].map((m) => ({ role: m.from === "me" ? "user" : "assistant", content: m.text })),
        maxTokens: 400,
      });
      setAiMessages((p) => [...p, { from: "them", text: reply }]);
    } catch (e) {
      setAiMessages((p) => [...p, { from: "system", text: `Couldn't reach Merveil AI — ${e.message}` }]);
    } finally {
      setSending(false);
    }
  };

  const sendMessage = async ({ type = "text", text, mediaUrl, mediaMeta } = {}) => {
    if (isAiThread) return sendToAi();
    // Allow send with conversation id even if participant list is still
    // hydrating (Pulse/World open race). Missing otherUserId used to clear
    // the draft with nothing on screen — "hello disappears".
    if (!currentUser?.id || !activeId) return;
    const nowIso = new Date().toISOString();
    const preview = type === "text" ? (text || "") : type === "image" ? "📷 Photo" : type === "voice" ? "🎤 Voice" : type === "file" ? "📎 File" : "Message";
    const localId = `local-${Date.now()}`;
    let payload = { senderId: currentUser.id, type, body: text ?? undefined, mediaUrl, mediaMeta };
    let e2eeState = null;

    // E2EE V1: only encrypt when conversation is already e2ee_enabled AND this device has the key.
    // Do not auto-upgrade chats mid-send — that made "Hello" vanish (E2EE_REQUIRED / missing keys).
    if (type === "text" && text && activeId && globalThis.crypto?.subtle) {
      try {
        const st = await merveilFetch(`/api/e2ee?action=status&conversationId=${encodeURIComponent(activeId)}`);
        const sj = st.ok ? await st.json() : null;
        if (sj?.e2ee_enabled && sj.key_id) {
          const raw = mvLoadKey(activeId, sj.key_id);
          if (raw) {
            const enc = await mvEncryptText({
              plaintext: text,
              rawKeyB64: raw,
              conversationId: activeId,
              senderId: currentUser.id,
              keyId: sj.key_id,
            });
            payload = {
              senderId: currentUser.id,
              type: "text",
              is_e2ee: true,
              ciphertext: enc.ciphertext,
              nonce: enc.nonce,
              key_id: enc.key_id,
              encryption_version: enc.encryption_version,
              aad_hash: enc.aad_hash,
            };
            e2eeState = { e2ee_enabled: true, keyId: sj.key_id, rawB64: raw };
          }
          // else: missing local key — send plaintext; server may reject if flag is on
        }
      } catch {
        // Fall through to plaintext
      }
    }

    const optimistic = {
      id: localId,
      sender_id: currentUser.id,
      type,
      body: text,
      media_url: mediaUrl,
      media_meta: mediaMeta,
      created_at: nowIso,
      read_by: [],
      is_e2ee: !!payload.is_e2ee,
    };
    setThreadMessages((p) => [...p, optimistic]);
    try { MerveilChatTones.send(); } catch {}
    if (activeId) {
      if (otherUserId) ContactClock.bump(otherUserId, Date.now());
      setThreads((prev) => {
        const next = prev.map((t) =>
          t.id === activeId
? { ...t, last_body: payload.is_e2ee ? "🔒 Secure message" : preview, last_message_at: nowIso, updated_at: nowIso, unread_count: t.id === activeId ? 0 : t.unread_count }
            : t
        );
        // Keep newest first using max of last_message_at + ContactClock (no bounce down)
        return [...next].sort((a, b) => {
          const otherA = (a.participant_ids || []).map(String).find((id) => id !== String(currentUser.id));
          const otherB = (b.participant_ids || []).map(String).find((id) => id !== String(currentUser.id));
          const ta = Math.max(new Date(a.last_message_at || 0).getTime() || 0, ContactClock.get(otherA) || 0);
          const tb = Math.max(new Date(b.last_message_at || 0).getTime() || 0, ContactClock.get(otherB) || 0);
          return tb - ta;
        });
      });
      // Soft refresh — merge preserves newer last_message_at via stableMergeById
      try { window.dispatchEvent(new CustomEvent("merveil:conversations-refresh")); } catch {}
    }
    if (!isOnline) {
      setOutbox((p) => [...p, { conversationId: activeId, payload, queuedAt: Date.now() }]);
      return;
    }
    try {
      const res = await merveilFetch(`/api/conversations/${activeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (data?.code === "E2EE_REQUIRED") {
          setThreadMessages((p) => p.filter((m) => m.id !== localId));
          try {
            window.dispatchEvent(new CustomEvent("merveil:toast", {
              detail: { type: "error", message: "Encryption required — message not sent as plaintext." },
            }));
          } catch {}
          return;
        }
        // Session race: restore + retry once so messages do not vanish
        if (res.status === 401 || data?.code === "AUTH_REQUIRED") {
          try {
            const sess = await fetch("/api/auth/session", { credentials: "include" });
            if (sess.ok) {
              const b = await sess.json().catch(() => null);
              if (b?.user?.id) {
                try { window.dispatchEvent(new CustomEvent("merveil:session-user", { detail: b.user })); } catch {}
              }
            }
          } catch {}
          try {
            const res2 = await merveilFetch(`/api/conversations/${activeId}/messages`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            const data2 = await res2.json().catch(() => null);
            if (res2.ok && data2?.message?.id) {
              const row = data2.message.is_e2ee
                ? { ...data2.message, body: text, read_by: data2.message.read_by || [] }
                : { ...data2.message, read_by: data2.message.read_by || [] };
              setThreadMessages((p) => p.map((m) => (m.id === localId ? row : m)));
              try { window.dispatchEvent(new CustomEvent("merveil:conversations-refresh")); } catch {}
              return;
            }
          } catch {}
        }
        // Keep optimistic bubble; queue for outbox flush (do not delete local message)
        setOutbox((p) => [...p, { conversationId: activeId, payload, queuedAt: Date.now() }]);
        return;
      }
      if (data?.message?.id) {
        const row = data.message.is_e2ee
          ? { ...data.message, body: text, read_by: data.message.read_by || [] }
          : { ...data.message, read_by: data.message.read_by || [] };
        setThreadMessages((p) => p.map((m) => (m.id === localId ? row : m)));
        try { window.dispatchEvent(new CustomEvent("merveil:conversations-refresh")); } catch {}
      }
    } catch {
      setOutbox((p) => [...p, { conversationId: activeId, payload, queuedAt: Date.now() }]);
    }
  };

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    sendMessage({ type: "text", text });
  };

  const uploadAndSend = async (file, kind) => {
    const form = new FormData();
    form.append("file", file);
    form.append("folder", "chat");
    try {
      // Soft-restore session before upload so voice/photo never forces a false logout
      try {
        const sess = await fetch("/api/auth/session", { credentials: "include" });
        if (sess.ok) {
          const body = await sess.json().catch(() => null);
          if (body?.user?.id) {
            try { window.dispatchEvent(new CustomEvent("merveil:session-user", { detail: body.user })); } catch {}
          }
        }
      } catch {}
      const res = await fetch("/api/people?action=upload", { method: "POST", credentials: "include", body: form });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        // Do not open auth spam — keep composing; show error in-thread
        setThreadMessages((p) => [...p, { id: `err-${Date.now()}`, sender_id: "system", type: "text", body: "Upload needs a moment — try again (session refreshing).", created_at: new Date().toISOString() }]);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Upload failed");
      sendMessage({ type: kind, mediaUrl: data.url, mediaMeta: { name: data.name, size: data.size, contentType: data.contentType } });
    } catch (e) {
      setThreadMessages((p) => [...p, { id: `err-${Date.now()}`, sender_id: "system", type: "text", body: `Attachment failed to send — ${e.message}`, created_at: new Date().toISOString() }]);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        uploadAndSend(new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" }), "voice");
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (err) {
      const perm = await requestMediaPermissions("voice");
      alert(perm.error || err?.message || "Couldn't access your microphone — check browser permissions.");
    }
  };
  const stopRecording = () => { mediaRecorderRef.current?.stop(); setRecording(false); };

  const startChatWith = async (otherUser) => {
    setNewChatError("");
    if (!otherUser?.id) {
      setNewChatError("Missing person — try again.");
      return;
    }
    if (!currentUser?.id) {
      onSignIn?.();
      return;
    }
    setConnectTab("messages");
    setMobileView("chat");
    try {
      // Rank this person top immediately (Circle / Citizens / Messages)
      try {
        const at = Date.now();
        ContactClock.bump(otherUser.id, at);
        window.dispatchEvent(new CustomEvent("merveil:contact-bump", { detail: { userId: String(otherUser.id), at } }));
      } catch {}

      // Session restore race (same pattern as calls)
      try {
        const sess = await fetch("/api/auth/session", { credentials: "include", cache: "no-store" });
        if (sess.ok) {
          const body = await sess.json().catch(() => null);
          if (body?.user?.id) {
            try { window.dispatchEvent(new CustomEvent("merveil:session-user", { detail: body.user })); } catch {}
          }
        }
      } catch {}

      const createdRes = await merveilFetch("/api/conversations", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantIds: [currentUser.id, otherUser.id] }),
      });
      const created = await createdRes.json().catch(() => null);
      const conversationId = created?.conversation?.id;
      if (!createdRes.ok || !conversationId) {
        throw new Error(created?.error || "No conversation returned");
      }
      // Only auto-greet brand-new threads
      if (!created.reused) {
        const greetName = (otherUser.name || otherUser.full_name || "").trim() || "there";
        await merveilFetch(`/api/conversations/${conversationId}/messages`, {
          method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: `Hi ${greetName}! 👋` }),
        }).catch(() => {});
      }
      const msgsRes = await merveilFetch(`/api/conversations/${conversationId}/messages`);
      const msgsData = await msgsRes.json().catch(() => null);
      const lastMsg = (msgsData?.messages || []).slice(-1)[0];
      const lastBody = lastMsg?.is_e2ee
        ? "🔒 Secure message"
        : (lastMsg?.body || lastMsg?.type === "voice" && "🎤 Voice" || lastMsg?.type === "image" && "📷 Photo" || (created.reused ? "" : `Hi ${(otherUser.name || otherUser.full_name || "").trim() || "there"}! 👋`));
      const nowIso = new Date().toISOString();
      setThreadMessages(msgsData?.messages || []);
      setThreads((p) => {
        const existing = p.find((t) => String(t.id) === String(conversationId));
        const row = {
          ...(existing || {}),
          id: conversationId,
          participant_ids: existing?.participant_ids || [currentUser.id, otherUser.id],
          context_label: existing?.context_label || null,
          last_body: lastBody || existing?.last_body || "",
          last_message_at: nowIso,
          updated_at: nowIso,
          unread_count: existing?.unread_count || 0,
        };
        return [row, ...p.filter((t) => String(t.id) !== String(conversationId))];
      });
      setProfiles((prev) => ({
        ...prev,
        [otherUser.id]: {
          name: otherUser.name || otherUser.full_name,
          avatar_url: otherUser.avatar_url || otherUser.avatarUrl || otherUser.avatar,
        },
      }));
      setActiveId(conversationId);
      setShowNewChat(false);
      setDirectoryQuery("");
      setMobileView("chat");
      setConnectTab("messages");
      // Persist open target so poll races cannot drop the open chat
      try {
        window.dispatchEvent(new CustomEvent("merveil:open-conversation", {
          detail: { conversationId, otherUserId: otherUser.id, name: otherUser.name },
        }));
      } catch {}
    } catch (e) {
      setNewChatError(`Couldn't open the chat — ${e.message}`);
      setMobileView("list");
    }
  };
  // Kept for any other callers; the UI now uses the directory instead of email lookup.
  const startNewChat = () => {};

  if (!currentUser) {
    return (
      <div className="p-6 flex flex-col items-center text-center" style={{ minHeight: "70vh" }}>
        <MessageCircle size={26} style={{ color: T.sub }} className="mb-4" />
        <h2 className="text-lg font-bold mb-1" style={{ color: T.ink, fontFamily: "'Space Grotesk',sans-serif" }}>Sign in to use Connect</h2>
        <p className="text-sm mb-5 max-w-xs" style={{ color: T.sub }}>Real conversations with real people on Merveil — sign in to start.</p>
        <button onClick={onSignIn} className="px-6 py-2.5 rounded-xl font-semibold text-sm" style={{ background: T.signal, color: "#FFFFFF" }}>Sign In</button>
      </div>
    );
  }

  const presenceDot = (status) => ({ online: "#1F7A4D", busy: "#0891B2", offline: T.line }[status] || T.line);
  const activeMessages = isAiThread ? aiMessages : threadMessages;

  return (
    <div
      className="flex min-h-0 flex-1 connect-desktop-shell"
      role="region"
      aria-label="Connect"
      style={{
        height: "100%",
        maxHeight: "100%",
        minHeight: 0,
        background: CT.bg,
      }}
    >
      <div
        className={`${mobileView === "chat" ? "hidden md:flex" : "flex"} w-full md:w-[340px] lg:w-[380px] md:max-w-[400px] connect-list-pane border-r flex-col contain-layout min-h-0 md:flex-none flex-1 overflow-hidden`}
        style={{ borderColor: CT.line, background: CT.bg }}
        role="navigation"
        aria-label="Connect lists"
      >
{/* Connect compact bar — single title, no duplicate CONNECT / no @ */}
        <div
          className="px-3 pt-2 pb-2 border-b"
          style={{
            borderColor: CT.line,
            background: CT.headerBg || "#1E1814",
          }}
        >
          <div className="min-w-0">
            <h2 className="text-xl font-bold leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CT.ink, letterSpacing: "-0.02em" }}>
              {t("nav.connect")}
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: CT.sub }}>
              {document.documentElement.getAttribute("lang") === "fr"
                ? "Personnes · présence · conversations de confiance"
                : document.documentElement.getAttribute("lang") === "ar"
                  ? "أشخاص · حضور · محادثات موثوقة"
                  : "People · presence · trusted conversations"}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <button
              onClick={() => {
                setMyStatus((s) => {
                  const next = s === "online" ? "busy" : "online";
                  try { localStorage.setItem("merveil_presence_status", next); } catch {}
                  fetch("/api/conversations?action=presence", {
                    method: "POST", credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: next }),
                  }).catch(() => {});
                  return next;
                });
              }}
              className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-full"
              style={{
                background: CT.glass,
                backdropFilter: CT.glassBlur,
                WebkitBackdropFilter: CT.glassBlur,
                color: isOnline ? (myStatus === "busy" ? CT.busy : CT.online) : CT.sub,
                border: `1px solid ${CT.glassBorder}`,
                boxShadow: CT.glassShadow,
              }}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: presenceDot(isOnline ? myStatus : "offline"), boxShadow: isOnline ? `0 0 10px ${presenceDot(myStatus)}` : "none" }} />
              {isOnline ? (myStatus === "busy" ? "Busy" : "Online") : "Offline"}
            </button>
            {(() => {
              const onlineEst = Math.max(
                Object.values(presence).filter((s) => s === "online" || s === "busy").length,
                directory.filter((u) => u.status === "online" || u.status === "busy").length
              );
              const offlineEst = Math.max(0, (directory.length || connectionPeople.length) - onlineEst);
              return (
                <span className="text-[12px] font-bold inline-flex items-center gap-2" style={{ color: CT.ink }}>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{
                    background: CT.glass,
                    backdropFilter: CT.glassBlur,
                    WebkitBackdropFilter: CT.glassBlur,
                    border: `1px solid ${CT.glassBorder}`,
                    boxShadow: CT.glassShadow,
                    color: CT.online,
                  }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: CT.online, boxShadow: `0 0 10px ${CT.online}` }} />
                    {onlineEst} live
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{
                    background: CT.glass,
                    backdropFilter: CT.glassBlur,
                    WebkitBackdropFilter: CT.glassBlur,
                    border: `1px solid ${CT.glassBorder}`,
                    boxShadow: CT.glassShadow,
                    color: CT.offline,
                  }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: CT.offline }} />
                    {offlineEst > 0 ? offlineEst : "—"} away
                  </span>
                </span>
              );
            })()}
          </div>
        </div>

        {/* CONNECT V1 — Citizens | My Circle | Messages */}
        <div
          className="flex items-center gap-1 px-2 py-3 border-b"
          style={{ borderColor: CT.line, background: CT.headerBg || "#1E1814" }}
          role="tablist"
          aria-label="Connect sections"
        >
          {(() => {
            const msgUnread = (threads || []).reduce((n, th) => n + (Number(th.unread_count) || 0), 0);
            const newCitizens = (directory || []).filter((u) => isNewCitizen(u, 3)).length;
            // New accepted connections in last 3 days (or marked new)
            const newCircle = (connectionPeople || []).filter((u) => {
              if (isNewCitizen(u, 3)) return true;
              const ts = Date.parse(u.connected_at || u.accepted_at || u.created_at || 0);
              return ts && (Date.now() - ts) < 3 * 24 * 60 * 60 * 1000;
            }).length;
            return [
            { id: "citizens", label: t("connect.citizens"), activeBg: "#1D6FBF", activeFg: "#FFFFFF", idle: "#7EB6E8", badge: newCitizens },
            { id: "circle", label: t("connect.circle"), activeBg: "#1FA64A", activeFg: "#FFFFFF", idle: "#7DDB9A", badge: newCircle },
            { id: "messages", label: t("connect.messages"), activeBg: "#F5EDE3", activeFg: "#1E1814", idle: "#B8A99A", border: true, badge: msgUnread },
            { id: "ai-call", label: "AI Call", isNew: true, activeBg: "#5C534A", activeFg: "#F5EDE3", idle: "#8A7B6C", badge: 0 },
            { id: "groups", label: "Groups", isNew: true, activeBg: "#0E9AA7", activeFg: "#FFFFFF", idle: "#7EC8D0", badge: groupUnreadTotal || 0 },
          ];
          })().map((tabItem) => {
            const on = connectTab === tabItem.id;
            return (
            <button
              key={tabItem.id}
              role="tab"
              type="button"
              aria-selected={on}
              id={`connect-tab-${tabItem.id}`}
              onClick={() => { merveilHaptic("select"); setConnectTab(tabItem.id); }}
              className="flex-1 text-[11px] font-bold py-2.5 rounded-xl transition-all min-h-[44px]"
              style={{
                background: on ? tabItem.activeBg : "transparent",
                color: on ? tabItem.activeFg : tabItem.idle,
                boxShadow: on
                  ? (tabItem.border
                      ? "0 4px 14px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)"
                      : `0 4px 16px ${tabItem.activeBg}55`)
                  : "none",
                border: on && tabItem.border ? "1px solid rgba(26,24,22,0.12)" : "1px solid transparent",
                textShadow: on ? "0 1px 2px rgba(0,0,0,0.12)" : "none",
              }}
            >
              <span className="inline-flex items-center justify-center gap-1">
                {tabItem.label}
                {tabItem.isNew && (
                  <span className="text-[8px] font-bold px-1 py-0.5 rounded" style={{
                    background: on ? "rgba(255,255,255,0.22)" : "rgba(92,101,112,0.15)",
                    color: on ? "#fff" : "#5C6570",
                  }}>NEW</span>
                )}
                {(tabItem.badge || 0) > 0 && (
                  <span className="text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center"
                    style={{
                      background: on ? "rgba(255,255,255,0.92)" : "#0E9AA7",
                      color: on ? "#0E9AA7" : "#fff",
                    }}>{tabItem.badge > 99 ? "99+" : tabItem.badge}</span>
                )}
              </span>
            </button>
            );
          })}
        </div>

        {/* Incoming requests visible on every Connect tab so Accept is never missed */}
        {(connectTab === "citizens" || connectTab === "circle" || connectTab === "messages") && (
          <IncomingConnectionRequests currentUser={currentUser} onChanged={reloadConnections} />
        )}

        {connectTab === "citizens" && (
          <CitizensTab
            currentUser={currentUser}
            presenceMap={presence}
            onProfile={(id) => setViewingProfileId(id)}
            onCall={(u, mode) => initiateCitizenCall(u, mode)}
            onMessage={(u) => { setConnectTab("messages"); startChatWith(u); }}
          />
        )}

        {connectTab === "circle" && (
          <MyCircleTab
            currentUser={currentUser}
            connectionPeople={connectionPeople}
            presenceMap={presence}
            onProfile={(id) => setViewingProfileId(id)}
            onCall={(u, mode) => initiateCitizenCall(u, mode)}
            onMessage={(u) => { setConnectTab("messages"); startChatWith(u); }}
          />
        )}

        {connectTab === "ai-call" && (
          <div className="flex-1 min-h-0 overflow-y-auto" style={{ background: CT.bg }}>
            <AICallView
              currentUser={currentUser}
              onSignIn={onSignIn}
              onGoTo={(dest) => {
                if (dest === "messages" || dest === "connect") setConnectTab("messages");
                else if (dest === "passport") window.dispatchEvent(new CustomEvent("merveil:goto-passport"));
                else window.dispatchEvent(new CustomEvent("merveil:set-tab", { detail: { tab: dest } }));
              }}
            />
          </div>
        )}

        {connectTab === "groups" && (
          <div className="flex-1 min-h-0 overflow-hidden" style={{ background: CT.bg }}>
            <AreaGroupsView
              currentUser={currentUser}
              onSignIn={onSignIn}
              onMessage={(u) => {
                setActiveId(null);
                setMobileView("list");
                setConnectTab("messages");
                // Open chat after tab switch
                setTimeout(() => {
                  startChatWith(u);
                  setMobileView("chat");
                }, 80);
              }}
              onCall={(u, mode) => initiateCitizenCall(u, mode)}
              onProfile={(u) => {
                const id = u?.id || u;
                if (id) {
                  try {
                    window.dispatchEvent(new CustomEvent("merveil:open-creator-profile", {
                      detail: { userId: String(id), name: u?.name || null, avatar_url: u?.avatar_url || null },
                    }));
                  } catch {}
                }
              }}
            />
          </div>
        )}

        {connectTab === "messages" && (
        <>
        {!isOnline && outbox.length > 0 && (
          <div className="px-3 py-2 text-[11px] font-semibold" style={{ background: "#FDF3E2", color: "#9A6B17" }}>
            {outbox.length} {outbox.length > 1 ? t("common.messages") : t("common.message")} {t("common.queued")}
          </div>
        )}

        {showNewChat && (
          <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-3" style={{ background: "rgba(15,23,42,0.45)" }} onClick={() => { setShowNewChat(false); setDirectoryQuery(""); }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ border: `1px solid ${T.line}`, background: "#FFFFFF", maxHeight: "78vh" }} onClick={(e) => e.stopPropagation()}>
            <div className="p-3 pb-2 flex items-center justify-between border-b" style={{ borderColor: T.line }}>
              <div className="text-[12px] font-bold" style={{ color: T.ink }}>New message</div>
              <button type="button" onClick={() => { setShowNewChat(false); setDirectoryQuery(""); }} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: T.panel, color: T.sub }}>Close</button>
            </div>
            <div className="px-3 py-2">
              <input value={directoryQuery} onChange={(e) => setDirectoryQuery(e.target.value)}
                placeholder="Search by name…" autoFocus
                className="w-full text-sm px-3 py-2.5 rounded-xl border outline-none" style={{ borderColor: T.line, background: "#F9FAFB", color: T.ink }} />
            </div>
            {newChatError && <div className="px-3 text-[11px] mb-1.5" style={{ color: "#E0554C" }}>{newChatError}</div>}
            <div className="max-h-[50vh] overflow-y-auto pb-2">
              {directoryLoading && <div className="px-3 py-2 text-xs" style={{ color: T.sub }}>Loading…</div>}
              {!directoryLoading && directory.length === 0 && (
                <div className="px-3 py-3 text-xs" style={{ color: T.sub }}>No one to show yet — as more people join Merveil, they'll appear here.</div>
              )}
              {directory.map((u) => (
                <button key={u.id} onClick={() => startChatWith(u)}
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-black/5">
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: T.navy, color: "#fff" }}>
                      {(u.name || "?").slice(0, 1).toUpperCase()}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full border-2" style={{ background: presenceDot(u.status), borderColor: "#fff" }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate" style={{ color: T.ink }}>{u.name || "Merveil member"}</div>
                    <div className="text-[11px] capitalize" style={{ color: T.sub }}>{u.role_label || u.status}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          </div>
        )}

        <div className="overflow-y-auto flex-1 min-h-0 overscroll-contain">
          <IncomingConnectionRequests currentUser={currentUser} />

          <div className="flex items-center gap-1.5 px-3 pb-2 pt-1">
            {[
              { id: "all", label: "All" },
              { id: "favorites", label: "Favorites" },
              { id: "archived", label: "Archived" },
            ].map(f => (
              <button key={f.id} onClick={() => setConnectFilter(f.id)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: connectFilter === f.id ? T.ink : T.panel, color: connectFilter === f.id ? "#fff" : T.sub }}>
                {f.label}
              </button>
            ))}
          </div>

          {(() => {
            // MESSAGES — actual communication only. Citizens/My Circle
            // (people without a thread yet) live in their own tabs now;
            // this list is built strictly from real conversations so it
            // never shows a person with nothing to preview.
            const byUser = new Map();

            const upsert = (userId, patch) => {
              if (!userId || String(userId) === String(currentUser?.id)) return;
              const id = String(userId);
              const prev = byUser.get(id) || { userId: id, name: null, avatar: null, status: "offline", thread: null, verified: false, roleLabel: null };
              byUser.set(id, { ...prev, ...patch, userId: id });
            };

            for (const t of threads) {
              const otherId = (t.participant_ids || []).find((uid) => String(uid) !== String(currentUser?.id));
              if (!otherId) continue;
              const isArchived = (t.archived_by || []).includes(currentUser?.id);
              const connectionMatch = connectionPeople.find((p) => String(p.id) === String(otherId));
              upsert(otherId, {
                thread: t,
                archived: isArchived,
                name: profiles[otherId]?.name || connectionMatch?.name || null,
                avatar: profiles[otherId]?.avatar_url || connectionMatch?.avatar_url || null,
                status: presence[otherId] || "offline",
                lastAt: t.last_message_at || t.updated_at || t.created_at || null,
                verified: connectionMatch ? (connectionMatch.passport_tier === "professional" || connectionMatch.passport_tier === "investor") : false,
                roleLabel: connectionMatch?.role_label || connectionMatch?.profession || null,
              });
            }

            let rows = [...byUser.values()];

            if (connectFilter === "archived") {
              rows = rows.filter((r) => r.archived && r.thread);
            } else if (connectFilter === "favorites") {
              rows = rows.filter((r) => favoriteIds.includes(r.userId) && !r.archived);
            } else {
              rows = rows.filter((r) => !r.archived);
            }

            // WhatsApp ranking: unread first, then last message/call time only (presence = dot, not order)
            rows.sort((a, b) => {
              const aUnread = a.thread?.unread_count || 0;
              const bUnread = b.thread?.unread_count || 0;
              if (!!aUnread !== !!bUnread) return bUnread ? 1 : -1;
              if (aUnread !== bUnread) return bUnread - aUnread;
              const ta = new Date(a.lastAt || a.thread?.last_message_at || 0).getTime() || 0;
              const tb = new Date(b.lastAt || b.thread?.last_message_at || 0).getTime() || 0;
              if (tb !== ta) return tb - ta;
              return (a.name || "").localeCompare(b.name || "");
            });

            if (rows.length === 0) {
              return (
                <>
                <div className="p-4 text-xs text-center" style={{ color: T.sub }}>
                  {connectFilter === "all"
                    ? "No conversations yet — head to Citizens or My Circle to start one."
                    : connectFilter === "favorites"
                      ? "No favorites yet — tap the star on someone to pin them."
                      : "No archived conversations."}
                </div>
                {connectFilter === "all" && (
                  <button onClick={() => { setActiveId(MERVEIL_AI_THREAD_ID); setMobileView("chat"); }}
                    className="w-full text-left p-3 border-t flex items-center gap-3 mt-2"
                    style={{ borderColor: T.line, background: activeId === MERVEIL_AI_THREAD_ID ? T.paper : "transparent" }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,#06B6D4,#1F2937)" }}>
                      <Sparkles size={16} color="#fff" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold" style={{ color: T.ink }}>Merveil AI</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#0E9AA722", color: "#0E9AA7" }}>AI</span>
                      </div>
                      <span className="text-xs truncate block" style={{ color: T.sub }}>Ask about listings, areas, anything</span>
                    </div>
                  </button>
                )}
                </>
              );
            }

            return (
              <>
              <VirtualWindow
                items={rows}
                itemHeight={76}
                overscan={12}
                style={{ maxHeight: "min(65vh, 560px)", minHeight: 120 }}
                getKey={(r) => r.userId}
                renderItem={(r) => {
              const status = r.status || "offline";
              const isFav = favoriteIds.includes(r.userId);
              const displayName = r.name || profiles[r.userId]?.name || `Merveil User #${String(r.userId).slice(0, 8)}`;
              // Preview under the name — envelope under the word Message when empty
              const rawPreview = String(
                r.thread.last_body || r.thread.context_label || r.thread.last_message || r.thread.last_message_body || ""
              ).trim();
              const isCallLine = /missed|video call|voice call|call ended|outgoing call|📞|📹/i.test(rawPreview);
              const subtitle = rawPreview || (r.thread.last_message_at ? "Tap to open chat" : "");
              const open = async () => {
                setActiveId(r.thread.id);
                setMobileView("chat");
                try { MerveilChatTones.view(); } catch {}
                setThreads((prev) => prev.map((th) => th.id === r.thread.id ? { ...th, unread_count: 0 } : th));
                // Always mark server-side read + refresh badge (sticky badges were from skipping this)
                if (currentUser?.id) {
                  fetch(`/api/conversations/${r.thread.id}/messages`, {
                    method: "PATCH", credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ readerId: currentUser.id }),
                  })
                    .then(() => onReadThread?.())
                    .catch(() => onReadThread?.());
                }
              };
              const unreadN = r.thread?.unread_count || 0;
              const lastIso = ContactClock.maxIso(
                r.userId,
                r.thread?.last_message_at,
                r.lastAt,
                r.thread?.updated_at
              );
              const when = lastIso ? timeAgo(lastIso) : "";
              const isMissed = /missed call|no answer|call ended|voice call|video call/i.test(String(subtitle || ""));
              return (
                <div key={r.userId} className="w-full border-b flex items-center gap-1" style={{ borderColor: CT.line, background: r.thread?.id === activeId ? "rgba(14,154,167,0.10)" : (unreadN > 0 ? "rgba(14,154,167,0.06)" : CT.panel) }}>
                  <button type="button" onClick={open} className="flex-1 min-w-0 text-left px-3 py-3.5 flex items-center gap-3">
                    <div className="relative shrink-0" onClick={(e) => { e.stopPropagation(); setViewingProfileId(r.userId); }}>
                      <Avatar name={displayName} src={r.avatar || profiles[r.userId]?.avatar_url} size={48} />
                      <span className="absolute -bottom-0.5 -right-0.5" style={{ lineHeight: 0 }}>
                        <PresenceDot status={status} size={14} />
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[15px] truncate" style={{
                          color: CT.ink,
                          fontWeight: unreadN > 0 ? 700 : 600,
                          fontFamily: "'Space Grotesk',sans-serif",
                          letterSpacing: "-0.02em",
                          textShadow: "0 1px 0 rgba(255,255,255,0.5)",
                        }}>{displayName}</span>
                        {r.verified && (
                          <span className="text-[9px] font-bold px-1 py-0.5 rounded-full shrink-0" style={{ background: "rgba(14,154,167,0.12)", color: CT.accent }}>Verified</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
                        {isMissed && <Phone size={12} style={{ color: "#E0554C", flexShrink: 0 }} />}
                        {!rawPreview ? (
                          <span className="flex flex-col items-start leading-tight">
                            <span className="text-[13px] font-medium" style={{ color: unreadN > 0 ? CT.ink : CT.sub }}>
                              {unreadN > 0 ? "New message" : "Message"}
                            </span>
                            <span style={{ fontSize: 14, lineHeight: 1, marginTop: 1 }} aria-hidden>💌</span>
                          </span>
                        ) : (
                          <span className="text-[13px] truncate block" style={{ color: unreadN > 0 ? CT.ink : CT.sub, fontWeight: unreadN > 0 ? 600 : 400 }}>
                            {isCallLine && !isMissed ? "📞 " : ""}{subtitle}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0 pl-1" style={{ minWidth: 44 }}>
                      {when && (
                        <span className="text-[11px] tabular-nums font-medium whitespace-nowrap" style={{ color: unreadN > 0 ? CT.accent : CT.sub }}>{when}</span>
                      )}
                      {unreadN > 0 && (
                        <span className="text-[10px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center" style={{ background: "#0E9AA7", color: "#FFFFFF" }}>{unreadN > 99 ? "99+" : unreadN}</span>
                      )}
                    </div>
                  </button>
                  <div className="flex items-center gap-0.5 pr-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(r.userId)}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ color: isFav ? "#0891B2" : T.sub, background: isFav ? "rgba(8,145,178,0.1)" : "transparent" }}
                      title={isFav ? "Remove favorite" : "Add favorite"}
                      aria-label={isFav ? "Remove favorite" : "Add favorite"}
                    >
                      <Star size={14} fill={isFav ? "#0891B2" : "none"} />
                    </button>
                    {r.thread && (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleArchive(r.thread.id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ color: T.sub }}
                          title={connectFilter === "archived" ? "Unarchive" : "Archive"}
                          aria-label={connectFilter === "archived" ? "Unarchive" : "Archive"}
                        >
                          <ArchiveIcon size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => { if (window.confirm("Delete this conversation? This can't be undone.")) deleteConversation(r.thread.id); }}
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ color: "#B45309" }}
                          title="Delete conversation"
                          aria-label="Delete conversation"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            }}
              />
              {connectFilter === "all" && (
                <button onClick={() => { setActiveId(MERVEIL_AI_THREAD_ID); setMobileView("chat"); }}
                  className="w-full text-left p-3 border-t flex items-center gap-3 mt-1"
                  style={{ borderColor: T.line, background: activeId === MERVEIL_AI_THREAD_ID ? T.paper : "transparent" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,#06B6D4,#1F2937)" }}>
                    <Sparkles size={16} color="#fff" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold" style={{ color: T.ink }}>Merveil AI</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#0E9AA722", color: "#0E9AA7" }}>AI</span>
                    </div>
                    <span className="text-xs truncate block" style={{ color: T.sub }}>Ask about listings, areas, anything</span>
                  </div>
                </button>
              )}
              </>
            );
          })()}
        </div>
        </>
        )}
      </div>

      <div
        className={`${mobileView === "list" ? "hidden md:flex" : "flex"} flex-col flex-1 connect-chat-pane min-w-0`}
        role="main"
        aria-label="Conversation"
      >
        <div
          className="px-3 py-3 border-b flex items-center gap-3 shrink-0"
          style={{
            borderColor: CT.line,
            background: "#FFFFFF",
          }}
        >
          <button type="button" onClick={() => setMobileView("list")} className="md:hidden p-1" aria-label="Back to conversation list">
            <ArrowLeft size={18} style={{ color: CT.ink }} />
          </button>
          {isAiThread ? (
            <>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#0EA5E9,#0E9AA7)", boxShadow: "0 0 16px rgba(14,165,233,0.35)" }} aria-hidden="true">
                <Sparkles size={16} color="#fff" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold" style={{ color: CT.ink, fontFamily: "'Space Grotesk',sans-serif" }}>Merveil AI</div>
                <div className="text-[11px]" style={{ color: CT.sub }}>Always available · intelligence layer</div>
              </div>
            </>
          ) : activeThread ? (
            <>
              <button type="button" className="relative shrink-0" onClick={() => otherUserId && setViewingProfileId(otherUserId)} aria-label="Open profile">
                <Avatar name={profiles[otherUserId]?.name || `User ${otherUserId}`} src={profiles[otherUserId]?.avatar_url} size={40} />
                <span
                  className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                  style={{
                    background: presenceDot(presence[otherUserId] || "offline"),
                    borderColor: "#FFFFFF",
                    boxShadow: (presence[otherUserId] === "online" || presence[otherUserId] === "busy") ? `0 0 6px ${presenceDot(presence[otherUserId])}` : "none",
                  }}
                />
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate" style={{ color: CT.ink, fontFamily: "'Space Grotesk',sans-serif" }}>
                  {profiles[otherUserId]?.name || `Merveil User #${String(otherUserId).slice(0, 8)}`}
                </div>
                <div className="text-[11px] capitalize" style={{ color: CT.sub }}>
                  {presence[otherUserId] === "online" ? "Online now" : presence[otherUserId] === "busy" ? "Busy" : (presence[otherUserId] || "offline")}
                </div>
              </div>
              <button type="button" onClick={() => startCall("voice")} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(18,22,28,0.05)", border: "1px solid rgba(18,22,28,0.08)" }} aria-label="Voice call">
                <AnimatedPhone size={16} color={CT.ink} />
              </button>
              <button type="button" onClick={() => startCall("video")} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(18,22,28,0.05)", border: "1px solid rgba(18,22,28,0.08)" }} aria-label="Video call">
                <Video size={16} style={{ color: CT.ink }} />
              </button>
              <button type="button" onClick={() => setShowChatSettings(true)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(18,22,28,0.05)", border: "1px solid rgba(18,22,28,0.08)" }} aria-label="Chat settings">
                <Settings size={16} style={{ color: CT.ink }} />
              </button>
            </>
          ) : (
            <>
            <div className="hidden md:flex flex-col items-center justify-center w-full py-16 px-6 text-center">
                <div className="w-14 h-14 rounded-full mb-3 flex items-center justify-center" style={{ background: "rgba(14,154,167,0.1)" }}>
                  <MessageCircle size={22} style={{ color: "#0E9AA7" }} />
                </div>
                <div className="text-sm font-semibold" style={{ color: CT.ink }}>Select a conversation</div>
                <div className="text-xs mt-1 max-w-xs" style={{ color: CT.sub }}>Choose someone from your list — messages appear here, just like a full desktop messenger.</div>
              </div>
              <div className="md:hidden text-sm" style={{ color: CT.sub }}>Select a conversation</div>
            </>
          )}
        </div>

        <div
          ref={scrollRef}
          className="flex-1 min-h-0 px-3 py-4 flex flex-col gap-1 overflow-y-auto overscroll-contain relative"
          style={{
            backgroundColor: "#D6D0C6",
            backgroundImage: `linear-gradient(180deg, rgba(232,226,214,0.55) 0%, rgba(214,208,198,0.72) 100%), url(${chatSettings.customBg || chatSettings.bgUrl || "/chat-bg/dubai-sunset.jpg"})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "local",
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-y",
            minHeight: 120,
          }}
        >
          {activeMessages.length === 0 && !isAiThread && activeId && (
            <div className="text-center py-10 px-4">
              <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: "rgba(6,182,212,0.12)" }}>
                <MessageCircle size={22} style={{ color: "#06B6D4" }} />
              </div>
              <div className="text-sm font-semibold" style={{ color: T.ink }}>Start the conversation</div>
              <div className="text-xs mt-1" style={{ color: T.sub }}>Say hello — messages are private between you two.</div>
            </div>
          )}
          {activeMessages.map((m, i) => {
            const mine = isAiThread ? m.from === "me" : String(m.sender_id) === String(currentUser.id);
            const type = m.type || "text";
            const text = m.text ?? m.body;
            const isSystem = m.from === "system" || type === "system"
              || /^(📞|📹)?\s*(Missed|Video call|Voice call|Call ended)/i.test(String(text || "").trim());
            const ts = m.created_at || m.createdAt;
            const timeLabel = ts ? new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "";
            const prev = activeMessages[i - 1];
            const prevTs = prev?.created_at || prev?.createdAt;
            const daySep = ts && (!prevTs || new Date(ts).toDateString() !== new Date(prevTs).toDateString())
              ? new Date(ts).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
              : null;
            if (isSystem) {
              return (
                <React.Fragment key={m.id || i}>
                  {daySep && (
                    <div className="flex justify-center my-3">
                      <span className="text-[11px] font-semibold px-3 py-1 rounded-full tracking-wide" style={{ background: "#FFFFFF", color: "#5C6570", border: "1px solid rgba(18,22,28,0.08)" }}>{daySep}</span>
                    </div>
                  )}
                  <div className="text-center text-[11px] py-2 font-semibold" style={{ color: /missed/i.test(String(text || "")) ? "#E0554C" : "#5C6570" }}>
                    {text}
                  </div>
                </React.Fragment>
              );
            }
            return (
              <React.Fragment key={m.id || i}>
                {daySep && (
                  <div className="flex justify-center my-3">
                    <span className="text-[11px] font-semibold px-3 py-1 rounded-full tracking-wide" style={{ background: "#FFFFFF", color: "#5C6570", border: "1px solid rgba(18,22,28,0.08)", boxShadow: "0 1px 2px rgba(15,20,25,0.04)" }}>{daySep}</span>
                  </div>
                )}
                <div className="flex items-end gap-1.5 group" style={{ alignSelf: mine ? "flex-end" : "flex-start", flexDirection: mine ? "row-reverse" : "row", maxWidth: "100%" }}>
                  {!mine && !isAiThread && (
                    <Avatar name={profiles[otherUserId]?.name || "?"} src={profiles[otherUserId]?.avatar_url} size={26} />
                  )}
                  {editingMessageId === m.id ? (
                    <div className="max-w-[78%] flex items-center gap-1.5">
                      <input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEditMessage(); if (e.key === "Escape") setEditingMessageId(null); }}
                        autoFocus
                        className="text-sm px-3 py-2 rounded-2xl outline-none"
                        style={{ background: "#fff", color: T.ink, border: `1px solid ${T.signal}`, minWidth: 160 }}
                      />
                      <button onClick={saveEditMessage} className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: T.signal }}>
                        <Check size={13} color="#FFFFFF" />
                      </button>
                      <button onClick={() => setEditingMessageId(null)} className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: T.panel }}>
                        <X size={13} color={T.sub} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="max-w-[78%] text-[14px] leading-[1.45] px-3.5 py-2.5 shadow-sm"
                      style={{
                        background: mine
                          ? "linear-gradient(145deg,#0E9AA7,#0891B2)"
                          : "#FFFFFF",
                        color: mine ? "#FFFFFF" : T.ink,
                        border: mine ? "none" : `1px solid ${T.line}`,
                        borderRadius: mine ? "18px 18px 5px 18px" : "18px 18px 18px 5px",
                        boxShadow: mine ? "0 4px 14px rgba(8,145,178,0.22)" : "0 1px 2px rgba(15,20,25,0.04)",
                        fontFamily: "Inter, system-ui, sans-serif",
                        letterSpacing: "-0.01em",
                      }}>
                      {type === "image" && m.media_url && <img src={m.media_url} className="rounded-xl mb-1.5 max-w-full" alt="attachment" />}
                      {type === "file" && m.media_url && <a href={m.media_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 underline text-xs mb-1"><Upload size={12} />{m.media_meta?.name || "Attachment"}</a>}
                      {type === "voice" && m.media_url && (
                        <div className="flex items-center gap-2 mb-1 min-w-[180px]">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: mine ? "rgba(255,255,255,0.2)" : "rgba(14,154,167,0.12)" }}>
                            <Mic size={14} color={mine ? "#fff" : "#0E9AA7"} />
                          </div>
                          <audio controls src={m.media_url} className="flex-1 max-w-full" style={{ height: 32, filter: mine ? "invert(1) hue-rotate(180deg)" : "none" }} />
                        </div>
                      )}
                      {type === "link" && m.media_meta && (
                        <div className="rounded-xl p-2.5 mb-1.5" style={{ background: mine ? "rgba(255,255,255,0.12)" : T.paper }}>
                          <div className="text-[11px] font-bold">{m.media_meta.label}</div>
                          {m.media_meta.price && <div className="text-[10px] opacity-80">{m.media_meta.price}</div>}
                        </div>
                      )}
                      {text}
                    </div>
                  )}
                  {/* Envelope receipt tight under bubble (bottom-right for mine) */}
                  {editingMessageId !== m.id && (
                    <div className={`flex items-center gap-0.5 ${mine ? "justify-end" : "justify-start"}`} style={{ marginTop: 1, paddingRight: mine ? 2 : 0, paddingLeft: mine ? 0 : 2 }}>
                      {m.edited_at && <span className="text-[9px] mr-0.5" style={{ color: T.sub }}>edited</span>}
                      {timeLabel && <span className="text-[9px] tabular-nums font-medium mr-0.5" style={{ color: T.sub }}>{timeLabel}</span>}
                      {mine && !isAiThread && (() => {
                        const isRead = (m.read_by || []).some((uid) => String(uid) !== String(currentUser.id))
                          || m.status === "read" || !!m.read_at;
                        const peerOnline = otherUserId && (presence[otherUserId] === "online" || presence[otherUserId] === "busy");
                        const isDelivered = isRead
                          || m.status === "delivered"
                          || !!m.delivered_at
                          || peerOnline;
                        const state = isRead ? "read" : isDelivered ? "delivered" : "sent";
                        return <ChatEnvelopeReceipt state={state} />;
                      })()}
                    </div>
                  )}
                  {mine && !isAiThread && editingMessageId !== m.id && (
                    <div className="relative shrink-0">
                      <button type="button" onClick={(e) => { e.stopPropagation(); setMsgMenuId(msgMenuId === m.id ? null : m.id); }}
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ color: T.sub, background: "rgba(18,22,28,0.06)" }}
                        aria-label="Message options">
                        <MoreVertical size={14} />
                      </button>
                      {msgMenuId === m.id && (
                        <div className="absolute z-30 top-8 right-0 rounded-xl overflow-hidden shadow-lg" style={{ background: "#fff", border: `1px solid ${T.line}`, minWidth: 120 }}>
                          {type === "text" && (
                            <button type="button" onClick={() => startEditMessage(m)} className="w-full text-left text-xs px-3 py-2.5 flex items-center gap-2" style={{ color: T.ink }}>
                              <Edit3 size={12} /> Edit
                            </button>
                          )}
                          <button type="button" onClick={() => deleteMessage(m)} className="w-full text-left text-xs px-3 py-2.5 flex items-center gap-2" style={{ color: "#E0554C" }}>
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
          {msgActionError && <div className="text-center text-xs py-1" style={{ color: "#E0554C" }}>{msgActionError}</div>}
          {peerTyping && !isAiThread && (
            <div className="text-sm px-3.5 py-2.5 rounded-2xl flex items-center gap-2 shadow-sm self-start" style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${T.line}`, color: T.sub, borderRadius: "18px 18px 18px 4px" }}>
              <span className="inline-flex gap-1 items-center" aria-hidden>
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#0E9AA7", animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#0E9AA7", animationDelay: "120ms" }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#0E9AA7", animationDelay: "240ms" }} />
              </span>
              <span className="text-[12px] font-medium" style={{ color: "#5C6570" }}>typing…</span>
            </div>
          )}
          {sending && isAiThread && (
            <div className="text-sm px-3.5 py-2.5 rounded-2xl flex items-center gap-1.5 shadow-sm" style={{ alignSelf: "flex-start", background: "#fff", border: `1px solid ${T.line}`, color: T.sub, borderRadius: "18px 18px 18px 4px" }}>
              <Loader2 size={13} className="animate-spin" /> Merveil AI is typing…
            </div>
          )}
        </div>

        {showEmoji && (
          <div className="px-3 py-2 border-t shrink-0" style={{ borderColor: "rgba(18,22,28,0.1)", background: "#F7F5F1", maxHeight: 168, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "#5C6570" }}>Emojis</div>
              <button type="button" onClick={() => setShowEmoji(false)} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: T.sub }}>Close</button>
            </div>
            <div className="grid grid-cols-8 gap-1">
              {[...(Array.isArray(UAE_REACTIONS) ? UAE_REACTIONS : []), ...(Array.isArray(GLOBAL_EXTRA_EMOJIS) ? GLOBAL_EXTRA_EMOJIS : [])].map((r, i) => (
                <button key={(r.e || r) + (r.label || "") + i} type="button" title={r.label || ""} onClick={() => { setDraft((d) => d + (r.e || r)); setShowEmoji(false); }} className="text-[22px] h-9 flex items-center justify-center rounded-lg active:scale-95" style={{ background: "rgba(14,154,167,0.08)" }}>{r.e || r}</button>
              ))}
            </div>
          </div>
        )}

        {!isAiThread && e2eeUi.label && (
          <div className="mx-3 mt-0.5 mb-0 px-2 py-1 rounded-md text-[9px] leading-tight shrink-0 text-center"
            style={{
              background: e2eeUi.verified ? "rgba(22,101,52,0.06)" : "rgba(14,154,167,0.06)",
              color: e2eeUi.verified ? "#166534" : "#0A5F68",
            }}>
            {e2eeUi.verified ? "🔒 End-to-end encrypted" : e2eeUi.enabled ? "🔐 Securing keys…" : "🔐 Secure transport"}
          </div>
        )}
        {/* AI assistant tools — always visible in human chats (and AI thread) */}
        <div className="px-3 pt-2 pb-1 flex gap-1.5 overflow-x-auto shrink-0" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
          {[
            { label: t("messages.summarize"), prompt: "Summarize this conversation briefly." },
            { label: t("messages.translate"), prompt: "Translate my next message to English and Arabic." },
            { label: t("messages.replyIdea"), prompt: "Suggest a polite, professional reply." },
            { label: t("messages.meeting"), prompt: "Draft a short message to propose a meeting time in Dubai." },
          ].map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => {
                // Put the prompt in the composer so the citizen sees it and can send
                setDraft(chip.prompt);
                try { window.dispatchEvent(new CustomEvent("merveil:open-ai", { detail: { prompt: chip.prompt } })); } catch {}
              }}
              className="text-[11px] font-bold px-3 py-1.5 rounded-full shrink-0"
              style={{ background: "linear-gradient(135deg,#0E9AA7,#06B6D4)", color: "#fff", border: "none", boxShadow: "0 2px 8px rgba(14,154,167,0.28)" }}
            >
              ✦ {chip.label}
            </button>
          ))}
        </div>
        <div
          className="px-2 py-2 border-t flex items-center gap-1.5"
          style={{
            borderColor: T.line,
            background: "#F7F5F1",
            minHeight: 60,
            paddingBottom: "max(8px, env(safe-area-inset-bottom))",
            position: "sticky",
            bottom: 0,
            zIndex: 20,
          }}
        >
          <button type="button" onClick={() => setShowEmoji((s) => !s)} className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: showEmoji ? "rgba(14,154,167,0.15)" : "#fff", border: `1px solid ${T.line}` }} title="Emojis" aria-label="Emojis">
            <span className="text-lg leading-none">😊</span>
          </button>
          {!isAiThread && (
            <>
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*,application/pdf"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAndSend(f, f.type.startsWith("image/") ? "image" : f.type.startsWith("video/") ? "video" : "file"); e.target.value = ""; }} />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#fff", border: `1px solid ${T.line}` }} title="Attach photo, video, or file" aria-label="Attach">
                <Upload size={16} style={{ color: T.ink }} />
              </button>
              <button type="button" onClick={recording ? stopRecording : startRecording} className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: recording ? "#E0554C" : "#fff", border: `1px solid ${recording ? "#E0554C" : T.line}` }} title="Voice message" aria-label="Voice message">
                {recording ? <MicOff size={14} color="#fff" /> : <Mic size={14} style={{ color: "#0E9AA7" }} />}
              </button>
            </>
          )}
          <input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (!isAiThread && e.target.value.trim()) emitTyping();
            }}
            onKeyDown={(e) => e.key === "Enter" && (isAiThread ? sendToAi() : send())}
            placeholder={isOnline ? "Type a message…" : "Offline — will send when back…"}
            disabled={sending}
            className="flex-1 min-w-0 text-[14px] px-3 py-2.5 rounded-full border outline-none min-h-[42px]"
            style={{ borderColor: T.line, background: "#fff", color: T.ink }}
          />
          <button
            type="button"
            onClick={isAiThread ? sendToAi : send}
            disabled={sending}
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(145deg,#0E9AA7,#06B6D4)", opacity: sending ? 0.6 : 1, boxShadow: "0 4px 14px rgba(6,182,212,0.35)" }}
            aria-label="Send message"
          >
            <Send size={16} color="#fff" />
          </button>
        </div>
      </div>

      {/* Chat settings — tones + UAE wallpapers (not Passport) */}
      {showChatSettings && (
        <div className="fixed inset-0 z-[180] flex items-end sm:items-center justify-center" style={{ background: "rgba(15,20,25,0.45)" }} onClick={() => setShowChatSettings(false)}>
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[88vh] overflow-y-auto" style={{ background: "#F7F5F1" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div>
                <div className="text-sm font-bold" style={{ color: "#1A1612", fontFamily: "'Space Grotesk',sans-serif" }}>Chat settings</div>
                <div className="text-[11px]" style={{ color: "#6B6158" }}>Tones & backgrounds · Connect only</div>
              </div>
              <button type="button" onClick={() => setShowChatSettings(false)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.06)" }} aria-label="Close">
                <X size={16} color="#1A1612" />
              </button>
            </div>
            <div className="px-4 pb-6 flex flex-col gap-4">
              <div className="rounded-xl p-3" style={{ background: "#fff", border: "1px solid rgba(18,22,28,0.08)" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold" style={{ color: "#1A1612" }}>Message tones</div>
                  <button
                    type="button"
                    onClick={() => updateChatSettings({ tonesOn: !chatSettings.tonesOn })}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: chatSettings.tonesOn ? "rgba(14,154,167,0.15)" : "rgba(0,0,0,0.06)", color: chatSettings.tonesOn ? "#0E9AA7" : "#6B6158" }}
                  >
                    {chatSettings.tonesOn ? "On" : "Off"}
                  </button>
                </div>
                <label className="block text-[11px] mb-1" style={{ color: "#6B6158" }}>Volume</label>
                <input
                  type="range" min={0} max={1} step={0.05}
                  value={chatSettings.volume}
                  disabled={!chatSettings.tonesOn}
                  onChange={(e) => updateChatSettings({ volume: Number(e.target.value) })}
                  className="w-full"
                />
                <div className="flex gap-2 mt-2">
                  <button type="button" className="text-[10px] font-semibold px-2 py-1 rounded-lg" style={{ background: "rgba(14,154,167,0.1)", color: "#0E9AA7" }} onClick={() => MerveilChatTones.send()}>Send</button>
                  <button type="button" className="text-[10px] font-semibold px-2 py-1 rounded-lg" style={{ background: "rgba(14,154,167,0.1)", color: "#0E9AA7" }} onClick={() => MerveilChatTones.receive()}>Receive</button>
                  <button type="button" className="text-[10px] font-semibold px-2 py-1 rounded-lg" style={{ background: "rgba(14,154,167,0.1)", color: "#0E9AA7" }} onClick={() => MerveilChatTones.typing()}>Typing</button>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold mb-2" style={{ color: "#1A1612" }}>Wallpaper · UAE & Merveil</div>
                <div className="grid grid-cols-2 gap-2">
                  {CHAT_BG_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => updateChatSettings({ bgId: p.id, bgUrl: p.url, customBg: null })}
                      className="rounded-xl overflow-hidden text-left"
                      style={{ border: (chatSettings.bgId === p.id && !chatSettings.customBg) ? "2px solid #0E9AA7" : "1px solid rgba(18,22,28,0.1)" }}
                    >
                      <div className="h-16 bg-cover bg-center" style={{ backgroundImage: `url(${p.url})` }} />
                      <div className="text-[10px] font-medium px-2 py-1.5" style={{ background: "#fff", color: "#1A1612" }}>{p.label}</div>
                    </button>
                  ))}
                </div>
                <input
                  ref={chatBgInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      updateChatSettings({ customBg: reader.result, bgId: "custom" });
                    };
                    reader.readAsDataURL(f);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => chatBgInputRef.current?.click()}
                  className="mt-3 w-full text-xs font-bold py-2.5 rounded-xl"
                  style={{ background: "linear-gradient(135deg,#0E9AA7,#06B6D4)", color: "#fff" }}
                >
                  Upload from phone
                </button>
                {chatSettings.customBg && (
                  <button type="button" className="mt-2 w-full text-[11px] font-semibold py-2 rounded-xl" style={{ color: "#6B6158" }} onClick={() => updateChatSettings({ customBg: null, bgId: "dubai-sunset", bgUrl: "/chat-bg/dubai-sunset.jpg" })}>
                    Clear custom photo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop-only context pane — profile / presence / actions */}
      <aside className="connect-profile-pane hidden lg:flex" aria-label="Conversation context">
        {otherUserId && activeThread && !isAiThread ? (
          <div className="p-5 flex flex-col gap-4 h-full overflow-y-auto">
            <div className="flex flex-col items-center text-center gap-2 pt-2">
              <Avatar name={profiles[otherUserId]?.name || "Citizen"} src={profiles[otherUserId]?.avatar_url} size={72} />
              <div>
                <div className="text-base font-semibold" style={{ color: T.ink }}>{profiles[otherUserId]?.name || `Citizen`}</div>
                <div className="text-xs capitalize mt-0.5" style={{ color: T.sub }}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle" style={{ background: presenceDot(presence[otherUserId] || "offline") }} />
                  {presence[otherUserId] || "offline"}
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <button type="button" onClick={() => startCall("voice")} className="flex-1 text-xs font-semibold py-2.5 rounded-xl" style={{ background: T.paper, color: T.ink }} aria-label="Voice call">Voice</button>
              <button type="button" onClick={() => startCall("video")} className="flex-1 text-xs font-semibold py-2.5 rounded-xl" style={{ background: T.paper, color: T.ink }} aria-label="Video call">Video</button>
            </div>
            <button type="button" onClick={() => setViewingProfileId(otherUserId)} className="w-full text-xs font-bold py-2.5 rounded-xl text-white" style={{ background: "linear-gradient(135deg,#0E7490,#1E3A5F)" }}>
              Open profile
            </button>
            <div className="text-[11px] leading-relaxed" style={{ color: T.sub }}>
              Meaningful connection — presence and messages stay in sync across your devices.
            </div>
          </div>
        ) : isAiThread ? (
          <div className="p-5 flex flex-col gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#06B6D4,#1F2937)" }}>
              <Sparkles size={22} color="#fff" />
            </div>
            <div className="text-sm font-semibold" style={{ color: T.ink }}>Merveil AI</div>
            <p className="text-xs leading-relaxed" style={{ color: T.sub }}>Ask about listings, areas, Passport, or how Merveil works. Answers are guidance — not financial advice.</p>
          </div>
        ) : (
          <div className="p-6 text-xs text-center" style={{ color: T.sub }}>
            Select a citizen to see profile context here on desktop.
          </div>
        )}
      </aside>

      {callError && (
        <div className="fixed left-1/2 -translate-x-1/2 z-[75] px-4 py-2 rounded-full text-xs font-semibold text-white" style={{ bottom: "calc(5rem + var(--safe-bottom))", background: T.signal }} role="status">
          {callError}
        </div>
      )}

      {activeCall && (
        <RealCallScreen
          callId={activeCall.callId}
          role={activeCall.role}
          mode={activeCall.mode}
          otherUser={{ name: callPartnerName || profiles[otherUserId]?.name || `Merveil User #${String(otherUserId).slice(0,8)}` }}
          onEnd={() => setActiveCall(null)}
        />
      )}

      {viewingProfileId && (
        <CreatorProfileModal
          userId={viewingProfileId}
          currentUser={currentUser}
          onClose={() => setViewingProfileId(null)}
          onChat={async (userId) => {
            if (!currentUser) return onSignIn?.();
            try {
              const res = await merveilFetch("/api/conversations", {
                method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ participantIds: [currentUser.id, userId] }),
              });
              const data = await res.json().catch(() => null);
              if (data?.conversation?.id) {
                // Ensure thread appears in list immediately (like Citizens / Circle)
                setThreads((prev) => {
                  if (prev.some((t) => t.id === data.conversation.id)) return prev;
                  return [{
                    ...data.conversation,
                    participant_ids: data.conversation.participant_ids || [currentUser.id, userId],
                    last_message_at: new Date().toISOString(),
                    unread_count: 0,
                  }, ...prev];
                });
                setActiveId(data.conversation.id);
                setConnectTab("messages");
                setMobileView("chat");
                setViewingProfileId(null);
              }
            } catch {}
          }}
          onOpenOwnPassport={() => {
            setViewingProfileId(null);
            window.dispatchEvent(new CustomEvent("merveil:goto-passport"));
          }}
          onPlayPost={() => {
            setViewingProfileId(null);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------
// BUSINESS PAGE — company/professional profile
// ---------------------------------------------------------------


export {
  IncomingConnectionRequests,
  ConnectionSuggestions,
  MyConnectionsPresence,
  merveilHaptic,
  glassChipStyle,
  connectPresenceDot,
  useUnfilteredPresence,
  CitizensTab,
  MyCircleTab,
  TopGroupPostersStrip,
  AreaGroupsView,
  MessagesView,
};
