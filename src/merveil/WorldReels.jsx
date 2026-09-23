/** World Reels — ranking + cards + WorldView (from App.jsx) */

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

const WORLD_CARD_GRADIENTS = [["#1F2937","#374151"],["#06B6D4","#1F2937"],["#6B7280","#2E3D3C"],["#0891B2","#1F2937"]];
// World Reels ranking signals (product V4):
// Familiarity · Discovery · Diversity · Freshness · Serendipity
// Not "biggest creator = biggest reach". Quality + relevance + authenticity.
const WORLD_TECH_TOPICS = new Set([
  "AI & Technology", "Robotics", "Space", "Science", "Engineering",
  "Cybersecurity", "Quantum Computing", "Biotechnology", "Smart Cities",
  "Manufacturing", "Energy", "Entertainment", "Comedy", "Music", "Gaming",
]);

function worldStableNoise(id) {
  const s = String(id || "");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 125; // ~0–8 stable per post id
}

function readWorldAffinity() {
  try {
    const raw = JSON.parse(localStorage.getItem("merveil_world_affinity_v1") || "{}");
    return {
      topics: raw.topics || {},
      creators: raw.creators || {},
      mutedCreators: new Set(raw.mutedCreators || []),
      mutedTopics: new Set(raw.mutedTopics || []),
    };
  } catch {
    return { topics: {}, creators: {}, mutedCreators: new Set(), mutedTopics: new Set() };
  }
}

function bumpWorldAffinity({ topic, creatorId, weight = 1 }) {
  try {
    const raw = JSON.parse(localStorage.getItem("merveil_world_affinity_v1") || "{}");
    const topics = { ...(raw.topics || {}) };
    const creators = { ...(raw.creators || {}) };
    if (topic) topics[topic] = Math.min(50, (Number(topics[topic]) || 0) + weight);
    if (creatorId && String(creatorId) !== "merveil-ai") {
      creators[String(creatorId)] = Math.min(50, (Number(creators[String(creatorId)]) || 0) + weight);
    }
    localStorage.setItem("merveil_world_affinity_v1", JSON.stringify({
      topics,
      creators,
      mutedCreators: raw.mutedCreators || [],
      mutedTopics: raw.mutedTopics || [],
    }));
  } catch {}
}

function muteWorldAffinity({ creatorId, topic }) {
  try {
    const raw = JSON.parse(localStorage.getItem("merveil_world_affinity_v1") || "{}");
    const mutedCreators = [...new Set([...(raw.mutedCreators || []), ...(creatorId ? [String(creatorId)] : [])])];
    const mutedTopics = [...new Set([...(raw.mutedTopics || []), ...(topic ? [topic] : [])])];
    localStorage.setItem("merveil_world_affinity_v1", JSON.stringify({
      topics: raw.topics || {},
      creators: raw.creators || {},
      mutedCreators,
      mutedTopics,
    }));
  } catch {}
}

/**
 * rankWorldReels — balanced discovery order.
 * 1) Score: freshness + engagement quality + familiarity + small-creator lift + serendipity
 * 2) Diversity pass: avoid stacking same creator; avoid long topic runs
 * opts: { userId, affinity }
 */
function rankWorldReels(list, opts = {}) {
  if (!list?.length) return [];
  const affinity = opts.affinity || readWorldAffinity();
  const me = opts.userId ? String(opts.userId) : null;

  const scored = list.map((p) => {
    let score = 0;
    const owner = String(p.owner_id || "");
    const topic = p.topic || "Other";
    const views = Number(p.views) || Number(p.valid_views) || 0;
    const likes = Number(p.likes_count) || 0;
    const supers = Number(p.super_count) || 0;
    const saves = Number(p.saves_count) || Number(p.save_count) || 0;
    const comments = Number(p.comments_count) || 0;

    // --- Freshness (recent content gets an opening)
    const ts = p.created_at ? new Date(p.created_at).getTime() : 0;
    const ageH = ts ? Math.max(0, (Date.now() - ts) / 3600000) : 9999;
    if (ageH < 6) score += 36;
    else if (ageH < 24) score += 28;
    else if (ageH < 72) score += 18;
    else if (ageH < 168) score += 10;
    else score += Math.max(0, 8 - ageH / 168);

    // --- Engagement quality (rate > raw volume)
    if (views > 0) {
      const er = (likes + supers * 3 + saves * 2 + comments) / Math.max(views, 1);
      score += Math.min(42, er * 220);
      score += Math.min(18, Math.log10(views + 1) * 7);
    } else {
      // Brand-new posts: fair opening, not buried under old high-view content
      score += 14;
    }
    score += Math.min(16, supers * 1.4);
    score += Math.min(10, saves * 1.2);

    // --- Familiarity (citizen’s local affinity from likes/supers/saves)
    score += Math.min(28, (Number(affinity.topics[topic]) || 0) * 1.25);
    if (owner) score += Math.min(22, (Number(affinity.creators[owner]) || 0) * 1.4);

    // --- Category presence (light, not dominant)
    if (WORLD_TECH_TOPICS.has(topic)) score += 4;

    // --- Small-creator opportunity (quality over follower size)
    if (owner && owner !== "merveil-ai" && views < 800 && (likes + supers + saves) > 0) score += 14;
    if (owner && owner !== "merveil-ai" && views < 200) score += 6;

    // --- Own content mild boost (publish path already jumps to index 0)
    if (me && owner && owner === me) score += 8;

    // --- Mutes
    if (owner && affinity.mutedCreators.has(owner)) score -= 2000;
    if (affinity.mutedTopics.has(topic)) score -= 800;

    // --- Serendipity (stable per id — no re-rank flicker)
    score += worldStableNoise(p.id);

    return { p, score, owner, topic };
  });

  scored.sort((a, b) => b.score - a.score);

  // Diversity pass: no back-to-back same creator when alternatives exist;
  // no 3-in-a-row same topic when alternatives exist.
  const out = [];
  const used = new Set();
  const creatorLast = new Map();
  const topicWindow = [];

  const pickNext = () => {
    for (let i = 0; i < scored.length; i++) {
      if (used.has(i)) continue;
      const c = scored[i];
      const lastC = creatorLast.get(c.owner);
      if (
        c.owner &&
        lastC != null &&
        out.length - lastC < 2 &&
        scored.some((x, j) => !used.has(j) && x.owner && x.owner !== c.owner)
      ) {
        continue;
      }
      if (
        topicWindow.length >= 2 &&
        topicWindow[topicWindow.length - 1] === c.topic &&
        topicWindow[topicWindow.length - 2] === c.topic &&
        scored.some((x, j) => !used.has(j) && x.topic !== c.topic)
      ) {
        continue;
      }
      return i;
    }
    for (let i = 0; i < scored.length; i++) if (!used.has(i)) return i;
    return -1;
  };

  while (out.length < scored.length) {
    const i = pickNext();
    if (i < 0) break;
    used.add(i);
    const c = scored[i];
    out.push(c.p);
    if (c.owner) creatorLast.set(c.owner, out.length - 1);
    topicWindow.push(c.topic);
  }

  return out;
}
// Real, honestly-implemented reactions beyond a plain like — each one is a
// genuine stored, countable action (see world_reactions table), not just
// decorative UI. This is a meaningful subset of the full spec (Support,
// Invest, Collaborate, Hire, Request Meeting cover the highest-value
// business intents); more can be added the same way later.
const WORLD_REACTIONS = [
  { id: "support", label: "Support", icon: "🤝" },
  { id: "invest", label: "Invest", icon: "💰" },
  { id: "collaborate", label: "Collaborate", icon: "🔗" },
  { id: "hire", label: "Hire", icon: "💼" },
  { id: "meeting", label: "Request Meeting", icon: "📅" },
];

function WorldCard({ post, liked, onToggleLike, onOpen, onChat, onConnect, onOpenCreator, connectState, currentUser, onEdit, onDelete }) {
  const grad = WORLD_CARD_GRADIENTS[Math.abs((post.id||"").split("").reduce((a,c)=>a+c.charCodeAt(0),0)) % WORLD_CARD_GRADIENTS.length];
  const cState = connectState || "idle"; // idle | pending | accepted | busy
  const isOwner = currentUser && post.owner_id && String(currentUser.id) === String(post.owner_id);
  const [showOwnerMenu, setShowOwnerMenu] = useState(false);
  return (
    <div className="rounded-2xl border overflow-hidden mb-3 cursor-pointer relative"
      style={{ borderColor:"#E5E7EB", background:"#fff" }} onClick={() => onOpen(post)}>
      <div className="h-2 w-full" style={{ background:`linear-gradient(90deg,${grad[0]},${grad[1]})` }}/>
      {post.photo_url && (
        <div className="relative">
          <img src={post.photo_url} alt="" className="w-full object-cover" style={{ height:150 }}/>
          <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: post.content_origin === "ai" ? "#0E9AA7" : "#1F2937", color: "#fff" }}
            title={post.content_origin === "ai" ? "AI-assisted content" : "Made by a real human"}>
            {post.content_origin === "ai" ? "AI®" : "RH"}
          </span>
        </div>
      )}
      {post.video_url && !post.photo_url && (
        <div className="relative bg-black" style={{ height: 150 }}>
          <video src={post.video_url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
          <span className="absolute bottom-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}>Reel</span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          {(post.owner_name || post.owner_avatar) ? (
            <button onClick={(e) => { e.stopPropagation(); onOpenCreator?.(post.owner_id); }}
              className="flex items-center gap-1.5 min-w-0">
              {post.owner_avatar
                ? <img src={post.owner_avatar} alt="" className="w-5 h-5 rounded-full object-cover shrink-0"/>
                : <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ background: "#1F2937" }}>{(post.owner_name||"?")[0]}</div>}
              <span className="text-[11px] font-semibold truncate" style={{ color: "#374151" }}>{post.owner_name || "Merveil Citizen"}</span>
              {!post.photo_url && !post.video_url && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1 shrink-0"
                  style={{ background: post.content_origin === "ai" ? "#0E9AA718" : "#1F293718", color: post.content_origin === "ai" ? "#0E9AA7" : "#1F2937" }}>
                  {post.content_origin === "ai" ? "AI®" : "RH"}
                </span>
              )}
            </button>
          ) : <div />}
          {isOwner && (
            <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => setShowOwnerMenu((v) => !v)}
                className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#F3F4F6" }}
                aria-label="Post tools">
                <MoreVertical size={14} style={{ color: "#6B7280" }} />
              </button>
              {showOwnerMenu && (
                <div className="absolute right-0 top-9 z-20 rounded-xl overflow-hidden shadow-lg border" style={{ background: "#fff", borderColor: "#E5E7EB", minWidth: 140 }}>
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-left hover:bg-gray-50"
                    style={{ color: "#1F2937" }}
                    onClick={() => { setShowOwnerMenu(false); onEdit?.(post); }}>
                    <Edit3 size={14} /> Edit
                  </button>
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-left hover:bg-red-50"
                    style={{ color: "#DC2626" }}
                    onClick={() => {
                      setShowOwnerMenu(false);
                      if (window.confirm("Delete this World post permanently?")) onDelete?.(post);
                    }}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background:"#0EA5E918", color:"#0369A1", border:"1px solid #0EA5E944" }}>
            {post.topic || "Innovation"}
          </span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-1"
            style={{ background:"#F9FAFB", color:"#6B7280" }}>
            <Globe size={9}/> {post.country || "Global"}
          </span>
        </div>
        <div className="text-sm font-bold mb-1" style={{ color:"#1F2937" }}>{post.title}</div>
        {post.description && (
          <p className="text-xs mb-3 line-clamp-2" style={{ color:"#6B7280" }}>{post.description}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs" style={{ color:"#6B7280" }}>
            <span className="flex items-center gap-1"><Eye size={11}/>{post.views||0}</span>
            <button onClick={(e)=>{e.stopPropagation(); onToggleLike(post);}}
              className="flex items-center gap-1" style={{ color: liked ? "#E0554C" : "#6B7280" }}>
              <Heart size={11} fill={liked?"#E0554C":"none"}/>{post.likes_count||0}
            </button>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (cState === "accepted") { onChat?.(post); return; }
              if (cState === "pending" || cState === "busy") return;
              onConnect?.(post);
            }}
            disabled={cState === "busy" || cState === "pending"}
            className="text-xs font-semibold py-1.5 px-3 rounded-xl flex items-center gap-1"
            style={{
              background: cState === "accepted" ? "#1F7A4D" : cState === "pending" ? "#E5E7EB" : "#1F2937",
              color: cState === "pending" ? "#6B7280" : "#fff",
              opacity: cState === "busy" ? 0.7 : 1,
            }}>
            {cState === "accepted" ? "Message" : cState === "pending" ? "Requested" : cState === "busy" ? "…" : "Connect"}
          </button>
        </div>
      </div>
    </div>
  );
}

function WorldReelCardImpl({ post, isActive, liked, supered, saved, onToggleLike, onToggleSuper, onToggleSave, onCall, onOpenCreator, onChat, forceMuted, compact, currentUser, onRequireSignIn, onEdit, onDelete, onNotInterested }) {
  const videoRef = useRef(null);
  const songRef = useRef(null);
  // Prefer sound on (TikTok-style). Browsers may still force mute until gesture — we fall back.
  const [muted, setMuted] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [showOwnerMenu, setShowOwnerMenu] = useState(false);
  const [showInterestMenu, setShowInterestMenu] = useState(false);
  const [showMoreTools, setShowMoreTools] = useState(false);
  const isOwner = currentUser && post.owner_id && String(currentUser.id) === String(post.owner_id);

  useEffect(() => {
    setVideoError(false);
    setVideoReady(false);
  }, [post?.id, post?.video_url]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !post?.video_url) return;
    if (isActive) {
      el.playsInline = true;
      el.setAttribute("playsinline", "");
      el.setAttribute("webkit-playsinline", "");
      // Prefer sound; satellites always muted. Browser may force mute — we handle that.
      const shouldMute = !!forceMuted || muted;
      el.muted = shouldMute;
      el.defaultMuted = shouldMute;
      const tryPlay = () => {
        try {
          el.playsInline = true;
          el.setAttribute("playsinline", "");
          el.setAttribute("webkit-playsinline", "");
        } catch {}
        const attempt = el.play();
        if (attempt?.catch) {
          attempt.catch(() => {
            // Autoplay blocked with sound — fall back to muted so picture still plays
            if (!el.muted) {
              el.muted = true;
              el.defaultMuted = true;
              setMuted(true);
              el.play().catch(() => {});
            }
          });
        }
      };
      tryPlay();
      const t = setTimeout(tryPlay, 200);
      const t2 = setTimeout(tryPlay, 600);
      // Real World-reel views only (not property / passport). Skip seeds.
      // Optimistic local bump so VIEWS updates without waiting for a full reload.
      if (!compact && post?.id && !post?._seed) {
        try {
          window.dispatchEvent(new CustomEvent("merveil:world-view-bump", { detail: { postId: post.id } }));
        } catch {}
        merveilFetch("/api/world?action=view", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId: post.id, source: "world_reels" }),
        }).catch(() => {});
      }
      return () => { clearTimeout(t); clearTimeout(t2); };
    } else {
      el.pause();
      try { el.currentTime = 0; } catch {}
    }
  }, [isActive, muted, forceMuted, post?.id, post?.video_url, compact]);

  // Attached World song (library) — plays with active reel
  useEffect(() => {
    const song = findMerveilSong(post?.music_track_id) || (post?.music_url ? { preview_url: post.music_url, title: post.music_title } : null);
    if (!song?.preview_url) {
      try { songRef.current?.pause(); } catch {}
      return;
    }
    if (!songRef.current) songRef.current = new Audio();
    const a = songRef.current;
    if (isActive && !forceMuted) {
      if (a.src !== song.preview_url) a.src = song.preview_url;
      a.loop = true;
      a.muted = muted;
      a.volume = muted ? 0 : 0.85;
      a.play().catch(() => {});
    } else {
      try { a.pause(); } catch {}
    }
    return () => { try { a.pause(); } catch {} };
  }, [isActive, forceMuted, muted, post?.music_track_id, post?.music_url, post?.id]);

  const share = (e) => {
    e.stopPropagation();
    const origin = typeof window !== "undefined" ? window.location.origin : "https://www.junction.technology";
    // /api/share serves crawler OG tags with the reel photo; humans redirect into the app
    const url = `${origin}/api/share?type=world&id=${encodeURIComponent(post.id)}`;
    const imageUrl = post.photo_url || post.cover_url || post.poster_url || post.thumbnail_url
      || `${origin}/icons/icon-512.png`;
    shareMerveilContent({
      title: post.title || "World reel",
      text: post.caption || post.title || "Watch on Merveil World",
      url,
      imageUrl,
    });
  };

  const repost = async (e) => {
    e.stopPropagation();
    if (!currentUser) { onRequireSignIn?.(); return; }
    if (reposted) return;
    setReposted(true);
    try {
      const isSeed = post?._seed || String(post?.id || "").startsWith("merveil-ai-seed");
      // Seeds are not in the DB — duplicate by creating a real citizen post with same media
      if (isSeed) {
        const res = await merveilFetch("/api/world", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: post.title ? `Repost: ${String(post.title).slice(0, 180)}` : "Repost",
            description: post.description || post.caption || null,
            topic: post.topic || "Innovation",
            country: post.country || "Global",
            videoUrl: post.video_url || null,
            photoUrls: post.photo_url ? [post.photo_url] : (post.photo_urls || null),
            mediaType: post.media_type || (post.video_url ? "video" : "photo"),
            contentOrigin: "human",
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setReposted(false);
          alert(data?.error || "Couldn't duplicate this reel. Try again.");
          return;
        }
        try { window.dispatchEvent(new CustomEvent("merveil:world-reposted", { detail: data?.post })); } catch {}
        return;
      }
      const res = await merveilFetch("/api/world?action=repost", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setReposted(false);
        alert(data?.error || "Couldn't repost. Try again.");
        return;
      }
      try { window.dispatchEvent(new CustomEvent("merveil:world-reposted", { detail: data?.post })); } catch {}
    } catch {
      setReposted(false);
      alert("Network error — couldn't repost.");
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: "#0B0E14" }}>
      {/* Never pure black: gradient base so network lag never looks "broken" */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(160deg,#1F2937 0%,#0E9AA755 50%,#0B0E14 100%)" }} />
      {/* Poster first so content is visible immediately (no black “Loading reel…”) */}
      {(post.photo_url || post.poster_url || post.cover_url || post.thumbnail_url) && (
        <img
          src={post.photo_url || post.poster_url || post.cover_url || post.thumbnail_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: post.video_url && videoReady && !videoError ? 0 : 1, transition: "opacity 180ms ease" }}
        />
      )}
      {post.video_url && !videoError ? (
        <video
          ref={videoRef}
          key={post.video_url}
          src={post.video_url}
          className="absolute inset-0 w-full h-full object-cover bg-black"
          style={{ opacity: videoError ? 0 : 1, background: "#000" }}
          loop
          muted={!!forceMuted || muted}
          playsInline
          webkit-playsinline=""
          x5-playsinline=""
          x5-video-player-type="h5"
          autoPlay
          preload="auto"
          controls={false}
          disablePictureInPicture
          poster={post.photo_url || post.poster_url || post.cover_url || post.thumbnail_url || undefined}
          onLoadStart={() => { setVideoReady(false); }}
          onLoadedData={() => { setVideoReady(true); try { videoRef.current?.play()?.catch(() => {}); } catch {} }}
          onCanPlay={() => { setVideoReady(true); try { videoRef.current?.play()?.catch(() => {}); } catch {} }}
          onPlaying={() => setVideoReady(true)}
          onError={() => setVideoError(true)}
        />
      ) : !post.photo_url && !post.poster_url && !post.cover_url ? (
        null
      ) : null}
      {videoError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none px-6 text-center">
          <div className="text-sm font-bold text-white/90">{post.title || "World Reel"}</div>
          <div className="text-[11px] text-white/55">Video unavailable — swipe or Post your own</div>
        </div>
      )}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.35) 0%, transparent 22%, transparent 55%, rgba(0,0,0,.75) 100%)" }}/>
      {!compact && (
      <button type="button" onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          const next = !muted;
          setMuted(next);
          const el = videoRef.current;
          if (el) {
            el.muted = next;
            el.defaultMuted = next;
            if (!next) {
              // Unmute requires a fresh play() after user gesture
              const p = el.play();
              if (p?.catch) p.catch(() => {});
            }
          }
        }}
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.2)" }}
        title={muted ? "Unmute" : "Mute"}>
        {muted ? <VolumeX size={18} color="#fff"/> : <Volume2 size={18} color="#fff"/>}
      </button>
      )}
      {!compact && (post.content_origin === "ai" || post._seed) && (
      <span className="absolute top-4 left-4 z-10 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
        style={{ background: "rgba(14,154,167,0.92)", color: "#fff", letterSpacing: "0.06em" }}>
        AI
      </span>
      )}

      {/* Circular 3D Mini brand — short “Merveil AI” only */}
      {!compact && (
        <MerveilAiMiniMark aiGenerated={post.content_origin === "ai" || !!post._seed} />
      )}

      {compact ? (
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          <div className="text-[11px] font-semibold text-white line-clamp-1" style={{ textShadow: "0 1px 3px rgba(0,0,0,.6)" }}>{post.title}</div>
        </div>
      ) : (
        <>
          {/* Right rail — max 4 tools: Super, Comments, Connect, Call; rest in … */}
          <div
            className="absolute right-2 flex flex-col items-center gap-3 pointer-events-auto"
            style={{ bottom: "calc(88px + var(--safe-bottom, 0px))", zIndex: 50 }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <button type="button" onClick={(e) => { e.stopPropagation(); onToggleSuper?.(post); }} className="flex flex-col items-center gap-0.5 pointer-events-auto">
              <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: supered ? "rgba(6,182,212,0.35)" : "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", border: supered ? "1.5px solid #06B6D4" : "1px solid transparent" }}>
                <Zap size={20} color={supered ? "#06B6D4" : "#fff"} fill={supered ? "#06B6D4" : "none"} />
              </div>
              <span className="text-[10px] font-semibold text-white" style={{ textShadow: "0 1px 3px rgba(0,0,0,.7)" }}>{post.super_count || 0}</span>
              <span className="text-[8px] font-bold tracking-wide" style={{ color: supered ? "#67E8F9" : "rgba(255,255,255,0.7)" }}>SUPER</span>
            </button>
            <div className="flex flex-col items-center gap-0.5 pointer-events-none" aria-label="Views">
              <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}>
                <Eye size={18} color="#fff" />
              </div>
              <span className="text-[10px] font-semibold text-white" style={{ textShadow: "0 1px 3px rgba(0,0,0,.7)" }}>{(Number(post.views) || Number(post.views_count) || 0).toLocaleString()}</span>
              <span className="text-[8px] font-bold tracking-wide text-white/70">VIEWS</span>
            </div>
            <button type="button" onClick={(e) => { e.stopPropagation(); currentUser ? setShowComments(true) : onRequireSignIn?.(); }} className="flex flex-col items-center gap-0.5 pointer-events-auto">
              <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}>
                <MessageSquare size={18} color="#fff" />
              </div>
              <span className="text-[10px] font-semibold text-white" style={{ textShadow: "0 1px 3px rgba(0,0,0,.7)" }}>{post.comments_count || 0}</span>
              <span className="text-[8px] font-bold tracking-wide text-white/70">COMMENTS</span>
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); currentUser ? onChat?.() : onRequireSignIn?.(); }} className="flex flex-col items-center gap-0.5 pointer-events-auto">
              <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}>
                <UserPlus size={18} color="#fff" />
              </div>
              <span className="text-[8px] font-bold tracking-wide text-white/70">CONNECT</span>
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); currentUser ? onCall?.("voice") : onRequireSignIn?.(); }} className="flex flex-col items-center gap-0.5 pointer-events-auto">
              <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "rgba(6,182,212,0.95)" }}>
                <AnimatedPhone size={18} color="#fff"/>
              </div>
              <span className="text-[8px] font-bold tracking-wide text-white/90">CALL</span>
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); setShowMoreTools((v) => !v); setShowInterestMenu(false); setShowOwnerMenu(false); }} className="flex flex-col items-center gap-0.5 pointer-events-auto">
              <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: showMoreTools ? "rgba(14,154,167,0.45)" : "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}>
                <MoreHorizontal size={18} color="#fff" />
              </div>
              <span className="text-[8px] font-bold tracking-wide text-white/70">MORE</span>
            </button>
          </div>

          {showMoreTools && (
            <div className="absolute right-16 z-30 rounded-xl overflow-hidden shadow-xl" style={{ bottom: "calc(88px + var(--safe-bottom, 0px))", background: "rgba(17,24,39,0.96)", border: "1px solid rgba(255,255,255,0.12)", minWidth: 168 }}
              onClick={(e) => e.stopPropagation()}>
              <button type="button" className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-white hover:bg-white/10"
                onClick={() => { setShowMoreTools(false); share(); }}>
                <Share2 size={14} /> Share
              </button>
              <button type="button" className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-white hover:bg-white/10"
                onClick={() => { setShowMoreTools(false); currentUser ? onToggleSave?.() : onRequireSignIn?.(); }}>
                <Bookmark size={14} color={saved ? "#FBBF24" : "#fff"} /> {saved ? "Saved · in profile" : "Save to profile"}
              </button>
              <button type="button" className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-white hover:bg-white/10"
                onClick={() => {
                  setShowMoreTools(false);
                  try {
                    window.dispatchEvent(new CustomEvent("merveil:world-download", { detail: { post } }));
                  } catch {}
                }}>
                <Download size={14} color="#fff" /> Download video
              </button>
              <button type="button" className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-white hover:bg-white/10"
                onClick={() => { setShowMoreTools(false); repost(); }}>
                <Repeat2 size={14} color={reposted ? "#34D399" : "#fff"} /> Repost
              </button>
              <div className="px-3 py-2 text-[10px] text-white/80 flex items-center gap-1.5 border-t border-white/10">
                <Eye size={12} /> {(Number(post.views) || Number(post.views_count) || 0).toLocaleString()} views
              </div>
              {isOwner ? (
                <>
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-white hover:bg-white/10 border-t border-white/10"
                    onClick={() => { setShowMoreTools(false); onEdit?.(post); }}>
                    <Edit3 size={14} /> Edit reel
                  </button>
                  <button type="button" className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold hover:bg-white/10" style={{ color: "#F87171" }}
                    onClick={() => { setShowMoreTools(false); if (window.confirm("Delete this World reel permanently?")) onDelete?.(post); }}>
                    <Trash2 size={14} /> Delete
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="w-full text-left px-3 py-2.5 text-xs font-semibold text-white hover:bg-white/10 border-t border-white/10"
                    onClick={() => { setShowMoreTools(false); onNotInterested?.(post, "post"); }}>Not interested</button>
                  <button type="button" className="w-full text-left px-3 py-2.5 text-xs font-semibold text-white hover:bg-white/10"
                    onClick={() => { setShowMoreTools(false); onNotInterested?.(post, "topic"); }}>Show less like this</button>
                  {post.owner_id && post.owner_id !== "merveil-ai" && (
                    <button type="button" className="w-full text-left px-3 py-2.5 text-xs font-semibold text-white hover:bg-white/10"
                      onClick={() => { setShowMoreTools(false); onNotInterested?.(post, "creator"); }}>Don’t recommend creator</button>
                  )}
                </>
              )}
            </div>
          )}

          {showOwnerMenu && isOwner && (
            <div className="absolute right-16 bottom-36 z-30 rounded-xl overflow-hidden shadow-xl" style={{ background: "rgba(17,24,39,0.95)", border: "1px solid rgba(255,255,255,0.12)", minWidth: 140 }}
              onClick={(e) => e.stopPropagation()}>
              <button type="button" className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-white hover:bg-white/10"
                onClick={() => { setShowOwnerMenu(false); onEdit?.(post); }}>
                <Edit3 size={14} /> Edit reel
              </button>
              <button type="button" className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold" style={{ color: "#F87171" }}
                onClick={() => {
                  setShowOwnerMenu(false);
                  if (window.confirm("Delete this World reel permanently?")) onDelete?.(post);
                }}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}

          {showInterestMenu && !isOwner && (
            <div className="absolute right-16 bottom-28 z-30 rounded-xl overflow-hidden shadow-xl" style={{ background: "rgba(17,24,39,0.96)", border: "1px solid rgba(255,255,255,0.12)", minWidth: 180 }}
              onClick={(e) => e.stopPropagation()}>
              <button type="button" className="w-full text-left px-3 py-2.5 text-xs font-semibold text-white hover:bg-white/10"
                onClick={() => { setShowInterestMenu(false); onNotInterested?.(post, "post"); }}>
                Not interested
              </button>
              <button type="button" className="w-full text-left px-3 py-2.5 text-xs font-semibold text-white hover:bg-white/10"
                onClick={() => { setShowInterestMenu(false); onNotInterested?.(post, "topic"); }}>
                Show less like this
              </button>
              {post.owner_id && post.owner_id !== "merveil-ai" && (
                <button type="button" className="w-full text-left px-3 py-2.5 text-xs font-semibold text-white hover:bg-white/10"
                  onClick={() => { setShowInterestMenu(false); onNotInterested?.(post, "creator"); }}>
                  Don’t recommend this creator
                </button>
              )}
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4 z-10" style={{ paddingRight: 80 }}>
            <button onClick={(e) => { e.stopPropagation(); onOpenCreator?.(post.owner_id); }}
              className="flex items-center gap-1.5 mb-2">
              <span className="relative inline-flex shrink-0">
                {post.owner_avatar
                  ? <img src={post.owner_avatar} alt="" className="w-8 h-8 rounded-full object-cover border-2" style={{ borderColor: "#fff" }}/>
                  : <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white border-2" style={{ background: "#06B6D4", borderColor: "#fff" }}>{(post.owner_name||"?")[0]}</div>}
                {(post.owner_status === "online" || post.owner_status === "busy" || post._ownerOnline) && (
                  <span className="absolute -bottom-0.5 -right-0.5">
                    <PresenceDot status={post.owner_status || "online"} size={9} />
                  </span>
                )}
              </span>
              <span className="text-sm font-semibold text-white inline-flex items-center gap-1">
                {post.owner_name
                  || (String(post.owner_id || "") === "merveil-ai" || post.content_origin === "ai" || post.content_origin === "seed" ? "Merveil AI" : null)
                  || "Citizen"}
                {isNewCitizen({ created_at: post.owner_created_at }) && <NewEmojiBadge show />}
              </span>
            </button>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full inline-block mb-1.5" style={{ background: "#0EA5E933", color: "#7DD3FC" }}>{post.topic}</span>
            <div className="text-base font-bold text-white mb-1">{post.title}</div>
            {post.description && <p className="text-xs mb-3 line-clamp-2" style={{ color: "rgba(255,255,255,.85)" }}>{post.description}</p>}
            <button onClick={(e) => { e.stopPropagation(); onChat?.(); }}
              className="text-xs font-semibold px-3.5 py-2 rounded-full flex items-center gap-1.5"
              style={{ background: "#06B6D4", color: "#fff" }}>
              <span aria-hidden style={{ fontSize: 13, lineHeight: 1 }}>💌</span> Chat
            </button>
          </div>

          {showComments && (
            <CommentsModal targetType="world_post" targetId={post.id} title={post.title}
              currentUser={currentUser} onRequireSignIn={onRequireSignIn} onClose={() => setShowComments(false)}
              onCommentPosted={() => {
                // Force a visible bump on the reel rail (parent holds posts state)
                try {
                  window.dispatchEvent(new CustomEvent("merveil:world-comment", { detail: { postId: post.id } }));
                } catch {}
              }} />
          )}
        </>
      )}
    </div>
  );
}

function PostWorldModal({ onClose, onPublish, defaultAsReel = false, editPost = null }) {
  // Multi-step World Studio: Media → Edit → Details → Publish
  // Controls that affect the preview (speed, mute, cover frame) are real — not decorative.
  const STEPS = ["media", "edit", "details", "publish"];
  const [step, setStep] = useState(editPost?.video_url || editPost?.id ? "edit" : "media");
  const [form, setForm] = useState({
    title: editPost?.title || "",
    topic: editPost?.topic || WORLD_TOPICS[0],
    country: editPost?.country || "",
    description: editPost?.description || "",
    contentOrigin: editPost?.content_origin || "human",
    videoUrl: editPost?.video_url || "",
    photoUrls: editPost?.photo_urls || (editPost?.photo_url ? [editPost.photo_url] : []),
    mediaType: editPost?.media_type || (defaultAsReel ? "video" : "photo"),
    musicTrackId: editPost?.music_track_id || null,
    musicTitle: editPost?.music_title || null,
    musicUrl: editPost?.music_url || null,
  });
  const [songGenre, setSongGenre] = useState("all");
  const [songQuery, setSongQuery] = useState("");
  const [songPreviewId, setSongPreviewId] = useState(null);
  const songAudioRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [videoPreview, setVideoPreview] = useState(editPost?.video_url || null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [muted, setMuted] = useState(true);
  const [coverDataUrl, setCoverDataUrl] = useState(editPost?.photo_url || null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [durationSec, setDurationSec] = useState(null);
  const [sourceFile, setSourceFile] = useState(null); // original File for trim/re-upload
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(60);
  const [trimming, setTrimming] = useState(false);
  const videoInputRef = useRef(null);
  const previewRef = useRef(null);
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const isEdit = !!editPost?.id;

  // Apply real playback rate + mute to the preview element
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    el.playbackRate = playbackRate;
    el.muted = muted;
  }, [playbackRate, muted, videoPreview, step]);

  const onVideoPick = async (e) => {
    let file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const isVideo = (file.type && file.type.startsWith("video/"))
      || /\.(mp4|mov|webm|m4v|mkv|3gp|avi)$/i.test(file.name || "");
    if (!isVideo) { setError("Please pick a video file (mp4, mov, webm…)."); return; }
    if (file.size > 80 * 1024 * 1024) { setError("Video must be under 80 MB."); return; }

    setError("");
    setUploading(true);
    setStep("edit");
    const compressAbort = { current: new AbortController() };
    try {
      setError("Optimizing video for World…");
      const result = await compressWorldVideoFile(file, {
        signal: compressAbort.current.signal,
        onProgress: (p) => {
          try {
            if (typeof p === "number") setError(`Optimizing video… ${Math.round(p * 100)}%`);
          } catch {}
        },
      });
      if (result.code === "ABORTED") {
        setError("Compression cancelled — pick the video again to retry.");
        setUploading(false);
        return;
      }
      if (result.compressed && result.file) {
        file = result.file;
        const from = ((result.originalBytes || 0) / 1e6).toFixed(1);
        const to = ((result.bytes || file.size) / 1e6).toFixed(1);
        setError(`Optimized ${from}MB → ${to}MB · ready`);
      } else if (result.error && result.code && !["SKIP_SMALL", "NOT_SMALLER", "NO_MEDIARECORDER", "NO_MIME"].includes(result.code)) {
        setError(`${result.error} — continuing with original`);
      } else {
        setError("");
      }
    } catch (err) {
      setError(`Optimize skipped — ${err?.message || "using original file"}`);
    }

    const localUrl = URL.createObjectURL(file);
    setVideoPreview(localUrl);
    setCoverDataUrl(null);
    if (!form.title.trim()) upd("title", file.name.replace(/\.[^.]+$/, "").slice(0, 80) || "World Reel");

    const duration = await new Promise((resolve) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => resolve(v.duration);
      v.onerror = () => resolve(null);
      v.src = localUrl;
    });
    setDurationSec(duration);
    setSourceFile(file);
    if (duration && duration > 60) {
      // Stay on edit step with trim controls — do not upload yet
      setTrimStart(0);
      setTrimEnd(60);
      setError(`This video is ${Math.round(duration)}s — trim to 60s max, then Continue.`);
      setUploading(false);
      return;
    }
    setTrimStart(0);
    setTrimEnd(duration ? Math.min(60, duration) : 60);

    let stepLabel = "preparing the upload";
    try {
      // Soft-restore session so upload does not 401 after a quiet tab
      try {
        const sess = await fetch("/api/auth/session", { credentials: "include" }).then((r) => r.json()).catch(() => null);
        if (sess?.user?.id) {
          try { window.dispatchEvent(new CustomEvent("merveil:session-user", { detail: sess.user })); } catch {}
        }
      } catch {}

      const urlRes = await merveilFetch("/api/people?action=video-upload-url", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name }),
      });
      const urlData = await urlRes.json().catch(() => ({}));
      if (!urlRes.ok) {
        if (urlRes.status === 401) {
          setError("Session expired — close this sheet, sign in, then post again.");
        } else {
          setError(urlData.error || "Couldn't prepare the upload.");
        }
        setUploading(false);
        return;
      }

      stepLabel = "uploading to Supabase storage";
      let uploaded = false;
      if (urlData.signedUrl) {
        const putHeaders = { "Content-Type": file.type || "video/mp4", "x-upsert": "true" };
        if (urlData.token) putHeaders["Authorization"] = `Bearer ${urlData.token}`;
        try {
          const putRes = await fetch(urlData.signedUrl, { method: "PUT", body: file, headers: putHeaders });
          if (putRes.ok) {
            upd("videoUrl", urlData.publicUrl);
            upd("mediaType", "video");
            uploaded = true;
          }
        } catch { /* fall through to server upload */ }
      }
      if (!uploaded) {
        stepLabel = "uploading via server";
        const fd = new FormData();
        fd.append("file", file, file.name);
        fd.append("folder", "reels");
        const serverRes = await merveilFetch("/api/people?action=upload", { method: "POST", body: fd });
        const serverData = await serverRes.json().catch(() => ({}));
        if (!serverRes.ok || !serverData.url) {
          setError(
            serverRes.status === 401
              ? "Session expired — sign in again, then post."
              : (serverData.error || "Video upload failed — try a shorter clip under 40 MB.")
          );
          setUploading(false);
          return;
        }
        upd("videoUrl", serverData.url);
        upd("mediaType", "video");
      }
    } catch (err) {
      setError(
        stepLabel.startsWith("uploading")
          ? "Couldn't reach storage — check network, then try again."
          : `Couldn't reach the server while ${stepLabel} — ${err.message || "retry"}`
      );
    } finally {
      setUploading(false);
    }
  };

  // Client-side trim: play selected window and re-encode via MediaRecorder (max 60s)
  const trimVideoToLimit = async () => {
    if (!sourceFile || !videoPreview) {
      setError("Pick a video first.");
      return;
    }
    const total = durationSec || 0;
    let start = Math.max(0, Number(trimStart) || 0);
    let end = Math.min(total || 60, Number(trimEnd) || 60);
    if (end - start > 60) end = start + 60;
    if (end <= start + 0.5) {
      setError("Trim window must be at least 1 second.");
      return;
    }
    setTrimming(true);
    setError("");
    try {
      const src = document.createElement("video");
      src.src = videoPreview;
      src.muted = true;
      src.playsInline = true;
      src.preload = "auto";
      await new Promise((resolve, reject) => {
        src.onloadedmetadata = () => resolve();
        src.onerror = () => reject(new Error("Couldn't load video for trim"));
      });
      const w = src.videoWidth || 720;
      const h = src.videoHeight || 1280;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      const stream = canvas.captureStream(30);
      // Prefer mp4 when available; webm is widely supported for MediaRecorder
      let mime = "video/webm;codecs=vp8,opus";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) mime = "video/webm;codecs=vp9,opus";
        else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) mime = "video/webm;codecs=vp8,opus";
        else if (MediaRecorder.isTypeSupported("video/webm")) mime = "video/webm";
        else if (MediaRecorder.isTypeSupported("video/mp4")) mime = "video/mp4";
      }
      const chunks = [];
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2_500_000 });
      recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      const done = new Promise((resolve) => { recorder.onstop = () => resolve(); });
      src.currentTime = start;
      await new Promise((r) => { src.onseeked = () => r(); setTimeout(r, 800); });
      recorder.start(200);
      await src.play();
      const tick = () => {
        if (src.currentTime >= end || src.ended || src.paused) {
          try { src.pause(); } catch {}
          if (recorder.state !== "inactive") recorder.stop();
          return;
        }
        ctx.drawImage(src, 0, 0, w, h);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      // Safety stop
      setTimeout(() => {
        try { src.pause(); } catch {}
        if (recorder.state !== "inactive") recorder.stop();
      }, Math.ceil((end - start) * 1000) + 1500);
      await done;
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: mime.split(";")[0] });
      if (!blob.size) throw new Error("Trim produced an empty file — try a shorter clip.");
      const ext = mime.includes("mp4") ? "mp4" : "webm";
      const trimmed = new File([blob], `reel-trim-${Date.now()}.${ext}`, { type: blob.type });
      const localUrl = URL.createObjectURL(trimmed);
      try { if (videoPreview?.startsWith("blob:")) URL.revokeObjectURL(videoPreview); } catch {}
      setVideoPreview(localUrl);
      setSourceFile(trimmed);
      setDurationSec(end - start);
      setTrimStart(0);
      setTrimEnd(Math.min(60, end - start));
      setForm((f) => ({ ...f, videoUrl: "" })); // force re-upload of trimmed file
      setError("");
      // Auto-upload trimmed file
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", trimmed, trimmed.name);
        fd.append("folder", "reels");
        const serverRes = await merveilFetch("/api/people?action=upload", { method: "POST", body: fd });
        const serverData = await serverRes.json().catch(() => ({}));
        if (!serverRes.ok || !serverData.url) {
          setError(serverData.error || "Trimmed upload failed — try again.");
        } else {
          upd("videoUrl", serverData.url);
          upd("mediaType", "video");
        }
      } finally {
        setUploading(false);
      }
    } catch (err) {
      setError(err?.message || "Couldn't trim this video. Try a shorter clip under 60s.");
    } finally {
      setTrimming(false);
    }
  };

  // Real cover: grab current frame from the preview video via canvas
  const captureCoverFrame = async () => {
    const el = previewRef.current;
    if (!el || !el.videoWidth) {
      setError("Play the video a moment, then capture the frame you want.");
      return;
    }
    try {
      const canvas = document.createElement("canvas");
      canvas.width = el.videoWidth;
      canvas.height = el.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setCoverDataUrl(dataUrl);
      setError("");
    } catch {
      setError("Couldn't capture this frame — try another moment in the video.");
    }
  };

  // Upload cover data URL as a real photo_url for the reel
  const uploadCoverIfNeeded = async () => {
    if (!coverDataUrl || !coverDataUrl.startsWith("data:")) return form.photoUrls?.[0] || null;
    setCoverUploading(true);
    try {
      const blob = await (await fetch(coverDataUrl)).blob();
      const fd = new FormData();
      fd.append("file", blob, `cover-${Date.now()}.jpg`);
      fd.append("folder", "covers");
      const up = await merveilFetch("/api/people?action=upload", { method: "POST", body: fd });
      const upData = await up.json().catch(() => ({}));
      if (!up.ok || !upData.url) throw new Error(upData.error || "Cover upload failed");
      return upData.url;
    } finally {
      setCoverUploading(false);
    }
  };

  const submit = async () => {
    if (!form.title.trim()) { setError("Give it a title first."); setStep("details"); return; }
    if (uploading || coverUploading) { setError("Wait for the upload to finish."); return; }
    if (!isEdit && !form.videoUrl) { setError("Pick a video from your gallery to post a World reel."); setStep("media"); return; }
    setBusy(true); setError("");
    try {
      let photoUrls = form.photoUrls || [];
      const coverUrl = await uploadCoverIfNeeded();
      if (coverUrl) photoUrls = [coverUrl, ...photoUrls.filter((u) => u !== coverUrl)];
      await onPublish({
        ...form,
        postId: editPost?.id || null,
        country: form.country || "Global",
        videoUrl: form.videoUrl || null,
        photoUrls: photoUrls.length ? photoUrls : undefined,
        mediaType: form.videoUrl ? "video" : (form.mediaType || "photo"),
      });
      onClose();
    } catch (e) {
      setError(e.message || (isEdit ? "Couldn't save changes." : "Couldn't publish. Try again."));
    } finally {
      setBusy(false);
    }
  };

  const stepIdx = STEPS.indexOf(step);
  const needsTrim = durationSec != null && durationSec > 60 && !form.videoUrl;
  const canNext = step === "media" ? !!videoPreview : step === "edit" ? (!!form.videoUrl || isEdit) && !needsTrim : true;

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,.55)" }}>
      <div className="w-full sm:w-[480px] sm:rounded-2xl rounded-t-2xl flex flex-col"
        style={{ background: "#0B0E14", height: "min(88dvh, 640px)", minHeight: 0, color: "#fff" }}>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div>
            <div className="text-base font-bold" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
              {isEdit ? "Edit World Reel" : "World Studio"}
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>
              {step === "media" ? "1 · Media" : step === "edit" ? "2 · Preview & cover" : step === "details" ? "3 · Details" : "4 · Publish"}
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
            <X size={18} color="#fff" />
          </button>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 py-2 shrink-0">
          {STEPS.map((s, i) => (
            <div key={s} className="h-1 rounded-full transition-all"
              style={{ width: i === stepIdx ? 24 : 8, background: i <= stepIdx ? "#0E9AA7" : "rgba(255,255,255,0.15)" }} />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-3 flex flex-col gap-3" style={{ minHeight: 0 }}>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*,video/mp4,video/quicktime,video/webm,video/x-m4v,video/3gpp,video/x-matroska,.mp4,.mov,.webm,.m4v,.mkv,.3gp,.avi"
            className="hidden"
            onChange={onVideoPick}
          />

          {(step === "media" || step === "edit") && (
            <button type="button" onClick={() => !uploading && videoInputRef.current?.click()}
              disabled={uploading}
              className="w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 py-5"
              style={{ borderColor: form.videoUrl ? "#0E9AA7" : "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.04)", opacity: uploading ? 0.7 : 1 }}>
              {videoPreview ? (
                <>
                  <video
                    ref={previewRef}
                    src={videoPreview}
                    className="w-full max-h-52 rounded-xl object-cover"
                    playsInline
                    controls
                    muted={muted}
                    onLoadedMetadata={(e) => {
                      e.target.playbackRate = playbackRate;
                      if (e.target.duration) setDurationSec(e.target.duration);
                    }}
                  />
                  <div className="text-[11px] font-semibold" style={{ color: uploading ? "#2EC4D0" : form.videoUrl ? "#4ade80" : "#9CA3AF" }}>
                    {uploading ? "Uploading…" : form.videoUrl ? "Ready · tap to replace" : "Preview only — upload failed"}
                  </div>
                  {durationSec != null && (
                    <div className="text-[10px]" style={{ color: durationSec > 60 ? "#F87171" : "#9CA3AF" }}>
                      {Math.round(durationSec)}s · max 60s
                    </div>
                  )}
                  {durationSec != null && durationSec > 60 && (
                    <div className="w-full mt-2 px-1 space-y-2" onClick={(e) => e.stopPropagation()}>
                      <div className="text-[11px] font-semibold text-center" style={{ color: "#FCA5A5" }}>
                        Trim to a 60s window, then apply
                      </div>
                      <label className="block text-[10px]" style={{ color: "#9CA3AF" }}>
                        Start {Math.round(trimStart)}s
                        <input type="range" min={0} max={Math.max(0, Math.floor(durationSec - 1))} step={1}
                          value={Math.min(trimStart, Math.max(0, durationSec - 1))}
                          onChange={(e) => {
                            const s = Number(e.target.value);
                            setTrimStart(s);
                            if (trimEnd <= s) setTrimEnd(Math.min(durationSec, s + 60));
                            else if (trimEnd - s > 60) setTrimEnd(s + 60);
                            const el = previewRef.current;
                            if (el) { try { el.currentTime = s; } catch {} }
                          }}
                          className="w-full" />
                      </label>
                      <label className="block text-[10px]" style={{ color: "#9CA3AF" }}>
                        End {Math.round(trimEnd)}s ({Math.max(0, Math.round(trimEnd - trimStart))}s selected)
                        <input type="range" min={1} max={Math.floor(durationSec)} step={1}
                          value={Math.min(trimEnd, durationSec)}
                          onChange={(e) => {
                            let end = Number(e.target.value);
                            if (end - trimStart > 60) end = trimStart + 60;
                            if (end <= trimStart) end = trimStart + 1;
                            setTrimEnd(end);
                          }}
                          className="w-full" />
                      </label>
                      <button type="button" disabled={trimming || uploading}
                        onClick={(e) => { e.stopPropagation(); trimVideoToLimit(); }}
                        className="w-full text-xs font-bold py-2.5 rounded-xl"
                        style={{ background: "linear-gradient(135deg,#0E9AA7,#06B6D4)", color: "#fff", opacity: trimming ? 0.7 : 1 }}>
                        {trimming ? "Trimming…" : `Apply trim (${Math.round(Math.min(60, trimEnd - trimStart))}s)`}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#0E9AA7" }}>
                    <Video size={24} color="#fff" />
                  </div>
                  <div className="text-sm font-bold">Choose video from gallery</div>
                  <div className="text-[11px]" style={{ color: "#9CA3AF" }}>All folders · MP4 / MOV / WEBM · max 60s · 80 MB</div>
                </>
              )}
            </button>
          )}

          {step === "edit" && videoPreview && (
            <div className="rounded-2xl p-3 flex flex-col gap-3" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Preview controls (live)</div>
              {/* Real playback speed */}
              <div>
                <div className="text-[11px] mb-1.5" style={{ color: "#B8C2D0" }}>Speed — changes preview playback</div>
                <div className="flex gap-1.5 flex-wrap">
                  {[0.5, 1, 1.5, 2].map((r) => (
                    <button key={r} type="button" onClick={() => setPlaybackRate(r)}
                      className="text-xs font-bold px-3 py-1.5 rounded-full"
                      style={{ background: playbackRate === r ? "#0E9AA7" : "rgba(255,255,255,0.08)", color: "#fff" }}>
                      {r}×
                    </button>
                  ))}
                </div>
              </div>
              {/* Real mute */}
              <div className="flex items-center justify-between">
                <span className="text-[11px]" style={{ color: "#B8C2D0" }}>Audio in preview</span>
                <button type="button" onClick={() => setMuted((m) => !m)}
                  className="text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{ background: muted ? "rgba(255,255,255,0.08)" : "#1F7A4D", color: "#fff" }}>
                  {muted ? "Muted" : "Sound on"}
                </button>
              </div>
              {/* Real cover frame capture */}
              <div>
                <div className="text-[11px] mb-1.5" style={{ color: "#B8C2D0" }}>Cover frame — becomes the reel thumbnail</div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={captureCoverFrame}
                    className="text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5"
                    style={{ background: "#06B6D4", color: "#fff" }}>
                    <Camera size={14} /> Capture current frame
                  </button>
                  {coverDataUrl && (
                    <img src={coverDataUrl} alt="Cover" className="h-12 w-9 rounded-md object-cover border" style={{ borderColor: "rgba(255,255,255,0.2)" }} />
                  )}
                </div>
              </div>
            </div>
          )}

          {(step === "details" || step === "publish") && (
            <>
              <input placeholder="Title" value={form.title} onChange={(e) => upd("title", e.target.value)}
                className="text-sm px-3 py-2.5 rounded-xl border outline-none bg-transparent"
                style={{ borderColor: "rgba(255,255,255,0.12)", color: "#fff" }} />

              {/* Songs library — TikTok-style */}
              <div className="rounded-xl border p-3" style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.25)" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.55)" }}>🎵 Song</div>
                  {form.musicTrackId ? (
                    <button type="button" className="text-[10px] font-semibold" style={{ color: "#F87171" }}
                      onClick={() => {
                        try { songAudioRef.current?.pause(); } catch {}
                        setSongPreviewId(null);
                        setForm((f) => ({ ...f, musicTrackId: null, musicTitle: null, musicUrl: null }));
                      }}>Remove</button>
                  ) : null}
                </div>
                {form.musicTrackId ? (
                  <div className="mb-2">
                    <div className="text-xs font-semibold text-white">
                      {form.musicTitle || findMerveilSong(form.musicTrackId)?.title || "Selected"}
                      <span className="opacity-60 font-normal"> · {findMerveilSong(form.musicTrackId)?.artist || "Merveil Sound"}</span>
                    </div>
                    <MerveilWaveform audioRef={songAudioRef} active={!!songPreviewId} color="#5EEAD4" height={32} className="mt-2" />
                  </div>
                ) : songPreviewId ? (
                  <MerveilWaveform audioRef={songAudioRef} active color="#0E9AA7" height={28} className="mb-2" />
                ) : null}
                <input
                  value={songQuery}
                  onChange={(e) => setSongQuery(e.target.value)}
                  placeholder="Search songs…"
                  className="w-full text-xs px-2.5 py-2 rounded-lg border outline-none mb-2 bg-transparent"
                  style={{ borderColor: "rgba(255,255,255,0.12)", color: "#fff" }}
                />
                <div className="flex gap-1.5 overflow-x-auto pb-2 mb-1">
                  {MERVEIL_SONG_GENRES.map((g) => (
                    <button key={g} type="button" onClick={() => setSongGenre(g)}
                      className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0"
                      style={{
                        background: songGenre === g ? "#0E9AA7" : "rgba(255,255,255,0.08)",
                        color: "#fff",
                      }}>{g}</button>
                  ))}
                </div>
                <div className="max-h-36 overflow-y-auto flex flex-col gap-1">
                  {filterMerveilSongs(songGenre, songQuery).map((song) => {
                    const selected = form.musicTrackId === song.id;
                    const previewing = songPreviewId === song.id;
                    return (
                      <div key={song.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                        style={{ background: selected ? "rgba(14,154,167,0.25)" : "transparent" }}>
                        <button type="button" className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: "rgba(255,255,255,0.1)" }}
                          onClick={() => {
                            try {
                              if (!songAudioRef.current) songAudioRef.current = new Audio();
                              const a = songAudioRef.current;
                              if (previewing) { a.pause(); setSongPreviewId(null); return; }
                              a.src = song.preview_url;
                              a.loop = true;
                              a.play().catch(() => {});
                              setSongPreviewId(song.id);
                            } catch {}
                          }}
                          aria-label={previewing ? "Stop" : "Preview"}>
                          {previewing ? "⏸" : "▶"}
                        </button>
                        <button type="button" className="flex-1 text-left min-w-0" onClick={() => {
                          setForm((f) => ({
                            ...f,
                            musicTrackId: song.id,
                            musicTitle: song.title,
                            musicUrl: song.preview_url,
                          }));
                          try {
                            if (!songAudioRef.current) songAudioRef.current = new Audio();
                            const a = songAudioRef.current;
                            a.src = song.preview_url;
                            a.loop = true;
                            a.play().catch(() => {});
                            setSongPreviewId(song.id);
                          } catch {}
                        }}>
                          <div className="text-xs font-semibold text-white truncate">{song.title}</div>
                          <div className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.5)" }}>{song.artist} · {song.genre}</div>
                        </button>
                        {selected ? <span className="text-[10px] font-bold" style={{ color: "#5EEAD4" }}>Use</span> : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              <select value={form.topic} onChange={(e) => upd("topic", e.target.value)}
                className="text-sm px-3 py-2.5 rounded-xl border outline-none"
                style={{ borderColor: "rgba(255,255,255,0.12)", background: "#151921", color: "#fff" }}>
                {WORLD_TOPICS.map((t) => <option key={t}>{t}</option>)}
              </select>
              <input placeholder="Country (e.g. United Kingdom, Global)" value={form.country}
                onChange={(e) => upd("country", e.target.value)}
                className="text-sm px-3 py-2.5 rounded-xl border outline-none bg-transparent"
                style={{ borderColor: "rgba(255,255,255,0.12)", color: "#fff" }} />
              <textarea placeholder="Caption — opportunity, update, or story" rows={3}
                value={form.description} onChange={(e) => upd("description", e.target.value)}
                className="text-sm px-3 py-2.5 rounded-xl border outline-none resize-none bg-transparent"
                style={{ borderColor: "rgba(255,255,255,0.12)", color: "#fff" }} />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs" style={{ color: "#9CA3AF" }}>Origin:</span>
                {[{ id: "human", label: "RH · Real Human" }, { id: "ai", label: "AI® · Assisted" }].map((o) => (
                  <button key={o.id} type="button" onClick={() => upd("contentOrigin", o.id)}
                    className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full"
                    style={{
                      background: form.contentOrigin === o.id ? "#0E9AA7" : "rgba(255,255,255,0.08)",
                      color: "#fff",
                    }}>{o.label}</button>
                ))}
              </div>
            </>
          )}

          {step === "publish" && (
            <div className="rounded-2xl p-3 text-xs flex flex-col gap-1.5" style={{ background: "rgba(14,154,167,0.15)", color: "#A8D5E5" }}>
              <div className="font-bold text-sm text-white">Ready to publish</div>
              <div>{form.title || "Untitled"} · {form.topic} · {form.country || "Global"}</div>
              <div>{form.videoUrl ? "Video attached" : "No video"}{coverDataUrl ? " · Cover frame set" : ""}</div>
              {playbackRate !== 1 && <div style={{ color: "#9CA3AF" }}>Preview was at {playbackRate}× — published reel plays at normal speed (file is unchanged).</div>}
            </div>
          )}

          {error && <div className="text-xs font-medium" style={{ color: "#F87171" }}>{error}</div>}
        </div>

        {/* Footer nav */}
        <div className="p-4 border-t shrink-0 flex gap-2" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {stepIdx > 0 && (
            <button type="button" onClick={() => setStep(STEPS[stepIdx - 1])}
              className="flex-1 text-sm font-bold py-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.08)", color: "#fff" }}>
              Back
            </button>
          )}
          {step !== "publish" ? (
            <button type="button"
              disabled={!canNext || uploading}
              onClick={() => {
                if (step === "media" && !videoPreview) { videoInputRef.current?.click(); return; }
                setStep(STEPS[Math.min(stepIdx + 1, STEPS.length - 1)]);
              }}
              className="flex-1 text-sm font-bold py-3 rounded-xl"
              style={{ background: "linear-gradient(135deg,#0E9AA7,#06B6D4)", color: "#fff", opacity: (!canNext || uploading) ? 0.6 : 1 }}>
              {step === "media" && !videoPreview ? "Pick video" : "Continue"}
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={busy || uploading || coverUploading}
              className="flex-1 text-sm font-bold py-3 rounded-xl"
              style={{ background: "linear-gradient(135deg,#0E9AA7,#1F2937)", color: "#fff", opacity: (busy || uploading || coverUploading) ? 0.7 : 1 }}>
              {coverUploading ? "Saving cover…" : uploading ? "Uploading…" : busy ? (isEdit ? "Saving…" : "Publishing…") : (isEdit ? "Save changes" : "Publish Reel")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const WorldReelCard = React.memo(WorldReelCardImpl, (prev, next) => {
  // Skip re-render when inactive reel props are unchanged (big win on swipe)
  if (prev.isActive !== next.isActive) return false;
  if (prev.liked !== next.liked || prev.supered !== next.supered || prev.saved !== next.saved) return false;
  if (prev.forceMuted !== next.forceMuted || prev.compact !== next.compact) return false;
  if (prev.post?.id !== next.post?.id) return false;
  if ((prev.post?.super_count || 0) !== (next.post?.super_count || 0)) return false;
  if ((prev.post?.views || 0) !== (next.post?.views || 0)) return false;
  if ((prev.post?.comments_count || 0) !== (next.post?.comments_count || 0)) return false;
  if (prev.post?.video_url !== next.post?.video_url) return false;
  if (prev.currentUser?.id !== next.currentUser?.id) return false;
  return true; // equal → skip render
});

// Official Merveil AI seed reels — shown when the World feed is empty so
// citizens always land on real video (not a blank screen). Public sample
// clips; replaced automatically as soon as any real world_posts exist.
// Working public sample MP4s (Google gtv bucket returns 403 — do not use it).
const MERVEIL_AI_SEED_REELS = [
  // 3 official Merveil AI reels per major category.
  // Shown only when the live World feed is empty so first-open is never blank.
  // Interactions (like / super / save) are optimistic + local on seeds.
  // Repost/duplicate creates a real citizen-owned post with the same video.
  // Working public sample MP4s only (Google gtv bucket returns 403).

  // ——— Entertainment ———
  {
    id: "merveil-ai-seed-ent-1",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "World is open",
    description: "Short videos from anywhere. Your reel joins the global citizen feed the moment you post.",
    topic: "Entertainment", country: "Global",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 42, super_count: 11, views: 1280, comments_count: 0,
    created_at: "2026-08-01T00:00:00.000Z", _seed: true,
  },
  {
    id: "merveil-ai-seed-ent-2",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Reel culture starts here",
    description: "Vertical, fast, real. Post from your gallery — max 60 seconds — and reach citizens worldwide.",
    topic: "Entertainment", country: "Global",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 28, super_count: 7, views: 940, comments_count: 0,
    created_at: "2026-08-01T00:00:05.000Z", _seed: true,
  },
  {
    id: "merveil-ai-seed-ent-3",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Share the moment",
    description: "Concerts, scenes, street energy — if it fits in a reel, it belongs on World.",
    topic: "Entertainment", country: "United Arab Emirates",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 61, super_count: 19, views: 2100, comments_count: 0,
    created_at: "2026-08-01T00:00:10.000Z", _seed: true,
  },

  // ——— Comedy ———
  {
    id: "merveil-ai-seed-com-1",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Keep it light",
    description: "Comedy travels. Post a short laugh and watch citizens Super it across borders.",
    topic: "Comedy", country: "Global",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 88, super_count: 24, views: 3400, comments_count: 0,
    created_at: "2026-08-01T00:01:00.000Z", _seed: true,
  },
  {
    id: "merveil-ai-seed-com-2",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "One take wonders",
    description: "No production house required. Phone, idea, publish.",
    topic: "Comedy", country: "Global",
    video_url: "https://www.w3schools.com/html/movie.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 33, super_count: 9, views: 1100, comments_count: 0,
    created_at: "2026-08-01T00:01:05.000Z", _seed: true,
  },
  {
    id: "merveil-ai-seed-com-3",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Citizen humour",
    description: "The best jokes on World come from real people, not algorithms. Be next.",
    topic: "Comedy", country: "Global",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 47, super_count: 14, views: 1750, comments_count: 0,
    created_at: "2026-08-01T00:01:10.000Z", _seed: true,
  },

  // ——— Music ———
  {
    id: "merveil-ai-seed-mus-1",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Sound on",
    description: "Music clips, covers, studio moments — World is built for audio that moves.",
    topic: "Music", country: "Global",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 102, super_count: 31, views: 5200, comments_count: 0,
    created_at: "2026-08-01T00:02:00.000Z", _seed: true,
  },
  {
    id: "merveil-ai-seed-mus-2",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Beat drops welcome",
    description: "Upload your track visual or live take. Citizens can Super and repost.",
    topic: "Music", country: "Global",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 56, super_count: 18, views: 2400, comments_count: 0,
    created_at: "2026-08-01T00:02:05.000Z", _seed: true,
  },
  {
    id: "merveil-ai-seed-mus-3",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "From studio to World",
    description: "Independent artists and labels — your next audience is already here.",
    topic: "Music", country: "United Arab Emirates",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 74, super_count: 22, views: 3100, comments_count: 0,
    created_at: "2026-08-01T00:02:10.000Z", _seed: true,
  },

  // ——— AI & Technology ———
  {
    id: "merveil-ai-seed-ai-1",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Built with intelligence",
    description: "Merveil World ranks tech and innovation slightly ahead so builders surface fast.",
    topic: "AI & Technology", country: "Global",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 156, super_count: 48, views: 8900, comments_count: 0,
    created_at: "2026-08-01T00:03:00.000Z", _seed: true,
  },
  {
    id: "merveil-ai-seed-ai-2",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Demo your product",
    description: "60-second product demos, model drops, and research clips belong here.",
    topic: "AI & Technology", country: "Global",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 91, super_count: 27, views: 4100, comments_count: 0,
    created_at: "2026-08-01T00:03:05.000Z", _seed: true,
  },
  {
    id: "merveil-ai-seed-ai-3",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Code that ships",
    description: "Ship the clip, not the slide deck. Investors and talent watch World.",
    topic: "AI & Technology", country: "Global",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 67, super_count: 15, views: 2800, comments_count: 0,
    created_at: "2026-08-01T00:03:10.000Z", _seed: true,
  },

  // ——— Smart Cities ———
  {
    id: "merveil-ai-seed-sc-1",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Cities that think",
    description: "Mobility, energy, digital twin — share the projects reshaping urban life.",
    topic: "Smart Cities", country: "United Arab Emirates",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 119, super_count: 36, views: 6200, comments_count: 0,
    created_at: "2026-08-01T00:04:00.000Z", _seed: true,
  },
  {
    id: "merveil-ai-seed-sc-2",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Dubai to the world",
    description: "Infrastructure that feels like the future. Citizens document it first on World.",
    topic: "Smart Cities", country: "United Arab Emirates",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 83, super_count: 21, views: 3700, comments_count: 0,
    created_at: "2026-08-01T00:04:05.000Z", _seed: true,
  },
  {
    id: "merveil-ai-seed-sc-3",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Urban signals",
    description: "Sensors, transit, green corridors — one reel can start a conversation with decision-makers.",
    topic: "Smart Cities", country: "Global",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 54, super_count: 12, views: 1900, comments_count: 0,
    created_at: "2026-08-01T00:04:10.000Z", _seed: true,
  },

  // ——— Real Estate ———
  {
    id: "merveil-ai-seed-re-1",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Property in motion",
    description: "Walk-throughs and skyline shots travel farther as reels than static galleries.",
    topic: "Real Estate", country: "United Arab Emirates",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 134, super_count: 41, views: 7800, comments_count: 0,
    created_at: "2026-08-01T00:05:00.000Z", _seed: true,
  },
  {
    id: "merveil-ai-seed-re-2",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Site visit, 45 seconds",
    description: "Developers and agents: post the unit, the view, the lobby — then connect on Passport.",
    topic: "Real Estate", country: "United Arab Emirates",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 72, super_count: 20, views: 3300, comments_count: 0,
    created_at: "2026-08-01T00:05:05.000Z", _seed: true,
  },
  {
    id: "merveil-ai-seed-re-3",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Skyline stories",
    description: "From Marina to business bay — capture the city and tag the opportunity.",
    topic: "Real Estate", country: "United Arab Emirates",
    video_url: "https://www.w3schools.com/html/movie.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 95, super_count: 28, views: 4500, comments_count: 0,
    created_at: "2026-08-01T00:05:10.000Z", _seed: true,
  },

  // ——— Travel ———
  {
    id: "merveil-ai-seed-tr-1",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Passport + place",
    description: "Travel reels from citizens who actually went. Discover, then connect.",
    topic: "Travel", country: "Global",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 148, super_count: 39, views: 9100, comments_count: 0,
    created_at: "2026-08-01T00:06:00.000Z", _seed: true,
  },
  {
    id: "merveil-ai-seed-tr-2",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Hidden corners",
    description: "Markets, deserts, coastlines — the unfiltered version of every destination.",
    topic: "Travel", country: "Global",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 63, super_count: 16, views: 2600, comments_count: 0,
    created_at: "2026-08-01T00:06:05.000Z", _seed: true,
  },
  {
    id: "merveil-ai-seed-tr-3",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Next flight out",
    description: "Share the journey, not just the postcard. World ranks travel with lifestyle.",
    topic: "Travel", country: "Global",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 81, super_count: 23, views: 3500, comments_count: 0,
    created_at: "2026-08-01T00:06:10.000Z", _seed: true,
  },

  // ——— Food ———
  {
    id: "merveil-ai-seed-food-1",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Taste of the city",
    description: "Chefs, home cooks, street food — 60 seconds is enough to make someone hungry.",
    topic: "Food", country: "United Arab Emirates",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 171, super_count: 52, views: 11200, comments_count: 0,
    created_at: "2026-08-01T00:07:00.000Z", _seed: true,
  },
  {
    id: "merveil-ai-seed-food-2",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Kitchen open",
    description: "Recipes, plating, service rush — food content performs on World.",
    topic: "Food", country: "Global",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 59, super_count: 14, views: 2200, comments_count: 0,
    created_at: "2026-08-01T00:07:05.000Z", _seed: true,
  },
  {
    id: "merveil-ai-seed-food-3",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Table for citizens",
    description: "Tag the dish, the place, the story. Then watch Supers come in.",
    topic: "Food", country: "Global",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 44, super_count: 10, views: 1600, comments_count: 0,
    created_at: "2026-08-01T00:07:10.000Z", _seed: true,
  },

  // ——— Fitness ———
  {
    id: "merveil-ai-seed-fit-1",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Move with purpose",
    description: "Workouts, form checks, recovery — fitness reels build followings fast.",
    topic: "Fitness", country: "Global",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 126, super_count: 34, views: 6700, comments_count: 0,
    created_at: "2026-08-01T00:08:00.000Z", _seed: true,
  },
  {
    id: "merveil-ai-seed-fit-2",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Train in public",
    description: "Park runs, gym floors, desert trails — document the work.",
    topic: "Fitness", country: "United Arab Emirates",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 70, super_count: 18, views: 2900, comments_count: 0,
    created_at: "2026-08-01T00:08:05.000Z", _seed: true,
  },
  {
    id: "merveil-ai-seed-fit-3",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Consistency over hype",
    description: "Short form progress beats long form excuses. Post the set.",
    topic: "Fitness", country: "Global",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 51, super_count: 13, views: 2000, comments_count: 0,
    created_at: "2026-08-01T00:08:10.000Z", _seed: true,
  },

  // ——— Innovation ———
  {
    id: "merveil-ai-seed-inn-1",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Welcome to World",
    description: "This is Merveil World — share any short video from your gallery. Your reel appears here for citizens everywhere.",
    topic: "Innovation", country: "Global",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 200, super_count: 60, views: 15000, comments_count: 0,
    created_at: "2026-08-01T00:09:00.000Z", _seed: true,
  },
  {
    id: "merveil-ai-seed-inn-2",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Post your first reel",
    description: "Tap Post, pick a video (max 60s) from any folder on your phone, add a title, and publish. No setup page required.",
    topic: "Innovation", country: "Global",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 112, super_count: 29, views: 5400, comments_count: 0,
    created_at: "2026-08-01T00:09:05.000Z", _seed: true,
  },
  {
    id: "merveil-ai-seed-inn-3",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Ideas need motion",
    description: "Pitch, prototype, or proof-of-concept — innovation is easier to trust when you can see it.",
    topic: "Innovation", country: "Global",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 86, super_count: 25, views: 3800, comments_count: 0,
    created_at: "2026-08-01T00:09:10.000Z", _seed: true,
  },

  // ——— Startups ———
  {
    id: "merveil-ai-seed-st-1",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Founder mode",
    description: "Launch clips, customer wins, team culture — investors scroll World too.",
    topic: "Startups", country: "Global",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 97, super_count: 30, views: 4800, comments_count: 0,
    created_at: "2026-08-01T00:10:00.000Z", _seed: true,
  },
  {
    id: "merveil-ai-seed-st-2",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Traction in 60s",
    description: "Show the metric, the product, the face. Then open Passport for the conversation.",
    topic: "Startups", country: "United Arab Emirates",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 68, super_count: 17, views: 2700, comments_count: 0,
    created_at: "2026-08-01T00:10:05.000Z", _seed: true,
  },
  {
    id: "merveil-ai-seed-st-3",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Build in public",
    description: "Ship weekly, film the win, let citizens Super the momentum.",
    topic: "Startups", country: "Global",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 55, super_count: 14, views: 2100, comments_count: 0,
    created_at: "2026-08-01T00:10:10.000Z", _seed: true,
  },

  // ——— Lifestyle ———
  {
    id: "merveil-ai-seed-life-1",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Day in the life",
    description: "Routine, spaces, style — lifestyle reels make strangers feel local.",
    topic: "Lifestyle", country: "Global",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 139, super_count: 37, views: 7200, comments_count: 0,
    created_at: "2026-08-01T00:11:00.000Z", _seed: true,
  },
  {
    id: "merveil-ai-seed-life-2",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Soft mornings",
    description: "Coffee, light, city noise — the quiet clips often travel farthest.",
    topic: "Lifestyle", country: "United Arab Emirates",
    video_url: "https://www.w3schools.com/html/movie.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 76, super_count: 19, views: 3100, comments_count: 0,
    created_at: "2026-08-01T00:11:05.000Z", _seed: true,
  },
  {
    id: "merveil-ai-seed-life-3",
    owner_id: "merveil-ai", owner_name: "Merveil AI", owner_avatar: null,
    title: "Citizen life",
    description: "Your ordinary day is someone else's inspiration. Post it.",
    topic: "Lifestyle", country: "Global",
    video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media_type: "video", content_origin: "ai",
    likes_count: 49, super_count: 11, views: 1800, comments_count: 0,
    created_at: "2026-08-01T00:11:10.000Z", _seed: true,
  },
];


function WorldView({ currentUser, onSignIn, onChat, minPassportPct = 0 }) {
  const { pushLayer, popLayer } = useAppBack();
  const [posts, setPosts] = useState([]);

  const publishWorldBadge = useCallback((list) => {
    try {
      const items = (list || []).map((p) => ({
        id: p.id,
        ts: p.created_at || p.createdAt || p.updated_at || 0,
      }));
      window.dispatchEvent(new CustomEvent("merveil:world-catalog", { detail: { items } }));
    } catch {}
  }, []);
  const [likedIds, setLikedIds] = useState([]);
  const [showPost, setShowPost] = useState(false);
  // World is Reels-only (TikTok-style). Feed / Map removed.
  const [worldReelIndex, setWorldReelIndex] = useState(0);
  const [viewingCreatorId, setViewingCreatorId] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasMoreWorld, setHasMoreWorld] = useState(true);
  const [loadingMoreWorld, setLoadingMoreWorld] = useState(false);
  const [affinityTick, setAffinityTick] = useState(0);
  const worldNextBeforeRef = useRef(null);
  // Reels presentation: full | standard | compact — stored per device, follows citizen settings layer
  const [reelMode, setReelMode] = useState(() => {
    try {
      const v = localStorage.getItem("merveil_reels_presentation");
      return ["full", "standard", "compact"].includes(v) ? v : "full";
    } catch { return "full"; }
  });
  const setReelModePersist = (mode) => {
    setReelMode(mode);
    try { localStorage.setItem("merveil_reels_presentation", mode); } catch {}
  };
  // Optimistic view counts while watching reels
  useEffect(() => {
    const onBump = (e) => {
      const id = e?.detail?.postId;
      if (!id) return;
      setPosts((prev) => prev.map((p) => {
        if (String(p.id) !== String(id)) return p;
        const v = (Number(p.views) || Number(p.views_count) || 0) + 1;
        return { ...p, views: v, views_count: v };
      }));
    };
    window.addEventListener("merveil:world-view-bump", onBump);
    return () => window.removeEventListener("merveil:world-view-bump", onBump);
  }, []);

  // Back closes creator profile
  useEffect(() => {
    if (!viewingCreatorId) return;
    pushLayer("world-creator", () => setViewingCreatorId(null));
    return () => popLayer("world-creator");
  }, [viewingCreatorId, pushLayer, popLayer]);
  // Back closes post modal
  useEffect(() => {
    if (!showPost && !editingPost) return;
    pushLayer("world-post", () => { setShowPost(false); setEditingPost(null); });
    return () => popLayer("world-post");
  }, [showPost, editingPost, pushLayer, popLayer]);

  const loadPosts = (silent = false) => {
    if (!silent) setLoading(true);
    merveilFetch("/api/world?limit=40&ranked=1")
      .then(r => r.ok ? r.json() : { posts: [] })
      .then(data => {
        const list = (data.posts || []).filter((p) => !p._seed && !String(p.id || "").startsWith("merveil-ai-seed"));
        // Empty live feed → empty state (seeds removed)
        if (!list.length) {
          setPosts((prev) => {
            if (silent && prev.length) return prev.filter((p) => !p._seed && !String(p.id || "").startsWith("merveil-ai-seed"));
            return [];
          });
          if (!silent) {
            setHasMoreWorld(false);
            worldNextBeforeRef.current = null;
          }
        } else if (silent) {
          // Soft refresh: update counts/fields in place — do NOT re-rank or jump index mid-swipe
          setPosts((prev) => {
            if (!prev.length) {
              return rankWorldReels(list, { userId: currentUser?.id, affinity: readWorldAffinity() });
            }
            const byId = new Map(list.map((p) => [String(p.id), p]));
            let changed = false;
            const next = prev.map((p) => {
              const n = byId.get(String(p.id));
              if (!n) return p;
              const merged = { ...p, ...n };
              if (!shallowSameRecord(p, merged)) changed = true;
              return shallowSameRecord(p, merged) ? p : merged;
            });
            // Append brand-new posts at the end (no mid-feed insert)
            const seen = new Set(prev.map((p) => String(p.id)));
            const fresh = list.filter((p) => !seen.has(String(p.id)));
            if (fresh.length) {
              changed = true;
              return [...next, ...fresh];
            }
            return changed ? next : prev;
          });
          setHasMoreWorld(!!data.hasMore);
          worldNextBeforeRef.current = data.nextBefore || worldNextBeforeRef.current;
        } else {
          // Server ranks by default (data.ranked). Client only applies local affinity mutes / soft boost.
          publishWorldBadge(list);
          let ordered = list;
          if (data.ranked) {
            // Preserve server order; still run client rank for mutes + local affinity without fighting server when affinity empty
            ordered = rankWorldReels(list, { userId: currentUser?.id, affinity: readWorldAffinity() });
          } else {
            ordered = rankWorldReels(list, { userId: currentUser?.id, affinity: readWorldAffinity() });
          }
          setPosts(ordered);
          setHasMoreWorld(!!data.hasMore);
          worldNextBeforeRef.current = data.nextBefore || null;
        }
      })
      .catch(() => {
        setPosts((prev) => prev.filter((p) => !p._seed && !String(p.id || "").startsWith("merveil-ai-seed")));
      })
      .finally(() => { if (!silent) setLoading(false); });
  };

  const loadMoreWorld = useCallback(() => {
    if (!hasMoreWorld || loadingMoreWorld || !worldNextBeforeRef.current) return;
    setLoadingMoreWorld(true);
    const before = encodeURIComponent(worldNextBeforeRef.current);
    fetch(`/api/world?limit=40&ranked=1&before=${before}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.posts?.length) { setHasMoreWorld(false); return; }
        setPosts((prev) => {
          const seen = new Set(prev.map((p) => String(p.id)));
          const add = data.posts.filter((p) => !seen.has(String(p.id)));
          // Rank only the new batch, then append — continuous intelligent cycle
          const rankedAdd = rankWorldReels(add, {
            userId: currentUser?.id,
            affinity: readWorldAffinity(),
          });
          return [...prev, ...rankedAdd];
        });
        setHasMoreWorld(!!data.hasMore);
        worldNextBeforeRef.current = data.nextBefore || null;
      })
      .catch(() => {})
      .finally(() => setLoadingMoreWorld(false));
  }, [hasMoreWorld, loadingMoreWorld, currentUser?.id]);

  // When user is near the end of reels, fetch the next page
  useEffect(() => {
    if (!posts.length || !hasMoreWorld) return;
    if (worldReelIndex >= posts.length - 3) loadMoreWorld();
  }, [worldReelIndex, posts.length, hasMoreWorld, loadMoreWorld]);

  // TikTok-style aggressive preload: current + next 3 reels in hidden video elements
  useEffect(() => {
    const urls = [];
    for (let i = Math.max(0, worldReelIndex - 1); i <= worldReelIndex + 3 && i < posts.length; i++) {
      const u = posts[i]?.video_url;
      if (u) urls.push(u);
    }
    merveilPreloadWorldVideos(urls, 5);
    const links = urls.slice(0, 4).map((href) => {
      try {
        const l = document.createElement("link");
        l.rel = "preload";
        l.as = "video";
        l.href = href;
        document.head.appendChild(l);
        return l;
      } catch { return null; }
    });
    return () => { links.forEach((l) => { try { l?.remove(); } catch {} }); };
  }, [worldReelIndex, posts]);

  // Swipe left on World (edge) → open own Creator page
  useEffect(() => {
    if (!currentUser?.id || viewingCreatorId) return;
    let startX = 0, startY = 0, tracking = false;
    const onStart = (e) => {
      const t = e.touches?.[0];
      if (!t) return;
      // Only from left edge so it doesn't fight vertical reel scroll
      if (t.clientX > 28) return;
      startX = t.clientX;
      startY = t.clientY;
      tracking = true;
    };
    const onMove = (e) => {
      if (!tracking) return;
      const t = e.touches?.[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = Math.abs(t.clientY - startY);
      if (dx > 72 && dy < 48) {
        tracking = false;
        setViewingCreatorId(currentUser.id);
      }
    };
    const onEnd = () => { tracking = false; };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [currentUser?.id, viewingCreatorId]);

  useEffect(() => {
    loadPosts(false);
    // Scale: soft refresh every 45s while World is open (no full reload flash)
    const id = setInterval(() => loadPosts(true), 45000);
    return () => clearInterval(id);
  }, []);

  // Realtime: new World posts appear without waiting for the 45s poll
  useEffect(() => {
    if (!supabaseBrowser?.channel) return;
    let ch = null;
    try {
      const topic = `world-posts-live-${Math.random().toString(36).slice(2, 9)}`;
      try {
        (supabaseBrowser.getChannels?.() || []).forEach((c) => {
          const t = String(c.topic || "");
          if (t.includes("world-posts-live")) {
            try { supabaseBrowser.removeChannel(c); } catch {}
          }
        });
      } catch {}
      ch = supabaseBrowser
        .channel(topic)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "world_posts" }, (payload) => {
          const row = payload?.new;
          if (!row?.id) return;
          setPosts((prev) => {
            if (prev.some((p) => String(p.id) === String(row.id))) return prev;
            return [row, ...prev];
          });
        })
        .on("postgres_changes", { event: "DELETE", schema: "public", table: "world_posts" }, (payload) => {
          const id = payload?.old?.id;
          if (!id) return;
          setPosts((prev) => prev.filter((p) => String(p.id) !== String(id)));
        })
        .subscribe();
    } catch (e) {
      console.warn("[world realtime]", e?.message || e);
    }
    return () => { if (ch) try { supabaseBrowser.removeChannel(ch); } catch {} };
  }, []);

  useEffect(() => {
    if (!currentUser?.id) { setLikedIds([]); return; }
    merveilFetch("/api/world?action=likes")
      .then(r => r.ok ? r.json() : { likedIds: [] })
      .then(data => setLikedIds(data.likedIds || []))
      .catch(() => {});
  }, [currentUser?.id]);

  // SUPER — primary World engagement (Like removed from World UI).
  const [superedIds, setSuperedIds] = useState([]);
  useEffect(() => {
    if (!currentUser?.id) { setSuperedIds([]); return; }
    merveilFetch("/api/world?action=supers")
      .then(r => r.ok ? r.json() : { superedIds: [] })
      .then(data => setSuperedIds(data.superedIds || []))
      .catch(() => {});
  }, [currentUser?.id]);

  // Comment count bump from CommentsModal
  useEffect(() => {
    const onComment = (ev) => {
      const postId = ev?.detail?.postId;
      if (!postId) return;
      setPosts((prev) => prev.map((p) => (String(p.id) === String(postId)
        ? { ...p, comments_count: (p.comments_count || 0) + 1 }
        : p)));
    };
    window.addEventListener("merveil:world-comment", onComment);
    return () => window.removeEventListener("merveil:world-comment", onComment);
  }, []);

  // SAVE — private bookmark + step-by-step gallery (TikTok/IG saved)
  const [savedIds, setSavedIds] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryItems, setGalleryItems] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryStep, setGalleryStep] = useState(0); // 0 list · 1 detail · 2 download
  const [galleryFocus, setGalleryFocus] = useState(null);
  useEffect(() => {
    if (!currentUser?.id) { setSavedIds([]); return; }
    merveilFetch("/api/world?action=saves")
      .then(r => r.ok ? r.json() : { savedIds: [] })
      .then(data => setSavedIds(data.savedIds || []))
      .catch(() => {});
  }, [currentUser?.id]);

  const openSavedGallery = () => {
    if (!currentUser) { onSignIn?.(); return; }
    setShowGallery(true);
    setGalleryStep(0);
    setGalleryFocus(null);
    setGalleryLoading(true);
    merveilFetch("/api/world?action=gallery", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setGalleryItems(d?.items || []))
      .catch(() => setGalleryItems([]))
      .finally(() => setGalleryLoading(false));
  };

  const downloadWorldToDevice = async (post) => {
    const mediaUrl = post?.video_url || post?.photo_url || (Array.isArray(post?.photo_urls) ? post.photo_urls[0] : null);
    if (!post?.id && !mediaUrl) {
      try {
        window.dispatchEvent(new CustomEvent("merveil:toast", {
          detail: { type: "error", message: "No video to download." },
        }));
      } catch {}
      return;
    }

    const toast = (type, message) => {
      try {
        window.dispatchEvent(new CustomEvent("merveil:toast", { detail: { type, message } }));
      } catch {}
    };

    const isBadBlob = (blob, ctype) => {
      const t = String(ctype || blob?.type || "").toLowerCase();
      if (!blob || !blob.size) return true;
      if (t.includes("json") || t.includes("text/html") || t.includes("text/plain")) return true;
      // tiny JSON error bodies often < 2kb with wrong type
      if (blob.size < 2048 && !t.includes("video") && !t.includes("image") && !t.includes("octet")) {
        return true;
      }
      return false;
    };

    const extFrom = (ctype, url, preferVideo) => {
      const t = String(ctype || "").toLowerCase();
      if (t.includes("mp4") || t.includes("video")) return "mp4";
      if (t.includes("webm")) return "webm";
      if (t.includes("png")) return "png";
      if (t.includes("webp")) return "webp";
      if (t.includes("jpeg") || t.includes("jpg")) return "jpg";
      if (preferVideo || post?.video_url) return "mp4";
      if (/\.mp4(\?|$)/i.test(url || "")) return "mp4";
      if (/\.webm(\?|$)/i.test(url || "")) return "webm";
      return "mp4";
    };

    const saveBlob = (blob, filename) => {
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 8000);
    };

    toast("info", "Preparing download…");

    // 1) Direct media URL first (real TikTok-style file — not API JSON)
    if (mediaUrl) {
      try {
        const res = await fetch(mediaUrl, { mode: "cors", credentials: "omit" });
        if (res.ok) {
          const blob = await res.blob();
          const ctype = res.headers.get("content-type") || blob.type || "";
          if (!isBadBlob(blob, ctype)) {
            const ext = extFrom(ctype, mediaUrl, !!post?.video_url);
            const name = `merveil-reel-${String(post?.id || "clip").slice(0, 12)}.${ext}`;
            saveBlob(blob, name);
            toast("success", ext === "mp4" || ext === "webm" ? "Video saved to Downloads." : "Saved to Downloads.");
            return;
          }
        }
      } catch (e) {
        console.warn("[merveil] direct download", e?.message || e);
      }
    }

    // 2) Same-origin proxy (only for real DB posts — never seeds)
    const postId = post?.id ? String(post.id) : "";
    const isSeed = !postId || post?._seed || postId.startsWith("merveil-ai-seed");
    if (!isSeed) {
      try {
        const q = new URLSearchParams({ action: "download", postId });
        if (mediaUrl) q.set("mediaUrl", mediaUrl);
        const res = await fetch(`/api/world?${q.toString()}`, { credentials: "include" });
        const ctype = res.headers.get("content-type") || "";
        if (res.ok && !ctype.includes("application/json")) {
          const blob = await res.blob();
          if (!isBadBlob(blob, ctype)) {
            const ext = extFrom(ctype, mediaUrl, !!post?.video_url);
            const name = `merveil-reel-${postId.slice(0, 12)}.${ext}`;
            saveBlob(blob, name);
            toast("success", "Video saved to Downloads.");
            return;
          }
        }
        // If JSON error body, surface it
        if (ctype.includes("json")) {
          const err = await res.json().catch(() => null);
          console.warn("[merveil] download api", err);
        }
      } catch (e) {
        console.warn("[merveil] proxy download", e?.message || e);
      }
    }

    // 3) Last resort: open media in new tab for long-press save
    if (mediaUrl) {
      try {
        window.open(mediaUrl, "_blank", "noopener,noreferrer");
        toast("info", "Long-press the video → Download / Save video.");
        return;
      } catch {}
    }
    toast("error", "Could not download this video. Try again or open the reel and long-press.");
  };
;

  // Explicit download from ⋯ menu
  useEffect(() => {
    const onDl = (e) => {
      const p = e?.detail?.post;
      if (p) downloadWorldToDevice(p);
    };
    window.addEventListener("merveil:world-download", onDl);
    return () => window.removeEventListener("merveil:world-download", onDl);
  }, []);

  const toggleSave = async (post) => {
    if (!currentUser) { onSignIn?.(); return; }
    const wasSaved = savedIds.includes(post.id);
    setSavedIds((prev) => (wasSaved ? prev.filter((id) => id !== post.id) : [...prev, post.id]));
    if (!wasSaved) {
      bumpWorldAffinity({ topic: post.topic, creatorId: post.owner_id, weight: 2 });
      setAffinityTick((t) => t + 1);
      // Device file + profile library
      downloadWorldToDevice(post);
      try {
        window.dispatchEvent(new CustomEvent("merveil:toast", {
          detail: { type: "success", message: "Saved to your profile · downloading file…" },
        }));
      } catch {}
    }
    try {
      const res = await merveilFetch("/api/world?action=save", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      if (!res.ok) setSavedIds((prev) => (wasSaved ? [...prev, post.id] : prev.filter((id) => id !== post.id)));
    } catch {
      setSavedIds((prev) => (wasSaved ? [...prev, post.id] : prev.filter((id) => id !== post.id)));
    }
  };

  // CALL — the real thing, same endpoint + screen Connect already uses
  // (see startCall in MessagesView). World doesn't need an open chat
  // thread first; /api/calls?action=create only needs a receiverId.
  const [worldActiveCall, setWorldActiveCall] = useState(null); // { callId, mode, otherName }
  const [worldCallError, setWorldCallError] = useState(null);
  const callPoster = async (post, mode) => {
    if (!currentUser) { onSignIn?.(); return; }
    if (post?._seed || String(post?.owner_id || "") === "merveil-ai") return;
    if (!post.owner_id) return;
    try {
      const res = await merveilFetch("/api/calls?action=create", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: post.owner_id, type: mode }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setWorldCallError(data?.error || "Couldn't start the call."); setTimeout(() => setWorldCallError(null), 4000); return; }
      setWorldActiveCall({ callId: data.call.id, mode, otherName: post.owner_name || "Merveil Citizen" });
    } catch {
      setWorldCallError("Couldn't start the call — check your connection.");
      setTimeout(() => setWorldCallError(null), 4000);
    }
  };

  const toggleSuper = async (post) => {
    if (!currentUser?.id) {
      try {
        const sess = await fetch("/api/auth/session", { credentials: "include" }).then((r) => r.json()).catch(() => null);
        if (sess?.user?.id) {
          try { window.dispatchEvent(new CustomEvent("merveil:session-user", { detail: sess.user })); } catch {}
        } else {
          onSignIn?.();
          return;
        }
      } catch {
        onSignIn?.();
        return;
      }
    }
    if (post?._seed || String(post?.id || "").startsWith("merveil-ai-seed")) {
      // Local-only feedback on seed reels (no DB row)
      const wasSupered = superedIds.includes(post.id);
      setSuperedIds((prev) => (wasSupered ? prev.filter((id) => id !== post.id) : [...prev, post.id]));
      setPosts((prev) => prev.map((p) => (p.id === post.id
        ? { ...p, super_count: Math.max(0, (p.super_count || 0) + (wasSupered ? -1 : 1)) } : p)));
      if (!wasSupered) {
        bumpWorldAffinity({ topic: post.topic, creatorId: post.owner_id, weight: 3 });
        setAffinityTick((t) => t + 1);
      }
      return;
    }
    const wasSupered = superedIds.includes(post.id);
    setSuperedIds((prev) => (wasSupered ? prev.filter((id) => id !== post.id) : [...prev, post.id]));
    setPosts((prev) => prev.map((p) => (p.id === post.id
      ? { ...p, super_count: Math.max(0, (p.super_count || 0) + (wasSupered ? -1 : 1)) } : p)));
    if (!wasSupered) {
      bumpWorldAffinity({ topic: post.topic, creatorId: post.owner_id, weight: 3 });
      setAffinityTick((t) => t + 1);
    }
    try {
      const res = await merveilFetch("/api/world?action=super", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.superCount != null) {
          setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, super_count: data.superCount } : p)));
        }
        if (typeof data.supered === "boolean") {
          setSuperedIds((prev) => {
            const has = prev.includes(post.id);
            if (data.supered && !has) return [...prev, post.id];
            if (!data.supered && has) return prev.filter((id) => id !== post.id);
            return prev;
          });
        }
      } else {
        setSuperedIds((prev) => (wasSupered ? [...prev, post.id] : prev.filter((id) => id !== post.id)));
        setPosts((prev) => prev.map((p) => (p.id === post.id
          ? { ...p, super_count: Math.max(0, (p.super_count || 0) + (wasSupered ? 1 : -1)) } : p)));
        if (res.status === 401) onSignIn?.();
      }
    } catch {
      setSuperedIds((prev) => (wasSupered ? [...prev, post.id] : prev.filter((id) => id !== post.id)));
      setPosts((prev) => prev.map((p) => (p.id === post.id
        ? { ...p, super_count: Math.max(0, (p.super_count || 0) + (wasSupered ? 1 : -1)) } : p)));
    }
  };

  const publish = async (form) => {
    // Rehydrate session before failing — local state can lag behind a valid cookie
    let me = currentUser;
    if (!me?.id) {
      try {
        const sess = await fetch("/api/auth/session", { credentials: "include" }).then((r) => r.json()).catch(() => null);
        if (sess?.user?.id) {
          me = sess.user;
          try { window.dispatchEvent(new CustomEvent("merveil:session-user", { detail: sess.user })); } catch {}
        }
      } catch {}
    }
    if (!me?.id) {
      try {
        const cached = JSON.parse(localStorage.getItem("junction_user") || "null");
        if (cached?.id) me = cached;
      } catch {}
    }
    if (!me?.id) { onSignIn?.(); return; }
    if (form.postId) {
      const res = await merveilFetch("/api/world?action=update", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't update.");
      setPosts((prev) => prev.map((p) => (p.id === form.postId ? { ...p, ...data.post, owner_name: p.owner_name, owner_avatar: p.owner_avatar } : p)));
      setEditingPost(null);
      return;
    }
    const res = await merveilFetch("/api/world", {
      method: "POST", headers: { "Content-Type":"application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Couldn't publish.");
    // Creator visibility: own new content is immediately at the top of their World experience
    setPosts(prev => [{ ...data.post, owner_name: me.name || currentUser?.name, owner_avatar: me.avatar_url || currentUser?.avatar_url }, ...prev]);
    setWorldReelIndex(0);
  };

  const deleteWorldPost = async (post) => {
    if (!currentUser || !post?.id) return;
    if (post?._seed || String(post.id).startsWith("merveil-ai-seed")) return;
    try {
      // postId in query + body so DELETE works even if body parser misses
      const res = await fetch(`/api/world?postId=${encodeURIComponent(post.id)}`, {
        method: "DELETE", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { alert(data.error || "Couldn't delete."); return; }
      setPosts((prev) => {
        const next = prev.filter((p) => String(p.id) !== String(post.id));
        // Keep reel index valid so the feed doesn't freeze after delete
        setWorldReelIndex((idx) => {
          if (!next.length) return 0;
          return Math.min(idx, next.length - 1);
        });
        return next;
      });
    } catch {
      alert("Couldn't delete — check your connection.");
    }
  };

  const deleteAllMyWorldPosts = async () => {
    if (!currentUser) { onSignIn?.(); return; }
    const mine = posts.filter((p) => p.owner_id && String(p.owner_id) === String(currentUser.id));
    if (!mine.length) { alert("You have no World posts to delete."); return; }
    if (!window.confirm(`Delete all ${mine.length} of your World posts/reels permanently? This cannot be undone.`)) return;
    try {
      const res = await merveilFetch("/api/world?action=delete-mine", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { alert(data.error || "Couldn't delete your posts."); return; }
      setPosts((prev) => prev.filter((p) => !(p.owner_id && String(p.owner_id) === String(currentUser.id))));
      setWorldReelIndex(0);
      alert(data.deleted != null ? `Deleted ${data.deleted} World post(s).` : "Your World posts were deleted.");
    } catch {
      alert("Couldn't delete — check your connection.");
    }
  };

  const toggleLike = async (post) => {
    if (!currentUser) { onSignIn?.(); return; }
    const wasLiked = likedIds.includes(post.id);
    // Seeds: optimistic local only (no DB row)
    if (post?._seed || String(post?.id || "").startsWith("merveil-ai-seed")) {
      setLikedIds((prev) => (wasLiked ? prev.filter((id) => id !== post.id) : [...prev, post.id]));
      setPosts((prev) => prev.map((p) => p.id === post.id
        ? { ...p, likes_count: Math.max(0, (p.likes_count || 0) + (wasLiked ? -1 : 1)) } : p));
      if (!wasLiked) {
        bumpWorldAffinity({ topic: post.topic, creatorId: post.owner_id, weight: 1 });
        setAffinityTick((t) => t + 1);
      }
      return;
    }
    setLikedIds(prev => wasLiked ? prev.filter(id => id !== post.id) : [...prev, post.id]);
    setPosts(prev => prev.map(p => p.id === post.id
      ? { ...p, likes_count: Math.max(0, (p.likes_count||0) + (wasLiked ? -1 : 1)) } : p));
    if (!wasLiked) {
      bumpWorldAffinity({ topic: post.topic, creatorId: post.owner_id, weight: 1 });
      setAffinityTick((t) => t + 1);
    }
    try {
      const res = await merveilFetch("/api/world?action=like", {
        method: "POST", credentials:"include", headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.likesCount != null) {
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes_count: data.likesCount } : p));
      } else if (!res.ok) {
        // Roll back optimistic UI if server rejected
        setLikedIds(prev => wasLiked ? [...prev, post.id] : prev.filter(id => id !== post.id));
        setPosts(prev => prev.map(p => p.id === post.id
          ? { ...p, likes_count: Math.max(0, (p.likes_count||0) + (wasLiked ? 1 : -1)) } : p));
      }
    } catch {
      setLikedIds(prev => wasLiked ? [...prev, post.id] : prev.filter(id => id !== post.id));
      setPosts(prev => prev.map(p => p.id === post.id
        ? { ...p, likes_count: Math.max(0, (p.likes_count||0) + (wasLiked ? 1 : -1)) } : p));
    }
  };

  const [connectStates, setConnectStates] = useState({}); // ownerId -> pending|accepted|busy

  // Message = open/create conversation (chat). Connection = social request to My Circle.
  const messageWithPoster = async (post) => {
    let me = currentUser;
    if (!me?.id) {
      try {
        const sess = await fetch("/api/auth/session", { credentials: "include" }).then((r) => r.json()).catch(() => null);
        if (sess?.user?.id) {
          me = sess.user;
          try { window.dispatchEvent(new CustomEvent("merveil:session-user", { detail: sess.user })); } catch {}
        }
      } catch {}
    }
    if (!me?.id) { onSignIn?.(); return; }
    if (post?._seed || String(post?.owner_id || "") === "merveil-ai") return;
    if (!post.owner_id) return;
    if (String(post.owner_id) === String(me.id)) return;
    try {
      const res = await merveilFetch("/api/conversations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantIds: [me.id, post.owner_id] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Couldn't open the conversation.");
        return;
      }
      const conversationId = data?.conversation?.id;
      // Open the exact thread (new or reused) so Messages does not land on AI / wrong chat
      if (conversationId) {
        const detail = {
          conversationId,
          participantIds: [me.id, post.owner_id],
          otherUserId: post.owner_id,
          otherName: post.owner_name || post.author_name || "Citizen",
          reused: !!data.reused,
        };
        try {
          sessionStorage.setItem("merveil_pending_conversation", JSON.stringify({ ...detail, at: Date.now() }));
        } catch {}
        try {
          window.dispatchEvent(new CustomEvent("merveil:open-conversation", { detail }));
        } catch {}
      }
      onChat?.();
    } catch {
      alert("Couldn't open the conversation.");
    }
  };

  // Real connection request (not chat). Other user must Accept under Connect → requests.
  const connectWithPoster = async (post) => {
    if (!currentUser) { onSignIn?.(); return; }
    if (!post.owner_id) return;
    if (String(post.owner_id) === String(currentUser.id)) return;
    const oid = String(post.owner_id);
    setConnectStates((p) => ({ ...p, [oid]: "busy" }));
    const result = await requestMerveilConnection(post.owner_id);
    if (result.status === "error") {
      alert(result.error || "Couldn't send connection request.");
      setConnectStates((p) => ({ ...p, [oid]: "idle" }));
      return;
    }
    setConnectStates((p) => ({
      ...p,
      [oid]: result.status === "accepted" || result.alreadyConnected ? "accepted" : "pending",
    }));
    if (result.status === "accepted" || result.alreadyConnected) {
      try {
        const res = await merveilFetch("/api/conversations", {
          method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantIds: [currentUser.id, post.owner_id] }),
        });
        const data = await res.json().catch(() => ({}));
        if (data?.conversation?.id) {
          try {
            window.dispatchEvent(new CustomEvent("merveil:open-conversation", {
              detail: {
                conversationId: data.conversation.id,
                participantIds: [currentUser.id, post.owner_id],
                otherUserId: post.owner_id,
                reused: !!data.reused,
              },
            }));
          } catch {}
        }
        onChat?.();
      } catch {}
    } else {
      alert("Connection request sent. They’ll appear in My Circle after they accept.");
    }
  };

  // Signed-in citizens can post World reels. Higher Passport % improves ranking, not the ability to post.
  const canPost = !!currentUser;
  const [postBlockedMsg, setPostBlockedMsg] = useState("");

  const openPostReel = async () => {
    if (editingPost) { setShowPost(true); return; }
    if (!currentUser?.id) {
      // Cookie may still be valid even if React state is empty
      try {
        const sess = await fetch("/api/auth/session", { credentials: "include" }).then((r) => r.json()).catch(() => null);
        if (sess?.user?.id) {
          try { window.dispatchEvent(new CustomEvent("merveil:session-user", { detail: sess.user })); } catch {}
          setShowPost(true);
          return;
        }
        const cached = JSON.parse(localStorage.getItem("junction_user") || "null");
        if (cached?.id) {
          try { window.dispatchEvent(new CustomEvent("merveil:session-user", { detail: cached })); } catch {}
          setShowPost(true);
          return;
        }
      } catch {}
      onSignIn?.();
      return;
    }
    setShowPost(true);
  };

  // World = full-screen Reels only (TikTok-style). Videos preferred.
  // Order is set by rankWorldReels on load / load-more (familiarity, diversity,
  // freshness, serendipity). Preserve that order while swiping — do not re-sort
  // every render (prevents active-reel jumps).
  // Real citizen video only — seed reels removed
  const liveVideoPosts = posts.filter((p) => p.video_url && !p._seed && !String(p.id || "").startsWith("merveil-ai-seed"));
  const usingSeeds = false;
  const reelItems = liveVideoPosts;

  const activeReel = reelItems[Math.min(worldReelIndex, Math.max(0, reelItems.length - 1))] || null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] tab-fade overflow-hidden"
        role="region"
        aria-label="World Reels"
        style={{
          background: "#000",
          top: 0, left: 0, right: 0, bottom: 0,
          width: "100vw", height: "100dvh",
          paddingTop: "var(--safe-top)",
          paddingBottom: "var(--safe-bottom)",
          paddingLeft: "var(--safe-left)",
          paddingRight: "var(--safe-right)",
        }}
      >
        <div className="absolute left-0 right-0 z-[100] flex items-center gap-2 px-3 pointer-events-none"
          style={{ top: "calc(10px + var(--safe-top))" }}>
          <button type="button" onClick={openPostReel}
            className="pointer-events-auto flex items-center gap-1 text-xs font-bold px-3.5 py-2 rounded-full shadow-lg min-h-[40px]"
            style={{ background: "linear-gradient(135deg,#0E9AA7,#1F2937)", color: "#fff" }}
            aria-label="Post a World reel">
            <Plus size={14} /> Post
          </button>
          <div className="pointer-events-auto flex rounded-full overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.45)" }} role="group" aria-label="Reel presentation size">
            {[
              { id: "full", label: "Full" },
              { id: "standard", label: "Std" },
              { id: "compact", label: "Compact" },
            ].map((m) => (
              <button key={m.id} type="button" onClick={() => setReelModePersist(m.id)}
                aria-pressed={reelMode === m.id}
                className="text-[9px] font-bold px-2 py-1.5 min-h-[32px]"
                style={{
                  background: reelMode === m.id ? "rgba(124,58,237,0.9)" : "transparent",
                  color: "#fff",
                }}>{m.label}</button>
            ))}
          </div>
          <div className="flex-1" />
                  </div>
        {loading && reelItems.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm" style={{ color: "rgba(255,255,255,0.7)" }} role="status">Loading World…</div>
        ) : reelItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-sm px-6 text-center gap-3" style={{ color: "rgba(255,255,255,0.85)" }}>
            <div className="text-base font-semibold">No World reels yet</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>Post any video from your gallery (max 60s) — people around the world will see it here.</div>
            <button type="button" onClick={openPostReel}
              className="mt-2 text-xs font-bold px-4 py-2.5 rounded-full min-h-[44px]" style={{ background: "#0E9AA7", color: "#fff" }}>
              Post a World Reel
            </button>
          </div>
        ) : (
          <div className="h-full w-full world-desktop-stage" style={{ minHeight: "100%", height: "100%", background: "#000" }}>
            {/* Desktop left rail — creator context (hidden on mobile via CSS) */}
            <div className="world-desktop-rail world-desktop-rail-left cv-auto" aria-hidden="false">
              {activeReel && (
                <>
                  <div className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>Now playing</div>
                  <button type="button" className="text-left" onClick={() => activeReel.owner_id && activeReel.owner_id !== "merveil-ai" && setViewingCreatorId(activeReel.owner_id)}>
                    <div className="text-sm font-semibold text-white truncate">{activeReel.owner_name || activeReel.author_name || "Creator"}</div>
                    <div className="text-xs mt-1 line-clamp-3" style={{ color: "rgba(255,255,255,0.65)" }}>{activeReel.caption || activeReel.title || activeReel.topic || "World discovery"}</div>
                  </button>
                  <div className="mt-4 flex flex-col gap-2">
                    <button type="button" onClick={() => messageWithPoster(activeReel)} className="text-xs font-bold py-2 px-3 rounded-xl text-left" style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}>Message</button>
                    <button type="button" onClick={() => activeReel.owner_id && setViewingCreatorId(activeReel.owner_id)} className="text-xs font-bold py-2 px-3 rounded-xl text-left" style={{ background: "rgba(124,58,237,0.35)", color: "#fff" }}>Creator</button>
                  </div>
                </>
              )}
            </div>

            <div
              className={`world-reel-column gpu-reel h-full ${reelMode === "standard" ? "mx-auto" : reelMode === "compact" ? "mx-auto" : "w-full"}`}
              style={{
                minHeight: "100%",
                height: "100%",
                background: "#000",
                ...(reelMode === "standard" ? { maxWidth: 420 } : reelMode === "compact" ? { maxWidth: 320 } : {}),
              }}
            >
              <CircularReel
                items={reelItems}
                activeIndex={Math.min(worldReelIndex, Math.max(0, reelItems.length - 1))}
                onActiveChange={setWorldReelIndex}
                getKey={(post) => post.id}
                loop
                onHorizontalSwipe={(post) => {
                  const uid = post?.owner_id;
                  if (uid && uid !== "merveil-ai") setViewingCreatorId(uid);
                  else if (uid === "merveil-ai") setViewingCreatorId(null);
                }}
                renderItem={(post, playState) => (
                  <WorldReelCard post={post} isActive={playState === "main"} forceMuted={playState === "satellite"}
                    compact={playState === "satellite" || reelMode === "compact"}
                    liked={likedIds.includes(post.id)}
                    supered={superedIds.includes(post.id)}
                    saved={savedIds.includes(post.id)}
                    currentUser={currentUser}
                    onRequireSignIn={onSignIn}
                    onToggleLike={toggleLike} onToggleSuper={toggleSuper} onToggleSave={() => toggleSave(post)}
                    onCall={(mode) => callPoster(post, mode)}
                    onOpenCreator={(uid) => uid && setViewingCreatorId(uid)}
                    onChat={() => messageWithPoster(post)}
                    onEdit={(p) => { setEditingPost(p); setShowPost(true); }}
                    onDelete={deleteWorldPost}
                    onNotInterested={(p, kind) => {
                      if (kind === "creator") muteWorldAffinity({ creatorId: p.owner_id });
                      else if (kind === "topic") muteWorldAffinity({ topic: p.topic });
                      else {
                        muteWorldAffinity({ topic: p.topic });
                      }
                      setPosts((prev) => {
                        const next = prev.filter((x) => String(x.id) !== String(p.id));
                        if (kind === "creator" && p.owner_id) {
                          return next.filter((x) => String(x.owner_id) !== String(p.owner_id));
                        }
                        return next;
                      });
                      setWorldReelIndex((idx) => Math.max(0, Math.min(idx, Math.max(0, posts.length - 2))));
                      setAffinityTick((t) => t + 1);
                    }}
                  />
                )}
              />
            </div>

            {/* Desktop right rail — discovery tips */}
            <div className="world-desktop-rail world-desktop-rail-right cv-auto">
              <div className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>Desktop tips</div>
              <ul className="text-xs space-y-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                <li>Scroll or arrow keys to move between reels</li>
                <li>Swipe / drag sideways for creator</li>
                <li>Use Full / Std / Compact for frame size</li>
              </ul>
              <div className="mt-4 text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                {worldReelIndex + 1} / {reelItems.length}
                {loadingMoreWorld ? " · loading more…" : ""}
              </div>
            </div>
          </div>
        )}
      </div>
      {(showPost || editingPost) && (
        <PostWorldModal
          onClose={() => { setShowPost(false); setEditingPost(null); }}
          onPublish={publish}
          defaultAsReel
          editPost={editingPost}
        />
      )}
      {postBlockedMsg && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setPostBlockedMsg("")}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: "#fff" }} onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-bold" style={{ color: T.ink }}>Passport needed to post</div>
            <p className="text-xs mt-2" style={{ color: T.sub }}>{postBlockedMsg}</p>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => setPostBlockedMsg("")} className="flex-1 text-xs font-semibold py-2.5 rounded-xl" style={{ background: T.panel, color: T.sub }}>Close</button>
              <button type="button" onClick={() => { setPostBlockedMsg(""); window.dispatchEvent(new CustomEvent("merveil:goto-passport")); }}
                className="flex-1 text-xs font-bold py-2.5 rounded-xl text-white" style={{ background: T.ink }}>Open Passport</button>
            </div>
          </div>
        </div>
      )}
      {viewingCreatorId && (
        <CreatorProfileModal
          userId={viewingCreatorId}
          currentUser={currentUser}
          onClose={() => setViewingCreatorId(null)}
          onChat={async (uid) => {
            const target = uid || viewingCreatorId;
            setViewingCreatorId(null);
            if (!currentUser?.id || !target) { onChat?.(); return; }
            try {
              const res = await merveilFetch("/api/conversations", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ participantIds: [currentUser.id, target] }),
              });
              const data = await res.json().catch(() => null);
              if (data?.conversation?.id) {
                window.dispatchEvent(new CustomEvent("merveil:navigate-tab", { detail: { tab: "messages" } }));
                window.dispatchEvent(new CustomEvent("merveil:open-conversation", {
                  detail: {
                    conversationId: data.conversation.id,
                    otherUserId: target,
                    participantIds: data.conversation.participant_ids || [currentUser.id, target],
                  },
                }));
                return;
              }
            } catch {}
            onChat?.();
          }}
          onOpenOwnPassport={() => {
            setViewingCreatorId(null);
            window.dispatchEvent(new CustomEvent("merveil:goto-passport"));
          }}
          onPlayPost={(post) => {
            setViewingCreatorId(null);
            const idx = reelItems.findIndex((p) => p.id === post.id);
            if (idx >= 0) setWorldReelIndex(idx);
          }}
        />
      )}
      {worldActiveCall && (
        <RealCallScreen
          callId={worldActiveCall.callId}
          role="caller"
          mode={worldActiveCall.mode}
          otherUser={{ name: worldActiveCall.otherName }}
          onEnd={() => setWorldActiveCall(null)}
        />
      )}
      {worldCallError && (
        <div className="fixed left-1/2 -translate-x-1/2 z-[75] px-4 py-2 rounded-full text-xs font-semibold text-white" style={{ bottom: "calc(5rem + var(--safe-bottom))", background: T.signal }}>
          {worldCallError}
        </div>
      )}

      {/* Step-by-step Saved Gallery (bookmark → review → download to device) */}
      {showGallery && (
        <div className="fixed inset-0 z-[90] flex flex-col" style={{ background: "#0A0A0A", color: "#F5F5F5", paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}>
          <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <button type="button" onClick={() => {
              if (galleryStep > 0) { setGalleryStep((s) => s - 1); if (galleryStep === 1) setGalleryFocus(null); }
              else setShowGallery(false);
            }} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
              <ArrowLeft size={18} color="#fff" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold">Saved gallery</div>
              <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                {galleryStep === 0 ? "Step 1 · Your bookmarks" : galleryStep === 1 ? "Step 2 · Preview" : "Step 3 · Save to device"}
              </div>
            </div>
            <button type="button" onClick={() => setShowGallery(false)} className="text-xs font-semibold px-2 py-1" style={{ color: "#0E9AA7" }}>Close</button>
          </div>
          <div className="px-4 py-2 flex gap-2">
            {["Bookmarks", "Preview", "Download"].map((label, i) => (
              <div key={label} className="flex-1 h-1 rounded-full" style={{ background: galleryStep >= i ? "#0E9AA7" : "rgba(255,255,255,0.12)" }} />
            ))}
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-6">
            {galleryLoading ? (
              <div className="py-16 text-center text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Loading saved…</div>
            ) : galleryStep === 0 ? (
              galleryItems.length === 0 ? (
                <div className="py-16 text-center px-6">
                  <Bookmark size={28} color="#FBBF24" className="mx-auto mb-3" />
                  <div className="text-sm font-semibold">No saved reels yet</div>
                  <div className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>Tap Save on any World reel — it lands here, then you can download to your gallery.</div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {galleryItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => { setGalleryFocus(item); setGalleryStep(1); }}
                      className="aspect-[9/16] rounded-lg overflow-hidden relative"
                      style={{ background: "#1a1a1a" }}
                    >
                      {(item.photo_url || item.poster_url || item.thumbnail_url) ? (
                        <img src={item.photo_url || item.poster_url || item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Video</div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-1.5 text-[9px] font-semibold truncate" style={{ background: "linear-gradient(transparent,rgba(0,0,0,0.8))" }}>
                        {item.title || item.topic || "Reel"}
                      </div>
                    </button>
                  ))}
                </div>
              )
            ) : galleryFocus ? (
              <div className="flex flex-col items-center gap-4 pt-4">
                <div className="w-full max-w-sm aspect-[9/16] rounded-2xl overflow-hidden" style={{ background: "#111" }}>
                  {galleryFocus.video_url ? (
                    <video src={galleryFocus.video_url} controls playsInline className="w-full h-full object-cover" poster={galleryFocus.photo_url || undefined} />
                  ) : galleryFocus.photo_url ? (
                    <img src={galleryFocus.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="text-center px-4">
                  <div className="text-sm font-bold">{galleryFocus.title || "Saved reel"}</div>
                  <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>{galleryFocus.owner_name || "Creator"}</div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    setGalleryStep(2);
                    await downloadWorldToDevice(galleryFocus);
                  }}
                  className="w-full max-w-sm text-sm font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#0E9AA7,#06B6D4)", color: "#fff" }}
                >
                  <Bookmark size={16} /> Download to device gallery
                </button>
                <button type="button" onClick={() => setGalleryStep(0)} className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Back to bookmarks</button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}

// Intelligent Engagement System — real reaction counts + toggling,
// fetched/posted against /api/world?action=reactions|react.


export {
  worldStableNoise,
  readWorldAffinity,
  bumpWorldAffinity,
  muteWorldAffinity,
  rankWorldReels,
  WorldCard,
  WorldReelCard,
  PostWorldModal,
  WorldView,
};
