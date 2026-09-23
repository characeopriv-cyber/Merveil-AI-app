/** Pulse Discover + Invest + Reels + Marketplace (from App.jsx) */

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

function PropertyCard({ p, liveViews, onViewDetails, liked, onToggleLike }) {
  const isInvestor = p.visibility === "investor";
  const views = liveViews[p.id] ?? p.views;
  return (
    <div
      className="rounded-xl overflow-hidden border flex flex-col relative"
      style={{ borderColor: T.line, background: "#fff" }}
    >
      {!p.isLive && (
        <span className="absolute top-2 right-2 z-10 text-[9px] font-bold px-1.5 py-0.5 rounded"
          style={{ background: "rgba(0,0,0,0.55)", color: "#fff", letterSpacing: ".5px" }}>
          Draft
        </span>
      )}
      <button onClick={(e) => { e.stopPropagation(); sharePost(p.title, p.id); }}
        className="absolute top-2 z-10 p-1.5 rounded-full"
        style={{ right: p.isLive ? "8px" : "56px", background: "rgba(0,0,0,0.5)" }}
        title="Share">
        <Share2 size={13} color="#fff" />
      </button>
      {(p.photo_urls?.length > 1 || p.video_url) && (
        <span className="absolute bottom-2 right-2 z-10 text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1"
          style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}>
          {p.video_url ? <><PlayCircle size={11} /> Video</> : <><Camera size={11} /> {p.photo_urls.length}</>}
        </span>
      )}
      <div
        className="h-36 relative flex items-end p-3 overflow-hidden"
        style={{
          background: (!p.video_url && p.photo_url) ? `url(${p.photo_url}) center/cover no-repeat` : `linear-gradient(135deg, ${p.grad[0]}, ${p.grad[1]})`,
        }}
      >
        {p.video_url && (
          <video src={p.video_url} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
        )}
        {(p.photo_url || p.video_url) && <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(0,0,0,.45), rgba(0,0,0,.05))" }} />}
        <div className="flex gap-1.5 absolute top-3 left-3">
          {p.promoted && (
            <span
              className="text-[11px] font-semibold px-2 py-1 rounded-full flex items-center gap-1"
              style={{ background: T.brass, color: T.ink }}
            >
              <Zap size={12} /> Promoted
            </span>
          )}
          {p.trending && (
            <span
              className="text-[11px] font-semibold px-2 py-1 rounded-full flex items-center gap-1"
              style={{ background: T.signal, color: "#fff" }}
            >
              <Flame size={12} /> Trending
            </span>
          )}
          {isInvestor && (
            <span
              className="text-[11px] font-semibold px-2 py-1 rounded-full flex items-center gap-1"
              style={{ background: T.ink, color: T.paper }}
            >
              <Lock size={12} /> Off-market
            </span>
          )}
          {p.distressed && (
            <span
              className="text-[11px] font-semibold px-2 py-1 rounded-full flex items-center gap-1"
              style={{ background: "#fff", color: "#B23A2E" }}
            >
              <AlertTriangle size={12} /> Distress deal
            </span>
          )}
          {p.sustainabilityScore >= 70 && (
            <span
              className="text-[11px] font-semibold px-2 py-1 rounded-full flex items-center gap-1"
              style={{ background: "#1F8A5C", color: "#fff" }}
            >
              <Leaf size={12} /> Vision 2040
            </span>
          )}
        </div>
        <span
          className="text-[11px] font-semibold px-2 py-1 rounded-full"
          style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}
        >
          {p.type} · {p.category}
        </span>
        <span
          className="text-[10px] font-semibold px-2 py-1 rounded-full absolute top-3 right-3"
          style={{ background: "rgba(0,0,0,0.35)", color: "#fff" }}
        >
          {LISTER_TYPE_STYLE[p.listedAs]?.label}
        </span>
      </div>

      <div className="p-3.5 flex flex-col gap-2 flex-1">
        <div
          style={{ fontFamily: "'IBM Plex Mono', monospace", color: T.ink }}
          className="text-base font-semibold"
        >
          AED {fmtAED(p.price)}
          {p.priceFreq && <span className="text-xs font-normal" style={{ color: T.sub }}> / {p.priceFreq}</span>}
        </div>
        <div className="text-sm font-medium" style={{ color: T.ink }}>
          {p.title}
        </div>
        <div className="text-[10px] font-mono" style={{ color: T.sub }}>
          REF: JX-{String(p.id).replace(/-/g, "").slice(0, 7).toUpperCase()}
        </div>

        {p.status === "rented" && p.rentedUntil && (
          <span className="text-[11px] font-semibold px-2 py-1 rounded-md inline-flex items-center gap-1 self-start" style={{ background: "#FDF3E2", color: "#9A6B17" }}>
            <Clock size={11} /> Rented until {p.rentedUntil}
          </span>
        )}
        {p.status === "sold" && p.soldPrice && (
          <span className="text-[11px] font-semibold px-2 py-1 rounded-md inline-flex items-center gap-1 self-start" style={{ background: "#E9F4EE", color: "#1F7A4D" }}>
            <CheckCircle2 size={11} /> Sold — AED {fmtAED(p.soldPrice)}
          </span>
        )}
        {p.distressed && p.distressReason && (
          <div className="text-[11px] px-2 py-1.5 rounded-md" style={{ background: "#FDEDEA", color: "#B23A2E" }}>
            {p.distressReason}
          </div>
        )}

        <div className="flex items-center gap-1 text-xs" style={{ color: T.sub }}>
          <MapPin size={12} /> {p.area}, {p.emirate}
        </div>

        {p.urbanCenter && (
          <div className="flex items-center gap-1 text-[11px]" style={{ color: "#1F8A5C" }}>
            <Globe2 size={11} />
            {URBAN_CENTERS_2040.find((u) => u.id === p.urbanCenter)?.name} · {URBAN_CENTERS_2040.find((u) => u.id === p.urbanCenter)?.role}
          </div>
        )}

        {typeof p.sustainabilityScore === "number" && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: T.line }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${p.sustainabilityScore}%`,
                  background: p.sustainabilityScore >= 70 ? "#1F8A5C" : p.sustainabilityScore >= 40 ? "#0891B2" : "#B23A2E",
                }}
              />
            </div>
            <span className="text-[10px] font-semibold" style={{ color: T.sub }}>
              {p.sustainabilityScore}/100
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 text-xs mt-1" style={{ color: T.sub }}>
          {p.beds !== null && (
            <span className="flex items-center gap-1"><BedDouble size={13} /> {p.beds}</span>
          )}
          {p.baths !== null && (
            <span className="flex items-center gap-1"><Bath size={13} /> {p.baths}</span>
          )}
          {p.sqft != null && (
            <span className="flex items-center gap-1"><Maximize size={13} /> {p.sqft.toLocaleString()} sqft</span>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-2 border-t" style={{ borderColor: T.line }}>
          <span className="flex items-center gap-1 text-xs font-medium" style={{ color: p.trending ? T.signal : T.sub }}>
            <AnimatedEye size={13} /> {fmtViews(views)} views
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1"
            >
              <LikeButton liked={liked} count={p.likesCount} onToggle={() => onToggleLike?.(p.id)} size={16} idleColor={T.sub} showCount={false} />
            </button>
            <button
              onClick={() => onViewDetails?.(p)}
              className="text-xs font-semibold flex items-center gap-1"
              style={{ color: T.navy }}
            >
              View details <ChevronRight size={14} />
            </button>
          </div>
        </div>
        {/* Merveil Score Ring */}
        {typeof p.sustainabilityScore === "number" && (
          <div className="mt-2 pt-2 border-t flex items-center gap-3" style={{ borderColor:T.line }}>
            <div className="relative flex items-center justify-center shrink-0" style={{width:40,height:40}}>
              <svg width="40" height="40" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="16" fill="none" stroke={T.line} strokeWidth="3.5"/>
                <circle cx="20" cy="20" r="16" fill="none"
                  stroke={p.sustainabilityScore>=70?"#1F7A4D":p.sustainabilityScore>=40?"#0891B2":"#CE1126"}
                  strokeWidth="3.5" strokeLinecap="round"
                  strokeDasharray={`${p.sustainabilityScore} 100`}
                  transform="rotate(-90 20 20)"/>
              </svg>
              <span className="absolute text-[9px] font-bold" style={{color:T.ink}}>{p.sustainabilityScore}</span>
            </div>
            <div>
              <div className="text-[11px] font-semibold" style={{color:T.ink}}>Merveil Score</div>
              <div className="text-[10px]" style={{color:T.sub}}>{p.sustainabilityScore>=70?"Quality verified":p.sustainabilityScore>=40?"Standard":"Limited data"}</div>
            </div>
          </div>
        )}
        {p.ghostRisk > 0.55 && (
          <div className="mt-2 px-2 py-1.5 rounded-lg flex items-center gap-1.5 text-[11px]"
            style={{background:"#FFF3CD",color:"#856404",animation:"ghostFlicker 2s ease-in-out infinite"}}>
            <AlertTriangle size={11}/> Ghost Risk — listing may no longer be available
          </div>
        )}
        {p.listingChain?.length > 0 && (
          <div className="mt-2 pt-2 border-t" style={{ borderColor: T.line }}>
            <div className="flex items-center gap-1 text-[11px] font-semibold mb-2" style={{ color: T.sub }}>
              <Activity size={11} /> Verified listing history
            </div>
            <div className="flex flex-col gap-1.5">
              {p.listingChain.map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex flex-col items-center mt-1">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: i === p.listingChain.length - 1 ? T.navy : T.line, border:`1.5px solid ${T.navy}` }}/>
                    {i < p.listingChain.length - 1 && <div className="w-0.5 h-3 mt-0.5" style={{ background: T.line }}/>}
                  </div>
                  <div className="text-[11px] leading-tight" style={{ color: T.sub }}>
                    <span style={{ color: T.ink, fontWeight: 600 }}>
                      {step.price != null ? `AED ${step.price.toLocaleString()}` : step.name}
                    </span>
                    {step.listedBy ? <>{" · "}{step.listedBy}</> : null}
                    {" · "}<span style={{ fontFamily: "'IBM Plex Mono',monospace" }}>{step.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DiscoveryOrbs({ activeOrb, onSelect, paused }) {
  const orbs = [...DISCOVERY_ORBS, ...DISCOVERY_ORBS]; // doubled for seamless loop
  return (
    <div className="overflow-hidden -mx-4 md:-mx-6 px-4 md:px-6 mb-1">
      <div
        className="flex gap-4 py-2"
        style={{
          animation: "orbScroll 32s linear infinite",
          animationPlayState: paused ? "paused" : "running",
          width: "max-content",
        }}
      >
        {orbs.map((o, i) => {
          const Icon = o.icon;
          const active = activeOrb === o.id;
          return (
            <button
              key={`${o.id}-${i}`}
              onClick={() => onSelect(o.id)}
              className="flex flex-col items-center gap-1.5 shrink-0"
              style={{ width: "64px" }}
            >
              <div
                className="rounded-full flex items-center justify-center"
                style={{
                  width: "56px",
                  height: "56px",
                  background: `linear-gradient(135deg, ${o.grad[0]}, ${o.grad[1]})`,
                  transform: active ? "scale(1.14)" : "scale(1)",
                  boxShadow: active ? `0 0 0 3px ${T.paper}, 0 0 0 5px ${o.grad[0]}` : "none",
                  transition: "transform 0.25s cubic-bezier(.34,1.56,.64,1), box-shadow 0.25s",
                }}
              >
                <Icon size={22} color="#fff" />
              </div>
              <span className="text-[11px] font-medium text-center leading-tight" style={{ color: active ? T.ink : T.sub }}>
                {o.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PropertyBalloon({ p, views, expanded, onClick, index }) {
  // One large balloon circle per post (not pairs of small ones).
  return (
    <button
      onClick={onClick}
      className="rounded-full flex flex-col items-center justify-center text-center relative overflow-hidden w-full aspect-square"
      style={{
        background: (p.photo_url && !p.video_url)
          ? `url(${p.photo_url}) center/cover no-repeat`
          : `linear-gradient(135deg, ${p.grad[0]}, ${p.grad[1]})`,
        boxShadow: expanded
          ? `0 14px 32px rgba(0,0,0,0.22), 0 0 0 3px ${T.brass}`
          : p.propertyAura==="cyan" ? "0 0 28px rgba(14,165,233,.55), 0 10px 20px rgba(0,0,0,.14)"
          : p.propertyAura==="gold" ? "0 0 28px rgba(217,119,6,.55), 0 10px 20px rgba(0,0,0,.14)"
          : p.propertyAura==="coral" ? "0 0 28px rgba(6,182,212,.55), 0 10px 20px rgba(0,0,0,.14)"
          : p.propertyAura==="green" ? "0 0 28px rgba(31,122,77,.55), 0 10px 20px rgba(0,0,0,.14)"
          : "0 10px 22px rgba(0,0,0,0.14)",
        animation: expanded ? "none" : `balloonFloat ${4 + (index % 3)}s ease-in-out ${(index % 5) * 0.25}s infinite`,
        transition: "box-shadow 0.2s",
      }}
    >
      {p.video_url && (
        <video
          src={p.video_url}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay muted loop playsInline preload="auto"
          onLoadedData={(e) => { e.currentTarget.play().catch(() => {}); }}
          onTimeUpdate={(e) => { if (e.currentTarget.currentTime > 2) e.currentTarget.currentTime = 0; }}
        />
      )}
      {(p.photo_url || p.video_url) && (
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle, rgba(0,0,0,.15), rgba(0,0,0,.55))" }} />
      )}
      {p.distressed && (
        <span className="absolute top-1 left-1.5"><AlertTriangle size={14} color="#fff" /></span>
      )}
      {p.trending && (
        <span className="absolute top-1 right-1.5"><Flame size={14} color="#fff" /></span>
      )}
      {p.propertyAura === "green" && (
        <span className="absolute top-1 right-1.5">
          <Leaf size={12} color="#fff" style={{ filter:"drop-shadow(0 0 3px #1F7A4D)" }}/>
        </span>
      )}
      {p.ghostRisk > 0.55 && (
        <span className="absolute top-1 left-1.5" style={{ animation:"ghostFlicker 2s ease-in-out infinite" }}>
          <AlertTriangle size={12} color="#0891B2"/>
        </span>
      )}
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#fff" }} className="text-sm font-semibold px-2">
        {fmtAED(p.price)}
        {p.priceFreq && <span className="text-[10px]">/{p.priceFreq}</span>}
      </span>
      <span className="text-[10px] text-white px-3 mt-1 leading-tight" style={{ opacity: 0.9 }}>
        {p.area}
      </span>
      <span className="text-[10px] text-white mt-1 flex items-center gap-0.5" style={{ opacity: 0.85 }}>
        <AnimatedEye size={10} /> {fmtViews(views)}
      </span>
    </button>
  );
}

function AdBanner({ placement = "feed" }) {
  const [slot, setSlot] = useState(null);
  useEffect(() => {
    fetch(`/api/sponsored?placement=${placement}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setSlot(data?.slots?.[0] || null))
      .catch(() => setSlot(null));
  }, [placement]);
  if (!slot) return null;
  const photo = slot.properties?.photo_url || slot.properties?.photo_urls?.[0];
  return (
    <div
      className="rounded-xl p-4 flex items-center gap-3 mt-3"
      style={{ background: `linear-gradient(135deg, ${T.brass}, ${T.signal})` }}
    >
      <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 overflow-hidden" style={{ background: "rgba(255,255,255,0.2)" }}>
        {photo ? <img src={photo} className="w-full h-full object-cover" alt="" /> : <Building2 size={20} color="#fff" />}
      </div>
      <div className="flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.85)" }}>
          {slot.badge_label} · {slot.developer_name}
        </div>
        <div className="text-sm font-semibold text-white">{slot.headline}</div>
      </div>
      <ChevronRight size={18} color="#fff" />
    </div>
  );
}

function FeedView({ liveViews, properties, currentUser, onPropertyUpdated, onPropertyDeleted, onRequireSignIn, onChat }) {
  const [editingProperty, setEditingProperty] = useState(null);
  const [activeOrb, setActiveOrb] = useState("forYou");
  useEffect(() => { setFeedVisible(18); }, [activeOrb]);
  const [paused, setPaused] = useState(false);
  const [inventories, setInventories] = useState([]);
  const [showInventoryUpload, setShowInventoryUpload] = useState(false);
  const [openInventoryId, setOpenInventoryId] = useState(null);
  const [detailProperty, setDetailProperty] = useState(null);
  const [likedIds, setLikedIds] = useState([]);
  const [ownerProfiles, setOwnerProfiles] = useState({});
  const [feedVisible, setFeedVisible] = useState(18);

  useEffect(() => {
    const ids = [...new Set(properties.map((p) => p.ownerId).filter(Boolean))];
    if (!ids.length) return;
    fetch(`/api/conversations?action=profiles&ids=${ids.join(",")}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setOwnerProfiles((prev) => ({ ...prev, ...data.profiles })))
      .catch(() => {});
  }, [properties.length]);

  useEffect(() => {
    if (!currentUser?.id) { setLikedIds([]); return; }
    fetch("/api/properties?action=likes", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setLikedIds((data.likedIds || []).map((id) => (String(id).startsWith("db-") ? id : `db-${id}`))))
      .catch(() => {});
  }, [currentUser?.id]);

  const toggleLike = async (propertyId) => {
    if (!currentUser) { onRequireSignIn?.(); return; }
    setLikedIds((prev) => (prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId]));
    try {
      const res = await fetch("/api/properties?action=like", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: String(propertyId).replace(/^db-/, "") }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        // Revert the optimistic update — it didn't actually save (e.g. an
        // expired session), so the UI shouldn't claim it did.
        setLikedIds((prev) => (prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId]));
        if (res.status === 401) onRequireSignIn?.();
      } else if (data && typeof data.likesCount === "number") {
        onPropertyUpdated?.({ id: propertyId, likesCount: data.likesCount });
      }
    } catch {
      setLikedIds((prev) => (prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId]));
    }
  };

  const startChatWithOwner = async (property) => {
    if (!currentUser) { onRequireSignIn?.(); return; }
    if (!property.ownerId) return;
    try {
      const created = await fetch("/api/conversations", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantIds: [currentUser.id, property.ownerId] }),
      }).then((r) => r.json());
      // Only auto-message on a brand-new conversation — reuse existing thread otherwise
      if (created?.conversation?.id && !created.reused) {
        await fetch(`/api/conversations/${created.conversation.id}/messages`, {
          method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: `Hi! I'm interested in "${property.title}" on Merveil.` }),
        });
      }
      onChat?.();
    } catch {}
  };

  useEffect(() => {
    fetch("/api/properties?action=inventory")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setInventories(data?.inventories || []))
      .catch(() => {});
  }, []);

  const orb = DISCOVERY_ORBS.find((o) => o.id === activeOrb) || DISCOVERY_ORBS[0];

  const handleSelect = (id) => {
    setActiveOrb((prev) => {
      if (prev === id) {
        setPaused(false);
        return "forYou";
      }
      setPaused(true);
      return id;
    });
  };

  const resumeRolling = () => {
    setActiveOrb("forYou");
    setPaused(false);
  };

  // AI Matching Engine — scores each property against implicit signals:
  // trending velocity, view counts, sustainability score, recent activity,
  // and how "complete" the listing is (chain, photos, verified lister).
  // In production this would be a real ML model trained on user behaviour.
  const aiScore = (p) => {
    let score = 0;
    if (p.trending) score += 30;
    if (p.promoted) score += 20;
    score += Math.min(p.views / 100, 25);
    if (p.sustainabilityScore) score += p.sustainabilityScore * 0.15;
    if (p.listingChain?.length > 1) score += 10;
    if (p.listedAs === "LICENSED_BROKER") score += 8;
    if (p.listedAs === "DEVELOPER") score += 6;
    if (p.status === "active") score += 5;
    return score;
  };

  const list = useMemo(() => {
    let base = properties.filter((p) => p.visibility !== "investor");
    if (activeOrb === "aiMatch") {
      return [...base].sort((a, b) => (!!b.isLive - !!a.isLive) || (aiScore(b) - aiScore(a)));
    }
    if (orb.filter) base = base.filter(orb.filter);
    if (activeOrb === "forYou") {
      base = [...base].sort((a, b) =>
        (!!b.isLive - !!a.isLive) ||
        (b.trending - a.trending) || (b.promoted - a.promoted) || (b.views - a.views)
      );
    } else {
      // Even inside a specific category orb, real posts still lead.
      base = [...base].sort((a, b) => !!b.isLive - !!a.isLive);
    }
    return base;
  }, [activeOrb, properties, orb]);

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="mb-3">
        <div className="flex items-center justify-end gap-2 mb-1">
          <div className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full"
            style={{background:"rgba(14,154,167,0.10)",color:"#0E9AA7",border:"1px solid rgba(14,154,167,0.22)"}}>
            <Globe2 size={10}/> Visible worldwide · No login required
          </div>
        </div>
        <p className="text-sm" style={{color:T.sub}}>
          Every listing is open to visitors from any country. Register to become a Merveil citizen.
        </p>
      </div>

      <DiscoveryOrbs activeOrb={activeOrb} onSelect={handleSelect} paused={paused} />

      {activeOrb === "forYou" && inventories.length > 0 && (
        <div className="mt-3 mb-1">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold flex items-center gap-1.5" style={{ color: T.ink }}>
              <LayoutGrid size={12} /> Inventory — multi-unit listings
            </div>
            {currentUser && (
              <button onClick={() => setShowInventoryUpload(true)} className="text-[10px] font-semibold" style={{ color: T.signal }}>+ List inventory</button>
            )}
          </div>
          <div className="flex overflow-x-auto pb-1 -mx-1 px-1">
            {inventories.map((inv) => <InventoryCard key={inv.id} inv={inv} onOpen={setOpenInventoryId} />)}
          </div>
        </div>
      )}
      {activeOrb === "forYou" && inventories.length === 0 && currentUser && (
        <button onClick={() => setShowInventoryUpload(true)}
          className="mt-3 mb-1 w-full text-xs font-semibold px-3 py-2.5 rounded-xl flex items-center justify-center gap-1.5"
          style={{ background: T.panel, color: T.sub, border: `1px dashed ${T.line}` }}>
          <Upload size={12} /> Have multiple units to list? Upload an inventory
        </button>
      )}

      {showInventoryUpload && (
        <InventoryUploadFlow
          currentUser={currentUser}
          onClose={() => setShowInventoryUpload(false)}
          onCreated={(data) => {
            setShowInventoryUpload(false);
            fetch("/api/properties?action=inventory").then((r) => r.json()).then((d) => setInventories(d?.inventories || []));
            alert(`Inventory published — ${data.unitsCreated} units added${data.listingsCreated ? `, ${data.listingsCreated} also listed individually` : ""}.`);
          }}
        />
      )}
      {openInventoryId && (
        <InventoryDetailView inventoryId={openInventoryId} onClose={() => setOpenInventoryId(null)} onChat={() => setOpenInventoryId(null)} />
      )}

      {activeOrb === "forYou" && <AdBanner />}

      {/* AI Match banner */}
      {activeOrb === "aiMatch" && (
        <div className="mt-2 mb-1 px-3 py-2.5 rounded-xl flex items-center gap-2.5"
          style={{ background: "linear-gradient(135deg,#0891B218,#06B6D410)", border:"1px solid #06B6D433" }}>
          <Sparkles size={16} style={{ color:"#06B6D4", shrink:0 }}/>
          <p className="text-xs" style={{ color:"#9A3412" }}>
            Merveil AI ranked these listings based on demand velocity, verification quality,
            sustainability score and recent activity — no manual search needed.
          </p>
        </div>
      )}

      {/* Property History banner */}
      {activeOrb === "history" && (
        <div className="mt-2 mb-1 px-3 py-2.5 rounded-xl flex items-center gap-2.5"
          style={{ background: "#1F7A4D12", border:"1px solid #1F7A4D33" }}>
          <Activity size={16} style={{ color:"#1F7A4D", shrink:0 }}/>
          <p className="text-xs" style={{ color:"#1F7A4D" }}>
            Every listing below has a verified transaction chain — you can see who listed it,
            when, and at what price. Property history builds trust that no competitor can fake.
          </p>
        </div>
      )}

      {activeOrb === "ghost" && (
        <div className="mt-2 mb-1 px-3 py-2.5 rounded-xl flex items-center gap-2.5"
          style={{background:"#0891B212",border:"1px solid #0891B233"}}>
          <AlertTriangle size={16} style={{color:"#0891B2",flexShrink:0}}/>
          <p className="text-xs" style={{color:"#856404"}}>
            Merveil AI flags these listings as potentially unavailable based on price-freeze duration,
            agent inactivity, and absence of verified viewings.
          </p>
        </div>
      )}
      {/* Pre-Launch banner */}
      {activeOrb === "prelaunch" && (
        <div className="mt-2 mb-1 px-3 py-2.5 rounded-xl flex items-center gap-2.5"
          style={{ background: "#7C3FA012", border:"1px solid #7C3FA033" }}>
          <Crown size={16} style={{ color:"#7C3FA0", shrink:0 }}/>
          <p className="text-xs" style={{ color:"#5A2A80" }}>
            These listings come directly from UAE developers before public launch.
            Merveil is the exclusive channel — not available on any other platform yet.
          </p>
        </div>
      )}

      <div key={activeOrb} className="tab-fade mt-3 mb-3 flex items-center justify-between gap-2">
        <div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", color: T.ink }} className="text-base font-semibold">
            {orb.headline}
          </div>
          <p className="text-xs mt-0.5" style={{ color: T.sub }}>{orb.sub}</p>
        </div>
        {activeOrb !== "forYou" && (
          <button
            onClick={resumeRolling}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap shrink-0"
            style={{ background: T.navy, color: "#fff" }}
          >
            ← Resume
          </button>
        )}
      </div>

      {activeOrb === "inventory" ? (
        <div className="mb-4">
          <button
            onClick={() => (currentUser ? setShowInventoryUpload(true) : onRequireSignIn?.())}
            className="w-full mb-3 text-xs font-bold px-3 py-3 rounded-xl flex items-center justify-center gap-1.5"
            style={{ background: T.signal, color: "#FFFFFF" }}>
            <Upload size={13} /> Upload a rent roll or sale sheet
          </button>
          {inventories.length === 0 ? (
            <div className="text-sm text-center py-10" style={{ color: T.sub }}>
              No inventories published yet — be the first to list one.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {inventories.map((inv) => <InventoryCard key={inv.id} inv={inv} onOpen={setOpenInventoryId} />)}
            </div>
          )}
        </div>
      ) : list.length === 0 ? (
        <div className="text-sm text-center py-10" style={{ color: T.sub }}>
          Nothing here yet — try another circle.
        </div>
      ) : (
        <div key={`${activeOrb}-list`} className="tab-fade">
          {/* Circle mosaic — 3 on phone, denser on desktop */}
          <div className="flex gap-3 overflow-x-auto py-3 px-0.5 snap-x snap-mandatory" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
            {list.map((p, i) => (
              <div key={p.id} className="snap-center shrink-0" style={{ width: "min(72vw, 260px)" }}>
                <PropertyBalloon
                  p={p}
                  index={i}
                  views={liveViews[p.id] ?? p.views}
                  expanded={true}
                  onClick={() => {
                    fetch("/api/properties?action=view", {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ propertyId: String(p.id).replace(/^db-/, "") }),
                    }).catch(() => {});
                    setDetailProperty(p);
                  }}
                />
              </div>
            ))}
          </div>

          {/* Infinite card feed under the mosaic */}
          <div className="mt-5 mb-2">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] mb-3" style={{ color: T.sub }}>Continue exploring</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
              {list.slice(0, feedVisible).map((p) => (
                <div key={`feed-${p.id}`} role="button" tabIndex={0}
                  onClick={() => setDetailProperty(p)}
                  onKeyDown={(e) => { if (e.key === "Enter") setDetailProperty(p); }}
                  className="rounded-2xl overflow-hidden text-left cursor-pointer"
                  style={{ background: "#fff", border: "1px solid rgba(18,22,28,0.07)", boxShadow: "0 8px 28px rgba(18,22,28,0.05)" }}>
                  <div className="relative w-full overflow-hidden" style={{ height: 160, background: "#12100E" }}>
                    {(p.photo_url || (p.photos && p.photos[0])) ? (
                      <img src={p.photo_url || p.photos[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${p.grad?.[0] || "#1A1612"}, ${p.grad?.[1] || "#0E9AA7"})` }} />
                    )}
                    <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
                      <span className="text-[12px] font-bold text-white tabular-nums" style={{ textShadow: "0 1px 8px rgba(0,0,0,.5)", fontFamily: "IBM Plex Mono,monospace" }}>
                        {p.price ? `AED ${Number(p.price).toLocaleString()}` : ""}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.45)", color: "#fff" }}>{p.type || "Sale"}</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-[13px] font-semibold truncate" style={{ color: T.ink, fontFamily: "Space Grotesk,sans-serif" }}>{p.title}</div>
                    <div className="text-[11px] mt-0.5 truncate" style={{ color: T.sub }}>{[p.area, p.emirate].filter(Boolean).join(" · ")}</div>
                  </div>
                </div>
              ))}
            </div>
            {feedVisible < list.length && (
              <button type="button" onClick={() => setFeedVisible((n) => n + 18)}
                className="w-full mt-4 text-sm font-semibold py-3 rounded-xl"
                style={{ background: "rgba(18,22,28,0.04)", color: T.ink, border: "1px solid rgba(18,22,28,0.08)" }}>
                Load more listings
              </button>
            )}
          </div>

          {editingProperty && (
            <EditPropertyModal
              property={editingProperty}
              currentUser={currentUser}
              onClose={() => setEditingProperty(null)}
              onSaved={(updated) => { onPropertyUpdated(updated); setEditingProperty(null); }}
            />
          )}
        </div>
      )}

      {detailProperty && (
        <PropertyDetailModal
          p={detailProperty}
          currentUser={currentUser}
          onClose={() => setDetailProperty(null)}
          onChat={startChatWithOwner}
          onEdit={setEditingProperty}
          onDeleted={(id) => onPropertyDeleted?.(id)}
          likedIds={likedIds}
          onToggleLike={toggleLike}
          ownerProfile={detailProperty.ownerId ? ownerProfiles[detailProperty.ownerId] : null}
          onRequireSignIn={onRequireSignIn}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------
// VISION 2040 — Dubai Urban Master Plan alignment view
// Maps Merveil listings to the 5 urban centers + sustainability
// scoring framework from the Dubai 2040 Urban Master Plan.
// ---------------------------------------------------------------
function Vision2040View({ properties, liveViews }) {
  const [activeCenter, setActiveCenter] = useState(null);

  const centerProperties = (centerId) =>
    properties.filter((p) => p.urbanCenter === centerId && p.visibility !== "investor");

  const avgScore = Math.round(
    properties.reduce((sum, p) => sum + (p.sustainabilityScore || 0), 0) / properties.length
  );

  return (
    <div className="p-4 md:p-6">
      <div
        className="rounded-2xl p-5 mb-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0C3D28, #071828)" }}
      >
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle, #1F8A5C 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Leaf size={20} color="#3FD08C" />
            <span className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: "#3FD08C" }}>
              Dubai 2040 Urban Master Plan
            </span>
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#fff" }} className="text-2xl font-semibold mb-2">
            Vision 2040 on Merveil
          </h1>
          <p className="text-sm max-w-lg" style={{ color: "#9FC9B5" }}>
            Merveil tags every listing against Dubai's 20-year master plan — five urban centers,
            green building standards, and smart-city readiness — so investors and buyers can find
            property aligned with where Dubai is heading.
          </p>
          <div className="flex items-center gap-4 mt-4">
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#fff" }} className="text-2xl font-semibold">
                {avgScore}<span className="text-sm font-normal" style={{ color: "#9FC9B5" }}>/100</span>
              </div>
              <div className="text-[11px]" style={{ color: "#9FC9B5" }}>Avg. sustainability score</div>
            </div>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#fff" }} className="text-2xl font-semibold">
                {properties.filter((p) => p.sustainabilityScore >= 70).length}
              </div>
              <div className="text-[11px]" style={{ color: "#9FC9B5" }}>Vision 2040 listings</div>
            </div>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#fff" }} className="text-2xl font-semibold">5</div>
              <div className="text-[11px]" style={{ color: "#9FC9B5" }}>Urban centers tracked</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ fontFamily: "'Space Grotesk', sans-serif", color: T.ink }} className="text-base font-semibold mb-3">
        The five urban centers
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        {URBAN_CENTERS_2040.map((center) => {
          const Icon = center.icon;
          const count = centerProperties(center.id).length;
          const active = activeCenter === center.id;
          return (
            <button
              key={center.id}
              onClick={() => setActiveCenter((cur) => (cur === center.id ? null : center.id))}
              className="rounded-xl p-4 text-left flex flex-col gap-2"
              style={{
                background: `linear-gradient(135deg, ${center.grad[0]}, ${center.grad[1]})`,
                boxShadow: active ? "0 0 0 3px #1F8A5C" : "none",
              }}
            >
              <Icon size={20} color="#fff" />
              <div className="text-sm font-semibold text-white">{center.name}</div>
              <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.8)" }}>{center.role}</div>
              <div className="text-[11px] font-semibold mt-1" style={{ color: "rgba(255,255,255,0.9)" }}>
                {count} listing{count !== 1 ? "s" : ""}
              </div>
            </button>
          );
        })}
      </div>

      {activeCenter && (
        <div className="mb-5 tab-fade">
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", color: T.ink }} className="text-sm font-semibold mb-2">
            Listings in {URBAN_CENTERS_2040.find((u) => u.id === activeCenter)?.name}
          </div>
          {centerProperties(activeCenter).length === 0 ? (
            <p className="text-sm" style={{ color: T.sub }}>No listings here yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {centerProperties(activeCenter).map((p) => (
                <PropertyCard key={p.id} p={p} liveViews={liveViews} />
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ fontFamily: "'Space Grotesk', sans-serif", color: T.ink }} className="text-base font-semibold mb-3">
        Sustainability scoring factors
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
        {SUSTAINABILITY_FACTORS.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.key} className="rounded-xl p-3 border flex items-center gap-3" style={{ borderColor: T.line, background: "#fff" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#1F8A5C18" }}>
                <Icon size={16} style={{ color: "#1F8A5C" }} />
              </div>
              <span className="text-sm" style={{ color: T.ink }}>{f.label}</span>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] mt-3" style={{ color: T.sub }}>
        Scoring is illustrative on Merveil's side — a real implementation would verify these factors
        against actual green building certifications (e.g. Al Sa'fat, LEED) and Dubai Municipality
        / DEWA data rather than self-reported listing claims.
      </p>
    </div>
  );
}

function PostDeveloperProjectForm({ currentUser, onClose, onCreated }) {
  const [form, setForm] = useState({
    projectName: "", developerName: "", area: "", emirate: "Dubai",
    startingPrice: "", handoverDate: "", paymentPlan: "", unitTypesAvailable: "",
    description: "",
  });
  const [photoUrls, setPhotoUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handlePhotos = async (files) => {
    const list = Array.from(files || []).slice(0, 10 - photoUrls.length);
    if (!list.length) return;
    setUploading(true);
    try {
      for (const file of list) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/people?action=upload", { method: "POST", credentials: "include", body: fd });
        const data = await res.json();
        if (res.ok && data.url) setPhotoUrls((prev) => [...prev, data.url]);
      }
    } catch {}
    setUploading(false);
  };

  const submit = async () => {
    if (!form.projectName || !form.developerName || !form.area) {
      setError("Project name, developer name, and area are required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/properties", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.projectName,
          area: form.area,
          emirate: form.emirate,
          price: form.startingPrice,
          type: "Sale",
          category: "Building",
          description: form.description,
          photoUrls,
          visibility: "investor",
          isDeveloperProject: true,
          developerName: form.developerName,
          handoverDate: form.handoverDate,
          paymentPlan: form.paymentPlan,
          unitTypesAvailable: form.unitTypesAvailable,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Couldn't publish this project."); setSubmitting(false); return; }
      onCreated?.(data.property);
      onClose();
    } catch (e) {
      setError(`Couldn't reach the server — ${e.message}`);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" style={{ background: "rgba(2,13,26,.55)" }} onClick={onClose}>
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-y-auto" style={{ background: "#fff", maxHeight: "88vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: T.line }}>
          <div>
            <div className="text-base font-bold" style={{ color: T.ink }}>Post a Developer Project</div>
            <div className="text-[11px]" style={{ color: T.sub }}>Pre-launch / off-market — goes straight into the Investor Zone, not the public feed.</div>
          </div>
          <button onClick={onClose}><X size={18} color={T.sub} /></button>
        </div>

        <div className="p-5 flex flex-col gap-3">
          <div>
            <label className="text-[11px] font-semibold block mb-1" style={{ color: T.ink }}>Project name *</label>
            <input value={form.projectName} onChange={(e) => update("projectName", e.target.value)} placeholder="e.g. Marina Horizon Residences"
              className="w-full text-sm px-3 py-2.5 rounded-lg border outline-none" style={{ borderColor: T.line }} />
          </div>
          <div>
            <label className="text-[11px] font-semibold block mb-1" style={{ color: T.ink }}>Developer name *</label>
            <input value={form.developerName} onChange={(e) => update("developerName", e.target.value)} placeholder="e.g. Mayfair"
              className="w-full text-sm px-3 py-2.5 rounded-lg border outline-none" style={{ borderColor: T.line }} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold block mb-1" style={{ color: T.ink }}>Area *</label>
              <input value={form.area} onChange={(e) => update("area", e.target.value)} placeholder="e.g. Dubai South"
                className="w-full text-sm px-3 py-2.5 rounded-lg border outline-none" style={{ borderColor: T.line }} />
            </div>
            <div>
              <label className="text-[11px] font-semibold block mb-1" style={{ color: T.ink }}>Emirate</label>
              <select value={form.emirate} onChange={(e) => update("emirate", e.target.value)}
                className="w-full text-sm px-3 py-2.5 rounded-lg border outline-none" style={{ borderColor: T.line }}>
                {["Dubai","Abu Dhabi","Sharjah","Ajman","Ras Al Khaimah","Fujairah","Umm Al Quwain"].map((e) => <option key={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold block mb-1" style={{ color: T.ink }}>Starting price (AED)</label>
              <input value={form.startingPrice} onChange={(e) => update("startingPrice", e.target.value)} placeholder="e.g. 850000" inputMode="numeric"
                className="w-full text-sm px-3 py-2.5 rounded-lg border outline-none" style={{ borderColor: T.line }} />
            </div>
            <div>
              <label className="text-[11px] font-semibold block mb-1" style={{ color: T.ink }}>Handover</label>
              <input value={form.handoverDate} onChange={(e) => update("handoverDate", e.target.value)} placeholder="e.g. Q4 2027"
                className="w-full text-sm px-3 py-2.5 rounded-lg border outline-none" style={{ borderColor: T.line }} />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold block mb-1" style={{ color: T.ink }}>Unit types available</label>
            <input value={form.unitTypesAvailable} onChange={(e) => update("unitTypesAvailable", e.target.value)} placeholder="e.g. Studios, 1BR, 2BR, Penthouses"
              className="w-full text-sm px-3 py-2.5 rounded-lg border outline-none" style={{ borderColor: T.line }} />
          </div>
          <div>
            <label className="text-[11px] font-semibold block mb-1" style={{ color: T.ink }}>Payment plan</label>
            <input value={form.paymentPlan} onChange={(e) => update("paymentPlan", e.target.value)} placeholder="e.g. 20/80, 5 years post-handover"
              className="w-full text-sm px-3 py-2.5 rounded-lg border outline-none" style={{ borderColor: T.line }} />
          </div>
          <div>
            <label className="text-[11px] font-semibold block mb-1" style={{ color: T.ink }}>Description</label>
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3}
              placeholder="Master plan highlights, amenities, JV or partnership options, etc."
              className="w-full text-sm px-3 py-2.5 rounded-lg border outline-none resize-none" style={{ borderColor: T.line }} />
          </div>
          <div>
            <label className="text-[11px] font-semibold block mb-1" style={{ color: T.ink }}>Renderings / master plan images</label>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handlePhotos(e.target.files)} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="w-full text-sm font-semibold py-3 rounded-lg border-2 border-dashed flex items-center justify-center gap-2"
              style={{ borderColor: T.line, color: T.sub }}>
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              {photoUrls.length > 0 ? `${photoUrls.length} image(s) added` : "Add images"}
            </button>
          </div>

          {error && <p className="text-xs" style={{ color: "#E0554C" }}>{error}</p>}

          <button onClick={submit} disabled={submitting}
            className="w-full text-sm font-bold py-3 rounded-xl mt-1"
            style={{ background: T.ink, color: "#fff", opacity: submitting ? 0.6 : 1 }}>
            {submitting ? "Publishing…" : "Publish to Investor Zone"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Invest — LinkedIn-style capital feed (AI, banks, VCs, family offices…).
// Developer / off-plan inventory lives on Pulse; this tab is capital & thesis.
const INVEST_CATEGORIES = [
  "All", "AI & Technology", "Fintech", "Banking", "Venture Capital", "Private Equity",
  "Family Office", "Real Estate Capital", "Healthcare", "Climate & Energy",
  "Consumer", "SaaS", "Deep Tech", "Manufacturing", "Logistics", "Education",
  "Media & Entertainment", "Agriculture", "Infrastructure", "Crypto & Digital Assets",
  "Impact & ESG", "Angel", "Growth", "Seed", "Series A+", "General",
];
const INVEST_INTENTS = [
  { id: "deploying", label: "Deploying capital" },
  { id: "seeking", label: "Seeking investment" },
  { id: "partnership", label: "Partnership" },
  { id: "insight", label: "Market insight" },
];

function InvestPostCard({ post, liked, onLike, onComment, onShare, onRepost, onConnect, onCall, currentUser, onRequireSignIn }) {
  const [menu, setMenu] = useState(false);
  const isOwner = currentUser && post.owner_id && String(currentUser.id) === String(post.owner_id);
  const timeAgo = (() => {
    if (!post.created_at) return "";
    const m = Math.floor((Date.now() - new Date(post.created_at).getTime()) / 60000);
    if (m < 60) return `${Math.max(1, m)}m`;
    if (m < 1440) return `${Math.floor(m / 60)}h`;
    return `${Math.floor(m / 1440)}d`;
  })();
  const hasMedia = !!post.media_url;
  const isVideo = hasMedia && /\.(mp4|webm|mov)/i.test(post.media_url);

  return (
    <article
      className="mb-4 overflow-hidden"
      style={{
        background: "#FFFFFF",
        border: "1px solid rgba(18,22,28,0.07)",
        borderRadius: 22,
        boxShadow: "0 1px 0 rgba(18,22,28,0.03), 0 12px 36px rgba(18,22,28,0.06)",
      }}
    >
      {/* Media stage — always large */}
      <div className="relative w-full overflow-hidden" style={{ height: hasMedia ? 220 : 168, background: "#12100E" }}>
        {hasMedia ? (
          isVideo ? (
            <video src={post.media_url} controls playsInline className="w-full h-full object-cover" />
          ) : (
            <img src={post.media_url} alt="" className="w-full h-full object-cover" loading="lazy" />
          )
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6"
            style={{
              background: "linear-gradient(145deg, #1A1612 0%, #0F1412 50%, #121820 100%)",
            }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                background: "radial-gradient(ellipse 60% 50% at 30% 20%, rgba(196,165,116,0.2), transparent 60%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(14,154,167,0.12), transparent 55%)",
              }}
            />
            <div className="relative text-[10px] font-bold tracking-[0.28em] uppercase mb-2" style={{ color: "rgba(196,165,116,0.7)" }}>Invest</div>
            <div className="relative text-center text-[15px] font-semibold leading-snug px-4" style={{ color: "rgba(247,245,241,0.88)", fontFamily: "Space Grotesk,sans-serif", letterSpacing: "-0.02em" }}>
              {post.title || "Capital opportunity"}
            </div>
            {(post.ticket_min != null || post.ticket_max != null) && (
              <div className="relative mt-3 text-[12px] font-semibold tabular-nums" style={{ color: "#C4A574" }}>
                {[post.ticket_min, post.ticket_max].filter((x) => x != null).map((n) => `AED ${Number(n).toLocaleString()}`).join(" – ")}
              </div>
            )}
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {post.category && (
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(18,16,14,0.72)", color: "#F7F5F1", backdropFilter: "blur(8px)" }}>{post.category}</span>
          )}
          {post.intent && (
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(196,165,116,0.9)", color: "#12100E" }}>
              {INVEST_INTENTS.find((i) => i.id === post.intent)?.label || post.intent}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 md:p-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-sm font-bold" style={{ background: "linear-gradient(145deg,#C4A574,#0E9AA7)", color: "#12100E" }}>
            {post.owner_avatar ? <img src={post.owner_avatar} alt="" className="w-full h-full object-cover" /> : (post.owner_name || "?")[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-[13px] font-semibold truncate" style={{ color: T.ink }}>{post.owner_name || "Investor"}</div>
              <span className="text-[10px]" style={{ color: T.sub }}>{timeAgo}</span>
            </div>
            <div className="text-[11px] truncate mt-0.5" style={{ color: T.sub }}>
              {[post.owner_profession, post.owner_company].filter(Boolean).join(" · ") || "Merveil citizen"}
            </div>
          </div>
          <div className="relative">
            <button type="button" onClick={() => setMenu((v) => !v)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(18,22,28,0.04)" }}>
              <MoreVertical size={14} style={{ color: T.sub }} />
            </button>
            {menu && (
              <div className="absolute right-0 top-9 z-10 rounded-xl shadow-lg border py-1 min-w-[140px]" style={{ background: "#fff", borderColor: T.line }}>
                <button type="button" className="w-full text-left px-3 py-2 text-xs font-semibold" style={{ color: T.ink }}
                  onClick={() => { setMenu(false); onShare?.(post); }}>Share</button>
                {!isOwner && (
                  <button type="button" className="w-full text-left px-3 py-2 text-xs font-semibold" style={{ color: T.ink }}
                    onClick={() => { setMenu(false); currentUser ? onConnect?.(post) : onRequireSignIn?.(); }}>Connect</button>
                )}
              </div>
            )}
          </div>
        </div>

        {hasMedia && post.title && (
          <div className="mt-3 text-[15px] font-semibold leading-snug" style={{ color: T.ink, fontFamily: "Space Grotesk,sans-serif", letterSpacing: "-0.02em" }}>{post.title}</div>
        )}
        {post.body && (
          <p className="mt-2 text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: "rgba(18,22,28,0.72)" }}>{post.body}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.stage && (
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(18,22,28,0.04)", color: T.sub }}>{post.stage}</span>
          )}
          {post.geography && (
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1" style={{ background: "rgba(18,22,28,0.04)", color: T.sub }}>
              <Globe size={9} /> {post.geography}
            </span>
          )}
          {hasMedia && (post.ticket_min != null || post.ticket_max != null) && (
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(196,165,116,0.14)", color: "#8A7040" }}>
              {[post.ticket_min, post.ticket_max].filter((x) => x != null).map((n) => `AED ${Number(n).toLocaleString()}`).join(" – ")}
            </span>
          )}
        </div>

        <div className="mt-4 pt-3 flex items-center justify-between gap-1" style={{ borderTop: "1px solid rgba(18,22,28,0.06)" }}>
          <button type="button" onClick={() => currentUser ? onLike?.(post) : onRequireSignIn?.()}
            className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-2 rounded-xl"
            style={{ color: liked ? "#C45C4A" : T.sub }}>
            <Heart size={15} fill={liked ? "#C45C4A" : "none"} /> {post.likes_count || 0}
          </button>
          <button type="button" onClick={() => currentUser ? onComment?.(post) : onRequireSignIn?.()}
            className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-2 rounded-xl" style={{ color: T.sub }}>
            <MessageCircle size={15} /> Comment
          </button>
          <button type="button" onClick={() => onShare?.(post)}
            className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-2 rounded-xl" style={{ color: T.sub }}>
            <Share2 size={15} /> Share
          </button>
          {!isOwner && (
            <button type="button" onClick={() => currentUser ? onConnect?.(post) : onRequireSignIn?.()}
              className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-2 rounded-xl"
              style={{ background: "rgba(14,154,167,0.1)", color: "#0A7A85" }}>
              Connect
            </button>
          )}
        </div>
      </div>
    </article>
  );
}



function PostInvestModal({ onClose, onPublish, currentUser }) {
  const [form, setForm] = useState({
    title: "", body: "", category: "AI & Technology", sector: "", stage: "",
    ticketMin: "", ticketMax: "", geography: "", intent: "deploying",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const uploadMedia = async (file) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "invest");
      const res = await fetch("/api/people?action=upload", { method: "POST", credentials: "include", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setMediaUrl(data.url || data.publicUrl || "");
    } catch (e) {
      setError(e.message || "Could not upload media");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!form.body.trim() && !form.title.trim()) { setError("Write a title or body."); return; }
    setBusy(true); setError("");
    try {
      await onPublish({
        title: form.title.trim() || null,
        body: form.body.trim() || null,
        category: form.category,
        sector: form.sector || form.category,
        stage: form.stage || null,
        ticketMin: form.ticketMin ? Number(form.ticketMin) : null,
        ticketMax: form.ticketMax ? Number(form.ticketMax) : null,
        geography: form.geography || null,
        intent: form.intent,
        mediaUrl: mediaUrl || null,
        media_url: mediaUrl || null,
      });
      onClose();
    } catch (e) {
      setError(e.message || "Couldn't publish.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" style={{ background: "rgba(18,16,14,0.55)" }}>
      <div className="w-full sm:w-[520px] sm:rounded-2xl rounded-t-2xl flex flex-col" style={{ background: "#F7F5F1", maxHeight: "min(90dvh,720px)", border: "1px solid rgba(196,165,116,0.2)" }}>
        <div className="flex items-center justify-between p-4 border-b shrink-0" style={{ borderColor: "rgba(18,22,28,0.08)" }}>
          <div>
            <div className="text-[9px] font-bold tracking-[0.22em] uppercase" style={{ color: "rgba(196,165,116,0.85)" }}>Invest</div>
            <div className="text-base font-semibold" style={{ fontFamily: "'Space Grotesk',sans-serif", color: T.ink }}>Share opportunity</div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={submit} disabled={busy || uploading} className="text-sm font-semibold px-4 py-2 rounded-xl text-white"
              style={{ background: "linear-gradient(135deg,#0E9AA7,#0A7A85)", opacity: busy ? 0.7 : 1 }}>
              {busy ? "Posting…" : "Post"}
            </button>
            <button type="button" onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(18,22,28,0.06)" }}>
              <X size={18} style={{ color: T.sub }} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          <select value={form.intent} onChange={(e) => upd("intent", e.target.value)} className="text-sm px-3 py-2.5 rounded-xl border outline-none" style={{ borderColor: T.line, background: "#fff" }}>
            {(typeof INVEST_INTENTS !== "undefined" ? INVEST_INTENTS : [{ id: "deploying", label: "Deploying capital" }, { id: "raising", label: "Raising" }]).map((i) => (
              <option key={i.id} value={i.id}>{i.label}</option>
            ))}
          </select>
          <input placeholder="Title" value={form.title} onChange={(e) => upd("title", e.target.value)}
            className="text-sm px-3 py-2.5 rounded-xl border outline-none font-semibold" style={{ borderColor: T.line, background: "#fff", color: T.ink }} />
          <textarea placeholder="Describe the opportunity…" value={form.body} onChange={(e) => upd("body", e.target.value)} rows={4}
            className="text-sm px-3 py-2.5 rounded-xl border outline-none resize-none" style={{ borderColor: T.line, background: "#fff", color: T.ink }} />
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Category" value={form.category} onChange={(e) => upd("category", e.target.value)} className="text-sm px-3 py-2.5 rounded-xl border outline-none" style={{ borderColor: T.line, background: "#fff" }} />
            <input placeholder="Stage" value={form.stage} onChange={(e) => upd("stage", e.target.value)} className="text-sm px-3 py-2.5 rounded-xl border outline-none" style={{ borderColor: T.line, background: "#fff" }} />
            <input placeholder="Ticket min (AED)" type="number" value={form.ticketMin} onChange={(e) => upd("ticketMin", e.target.value)} className="text-sm px-3 py-2.5 rounded-xl border outline-none" style={{ borderColor: T.line, background: "#fff" }} />
            <input placeholder="Ticket max (AED)" type="number" value={form.ticketMax} onChange={(e) => upd("ticketMax", e.target.value)} className="text-sm px-3 py-2.5 rounded-xl border outline-none" style={{ borderColor: T.line, background: "#fff" }} />
          </div>
          <input placeholder="Geography" value={form.geography} onChange={(e) => upd("geography", e.target.value)} className="text-sm px-3 py-2.5 rounded-xl border outline-none" style={{ borderColor: T.line, background: "#fff" }} />

          {/* Media stage — never an empty broken box */}
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px dashed rgba(196,165,116,0.35)", background: "#12100E", minHeight: 140 }}>
            {mediaUrl ? (
              <div className="relative">
                {/\.(mp4|webm|mov)/i.test(mediaUrl) ? (
                  <video src={mediaUrl} controls className="w-full max-h-48 object-cover" />
                ) : (
                  <img src={mediaUrl} alt="" className="w-full max-h-48 object-cover" />
                )}
                <button type="button" onClick={() => setMediaUrl("")} className="absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}>Remove</button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full min-h-[140px] flex flex-col items-center justify-center gap-2 px-4">
                <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "rgba(196,165,116,0.15)" }}>
                  {uploading ? <Loader2 size={18} className="animate-spin" color="#C4A574" /> : <Upload size={18} color="#C4A574" />}
                </div>
                <div className="text-[12px] font-semibold" style={{ color: "rgba(247,245,241,0.85)" }}>{uploading ? "Uploading…" : "Add photo or video"}</div>
                <div className="text-[10px]" style={{ color: "rgba(247,245,241,0.4)" }}>Optional — makes the card larger and more attractive</div>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadMedia(f); e.target.value = ""; }} />
          </div>
          {error && <div className="text-xs font-medium" style={{ color: "#B45309" }}>{error}</div>}
        </div>
      </div>
    </div>
  );
}

function InvestorZone({ liveViews, properties, currentUser, onUpgrade, onPropertyCreated, onSignIn, onChat, onUserUpdated }) {
  const [posts, setPosts] = useState([]);
  const [likedIds, setLikedIds] = useState([]);
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [showPost, setShowPost] = useState(false);
  const [commentPost, setCommentPost] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [upgradeCap, setUpgradeCap] = useState(null);
  const [switchingUpgrade, setSwitchingUpgrade] = useState(false);

  const tryOpenInvestPost = () => {
    if (!currentUser) { onSignIn?.(); return; }
    if (!hasAccess(currentUser, "investorZone")) {
      setUpgradeCap("investorZone");
      return;
    }
    setShowPost(true);
  };
  const activateInvestUpgrade = async (tierId) => {
    setSwitchingUpgrade(true);
    try {
      const res = await merveilFetch("/api/passport?action=activate", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tierId }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 403 && data?.code === "KYC_REQUIRED") {
        alert("Verify your identity in Passport → Verify before activating Investor Passport.");
        setUpgradeCap(null);
        return;
      }
      if (res.ok) {
        onUserUpdated?.({ passportTier: data.passportTier || tierId });
        setUpgradeCap(null);
        setShowPost(true);
        return;
      }
      if (res.status === 402 || data?.code === "INSUFFICIENT_BALANCE") {
        const productId = passportProductId(tierId) || "passport:investor";
        const checkout = await createProductCheckout(productId, {
          idempotencyKey: `invest_up_${tierId}_${Date.now()}`,
        });
        if (checkout.mode === "sandbox") {
          onUserUpdated?.({ passportTier: tierId });
          setUpgradeCap(null);
          setShowPost(true);
          return;
        }
        if (checkout.clientSecret) {
          const conf = await confirmStripePayment(checkout.clientSecret);
          if (!conf.ok && conf.reason !== "stripe_js_missing") {
            throw new Error(conf.message || "Card confirmation failed");
          }
          const intentId = checkout.intent?.id;
          if (intentId) {
            const status = await pollPaymentStatus(intentId, { maxAttempts: 18, intervalMs: 1500 });
            if (status?.settled) {
              const act2 = await merveilFetch("/api/passport?action=activate", {
                method: "POST", credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tier: tierId }),
              });
              const actData = await act2.json().catch(() => null);
              onUserUpdated?.({ passportTier: actData?.passportTier || tierId });
              setUpgradeCap(null);
              setShowPost(true);
              return;
            }
          }
          alert("Payment is processing. Investor access unlocks when the bank confirms.");
          setUpgradeCap(null);
          return;
        }
        alert(data?.error || "Top up your wallet in Passport → Wallet, then try again.");
        setUpgradeCap(null);
        return;
      }
      throw new Error(data?.error || "Activation failed");
    } catch (e) {
      alert(e.message || "Could not activate Passport");
    } finally {
      setSwitchingUpgrade(false);
    }
  };

  const load = (silent = false) => {
    if (!silent) setLoading(true);
    fetch("/api/invest")
      .then((r) => (r.ok ? r.json() : { posts: [] }))
      .then((d) => {
        const next = d.posts || [];
        setPosts((prev) => (silent ? stableMergeById(prev, next) : next));
      })
      .catch(() => { if (!silent) setPosts([]); })
      .finally(() => { if (!silent) setLoading(false); });
  };
  useEffect(() => { load(false); }, []);
  useEffect(() => {
    if (!currentUser?.id) { setLikedIds([]); return; }
    fetch("/api/invest?action=likes", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { likedIds: [] }))
      .then((d) => setLikedIds(d.likedIds || []))
      .catch(() => {});
  }, [currentUser?.id]);

  const filtered = posts.filter((p) => category === "All" || p.category === category || p.sector === category);

  const publish = async (form) => {
    const res = await fetch("/api/invest", {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Couldn't publish.");
    setPosts((prev) => [{
      ...data.post,
      owner_name: currentUser?.name,
      owner_avatar: currentUser?.avatar_url,
      owner_company: currentUser?.company_name,
      owner_profession: currentUser?.profession,
    }, ...prev]);
  };

  const toggleLike = async (post) => {
    const was = likedIds.includes(post.id);
    setLikedIds((p) => (was ? p.filter((id) => id !== post.id) : [...p, post.id]));
    setPosts((prev) => prev.map((x) => x.id === post.id ? { ...x, likes_count: Math.max(0, (x.likes_count || 0) + (was ? -1 : 1)) } : x));
    try {
      const res = await fetch("/api/invest?action=like", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      const data = await res.json();
      if (res.ok) setPosts((prev) => prev.map((x) => x.id === post.id ? { ...x, likes_count: data.likesCount } : x));
    } catch {}
  };

  const share = (post) => {
    const url = `${window.location.origin}/api/share?type=invest&id=${encodeURIComponent(post.id)}`;
    shareMerveilContent({
      title: post.title || "Merveil Invest",
      text: post.body || post.title || "Invest on Merveil",
      url,
      imageUrl: post.photo_url || post.image_url || null,
    });
  };

  const repost = (post) => {
    share(post);
  };

  const connect = async (post) => {
    if (!post.owner_id) return;
    const result = await requestMerveilConnection(post.owner_id);
    if (result.status === "error") alert(result.error || "Couldn't connect.");
    else if (result.status === "accepted" || result.alreadyConnected) onChat?.();
    else alert("Connection request sent.");
  };

  const callOwner = async (post) => {
    if (!post.owner_id) return;
    try {
      const res = await merveilFetch("/api/calls?action=create", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: post.owner_id, type: "voice" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { alert(data?.error || "Couldn't start the call."); return; }
      setActiveCall({ callId: data.call.id, mode: "voice", otherName: post.owner_name || "Investor" });
    } catch {
      alert("Couldn't start the call.");
    }
  };

  // Optional: still surface investor-only property inventory as a secondary strip
  const investorListings = (properties || []).filter((p) => p.visibility === "investor");

  return (
    <div className="pb-nav md:pb-8">
      <div className="pt-4 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", color: T.ink }} className="text-xl font-semibold">Invest</h1>
            <p className="text-xs mt-0.5" style={{ color: T.sub }}>
              Capital, thesis & partnerships — AI, banks, VCs, family offices. Property inventory is on Pulse.
            </p>
          </div>
          <button type="button" onClick={tryOpenInvestPost}
            className="text-xs font-bold px-3 py-2 rounded-xl shrink-0 text-white"
            style={{ background: "linear-gradient(135deg,#0891B2,#1F2937)" }}>
            <Plus size={13} className="inline mr-1" /> Post
          </button>
        </div>
        <div className="mt-3"><UAEFlagStripe height={3} /></div>
        <div className="flex gap-1.5 overflow-x-auto py-3 -mx-1 px-1 no-scrollbar">
          {INVEST_CATEGORIES.map((c) => (
            <button key={c} type="button" onClick={() => setCategory(c)}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap shrink-0"
              style={{
                background: category === c ? "#1F2937" : T.panel,
                color: category === c ? "#fff" : T.sub,
              }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-6 max-w-2xl mx-auto">
        {loading && <div className="text-xs py-8 text-center" style={{ color: T.sub }}>Loading investor feed…</div>}
        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl border p-8 text-center" style={{ borderColor: T.line, background: "#fff" }}>
            <Lock size={22} className="mx-auto mb-2" style={{ color: T.sub }} />
            <div className="text-sm font-semibold" style={{ color: T.ink }}>No posts in this category yet</div>
            <div className="text-xs mt-1 mb-4" style={{ color: T.sub }}>
              Share a thesis, open a ticket, or look for AI / fintech / real-estate capital partners.
            </div>
            <button type="button" onClick={tryOpenInvestPost}
              className="text-xs font-bold px-4 py-2 rounded-full text-white" style={{ background: T.ink }}>
              Be the first to post
            </button>
          </div>
        )}
        {filtered.map((post) => (
          <InvestPostCard
            key={post.id}
            post={post}
            liked={likedIds.includes(post.id)}
            currentUser={currentUser}
            onRequireSignIn={onSignIn}
            onLike={toggleLike}
            onComment={setCommentPost}
            onShare={share}
            onRepost={repost}
            onConnect={connect}
            onCall={callOwner}
          />
        ))}

        {investorListings.length > 0 && (
          <div className="mt-6 mb-4">
            <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: T.sub }}>Off-market property (also on Pulse)</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {investorListings.slice(0, 4).map((p) => (
                <PropertyCard key={p.id} p={p} liveViews={liveViews} />
              ))}
            </div>
          </div>
        )}
      </div>

      {showPost && <PostInvestModal currentUser={currentUser} onClose={() => setShowPost(false)} onPublish={publish} />}
      {upgradeCap && (
        <PassportUpgradeSheet
          user={currentUser}
          capability={upgradeCap}
          switching={switchingUpgrade}
          onClose={() => setUpgradeCap(null)}
          onActivate={activateInvestUpgrade}
        />
      )}
      {commentPost && (
        <CommentsModal targetType="invest_post" targetId={commentPost.id} title={commentPost.title || "Invest post"}
          currentUser={currentUser} onRequireSignIn={onSignIn} onClose={() => setCommentPost(null)} />
      )}
      {activeCall && (
        <RealCallScreen callId={activeCall.callId} role="caller" mode={activeCall.mode}
          otherUser={{ name: activeCall.otherName }} onEnd={() => setActiveCall(null)} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------
// CALL SCREEN — WhatsApp-style voice / video call overlay
// ---------------------------------------------------------------


function PulseIntelligenceReel({ items, activeIndex, onActiveChange, liked, likesCount, supered, superCount, onLike, onSuper, onChat, onShare, onCall, onConnect, onOpenProfile, currentUserId }) {
  const [expanded, setExpanded] = useState(false);
  // TikTok-style: try with sound first. Only fall back to muted if autoplay is blocked.
  const [muted, setMuted] = useState(false);
  const [showMoreTools, setShowMoreTools] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [ownerPresence, setOwnerPresence] = useState("offline");
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const wheelLock = useRef(false);
  const videoRef = useRef(null);

  useEffect(() => { setExpanded(false); }, [activeIndex]);

  // Continuous cycle: next/prev wrap so Pulse never dead-ends.
  const goTo = (i) => {
    if (!items.length) return;
    const n = items.length;
    const next = ((i % n) + n) % n;
    onActiveChange(next);
  };
  const goNext = () => goTo(activeIndex + 1);
  const goPrev = () => goTo(activeIndex - 1);

  // Primary: vertical swipe (UP = next, DOWN = previous). Secondary: horizontal filmstrip.
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current == null || touchStartY.current == null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absY > 48 && absY >= absX) {
      dy > 0 ? goNext() : goPrev();
    } else if (absX > 50 && absX > absY) {
      dx > 0 ? goNext() : goPrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };
  const onWheel = (e) => {
    if (wheelLock.current) return;
    if (Math.abs(e.deltaY) < 14) return;
    wheelLock.current = true;
    e.deltaY > 0 ? goNext() : goPrev();
    setTimeout(() => { wheelLock.current = false; }, 480);
  };

  const current = items[activeIndex];
  const p = current?.data;
  const insight = useMemo(() => (p ? computePropertyMarketInsight(p, items) : null), [p?.id, items.length]);

  // Pulse reels autoplay — sound when possible.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (!p?.video_url) {
      try { el.pause(); } catch {}
      return;
    }
    el.muted = muted;
    el.playsInline = true;
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "");
    const tryPlay = () => {
      const attempt = el.play();
      if (attempt?.catch) {
        attempt.catch(() => {
          el.muted = true;
          setMuted(true);
          el.play().catch(() => {});
        });
      }
    };
    const onCanPlay = () => { tryPlay(); el.removeEventListener("canplay", onCanPlay); };
    el.addEventListener("canplay", onCanPlay);
    try { el.load(); } catch {}
    tryPlay();
    return () => {
      el.removeEventListener("canplay", onCanPlay);
      try { el.pause(); } catch {}
    };
  }, [p?.id, p?.video_url, muted]);

  if (!current || !p) return null;

  const posterName = (p.owner_name || p.author_name || p.lister_name || p.listerName || "").trim() || null;
  const listerRole = LISTER_TYPE_STYLE[p.listedAs]?.label || null;
  const ownerId = p.ownerId || p.owner_id || p.user_id;
  const isOwn = currentUserId && ownerId && String(ownerId) === String(currentUserId);
  const ownerAvatar = p.owner_avatar || p.owner_avatar_url || p.avatar_url || null;
  const displayName = isOwn ? "You" : (posterName || "Merveil Citizen");
  const photo = p.photo_url || p.photo || (Array.isArray(p.photos) ? p.photos[0] : null);
  const bedsLine = [p.beds != null && `${p.beds} Bed${p.beds === 1 ? "" : "s"}`, p.baths != null && `${p.baths} Bath${p.baths === 1 ? "" : "s"}`, p.sqft != null && `${Number(p.sqft).toLocaleString()} sqft`]
    .filter(Boolean).join(" · ");
  const openPoster = () => {
    if (ownerId && onOpenProfile) onOpenProfile(ownerId);
  };

  // Creator online indicator — fetch only for the active poster (no list churn)
  useEffect(() => {
    if (!ownerId || isOwn) { setOwnerPresence("offline"); return; }
    let cancelled = false;
    fetch(`/api/conversations?action=presence&userIds=${encodeURIComponent(ownerId)}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.presence) return;
        const st = d.presence[ownerId] || d.presence[String(ownerId)] || "offline";
        setOwnerPresence(st === "busy" ? "busy" : st === "online" ? "online" : "offline");
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [ownerId, isOwn, p?.id]);

  return (
    <div className="relative h-full w-full overflow-hidden select-none" style={{ background: "#000" }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onWheel={onWheel}>

      <div key={p.id} className="absolute inset-0 tab-fade">
        {p.video_url
          ? <video ref={videoRef} src={p.video_url} loop muted={muted} playsInline preload="auto" className="w-full h-full object-cover" />
          : photo
            ? <img src={photo} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full" style={{ background: `linear-gradient(160deg, ${p.grad?.[0] || "#0F172A"}, ${p.grad?.[1] || "#1E293B"})` }} />}
      </div>

      <MerveilAiMiniMark aiGenerated={false} />

      {p.video_url && (
        <button type="button" onClick={(e) => {
          e.stopPropagation();
          setMuted((m) => {
            const next = !m;
            if (videoRef.current) {
              videoRef.current.muted = next;
              if (!next) videoRef.current.play().catch(() => {});
            }
            return next;
          });
        }}
          className="absolute z-20 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ top: "calc(56px + var(--safe-top, 0px))", right: 12, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)" }}>
          {muted ? <VolumeX size={15} color="#fff" /> : <Volume2 size={15} color="#fff" />}
        </button>
      )}

      <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: "48%",
        background: "linear-gradient(transparent, rgba(0,0,0,0.9))" }} />
      <div className="absolute inset-x-0 top-0 pointer-events-none" style={{ height: 110,
        background: "linear-gradient(rgba(0,0,0,0.55), transparent)" }} />

      {/* Filmstrip — quick jump across current real-estate batch */}
      <div className="absolute left-0 right-0 z-20 overflow-x-auto" style={{ top: "calc(8px + var(--safe-top, 0px))", scrollbarWidth: "none" }}>
        <div className="flex items-center px-4 gap-2.5" style={{ width: "max-content" }}>
          {items.map((item, i) => {
            const isActive = i === activeIndex;
            const thumb = item.data.photo_url || item.data.photo || (Array.isArray(item.data.photos) ? item.data.photos[0] : null);
            return (
              <button key={item.data.id} type="button" onClick={() => goTo(i)}
                className="rounded-full overflow-hidden relative shrink-0" style={{
                  width: isActive ? 52 : 40, height: isActive ? 52 : 40,
                  opacity: isActive ? 1 : 0.55,
                  border: isActive ? "2px solid #06B6D4" : "1.5px solid rgba(255,255,255,0.35)",
                  boxShadow: isActive ? "0 0 14px rgba(6,182,212,0.4)" : "none",
                  transition: "all 0.25s ease",
                }}>
                {thumb
                  ? <img src={thumb} alt="" className="w-full h-full object-cover" />
                  : item.data.video_url
                    ? <video src={item.data.video_url} muted preload="metadata" className="w-full h-full object-cover" />
                    : <div className="w-full h-full" style={{ background: "#1F2937" }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Vertical progress affordance */}
      <div className="absolute left-3 z-20 flex flex-col items-center gap-1.5"
        style={{ bottom: "calc(120px + var(--safe-bottom, 0px))" }}>
        <button type="button" onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)" }}>
          <ChevronUp size={14} color="#fff" />
        </button>
        <div className="text-[9px] font-bold text-white/70">{activeIndex + 1}/{items.length}</div>
        <button type="button" onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)" }}>
          <ChevronDown size={14} color="#fff" />
        </button>
      </div>

      {/* Action rail — Super / Views / Comments / Connect / Call + … */}
      <div className="absolute right-3 z-20 flex flex-col items-center gap-3.5"
        style={{ bottom: "calc(100px + var(--safe-bottom, 0px))" }}>
        <button type="button" onClick={onSuper} className="flex flex-col items-center gap-0.5">
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: supered ? "rgba(6,182,212,0.35)" : "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)", border: supered ? "1.5px solid #06B6D4" : "1px solid transparent" }}>
            <Zap size={20} color={supered ? "#06B6D4" : "#fff"} fill={supered ? "#06B6D4" : "none"} />
          </div>
          <span className="text-[10px] font-semibold text-white">{superCount || 0}</span>
          <span className="text-[8px] font-bold tracking-wide" style={{ color: supered ? "#67E8F9" : "rgba(255,255,255,0.7)" }}>SUPER</span>
        </button>
        <div className="flex flex-col items-center gap-0.5" aria-label="Views">
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}>
            <Eye size={18} color="#fff" />
          </div>
          <span className="text-[10px] font-semibold text-white">{(Number(p?.views) || 0).toLocaleString()}</span>
          <span className="text-[8px] font-bold tracking-wide text-white/70">VIEWS</span>
        </div>
        <button type="button" onClick={() => setShowComments(true)} className="flex flex-col items-center gap-0.5">
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}>
            <MessageSquare size={18} color="#fff" />
          </div>
          <span className="text-[8px] font-bold tracking-wide text-white/70">COMMENTS</span>
        </button>
        <button type="button" onClick={() => (onConnect ? onConnect() : onChat?.())} className="flex flex-col items-center gap-0.5">
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}>
            <UserPlus size={18} color="#fff" />
          </div>
          <span className="text-[8px] font-bold tracking-wide text-white/70">CONNECT</span>
        </button>
        <button type="button" onClick={() => onCall?.()} className="flex flex-col items-center gap-0.5">
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "rgba(6,182,212,0.95)" }}>
            <AnimatedPhone size={18} color="#fff" />
          </div>
          <span className="text-[8px] font-bold tracking-wide text-white/90">CALL</span>
        </button>
        <button type="button" onClick={() => setShowMoreTools((v) => !v)} className="flex flex-col items-center gap-0.5">
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: showMoreTools ? "rgba(14,154,167,0.45)" : "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}>
            <MoreHorizontal size={18} color="#fff" />
          </div>
          <span className="text-[8px] font-bold tracking-wide text-white/70">MORE</span>
        </button>
        {showMoreTools && (
          <div className="absolute right-14 bottom-0 rounded-xl overflow-hidden shadow-xl z-30" style={{ background: "rgba(17,24,39,0.96)", border: "1px solid rgba(255,255,255,0.12)", minWidth: 150 }}>
            <button type="button" className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-white hover:bg-white/10" onClick={() => { setShowMoreTools(false); onLike?.(); }}>
              <Heart size={14} /> Like
            </button>
            <button type="button" className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-white hover:bg-white/10" onClick={() => { setShowMoreTools(false); onShare?.(); }}>
              <Share2 size={14} /> Share
            </button>
            <button type="button" className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-white hover:bg-white/10" onClick={() => { setShowMoreTools(false); onChat?.(); }}>
              <MessageCircle size={14} /> Message
            </button>
          </div>
        )}
      </div>
      {showComments && p && (
        <CommentsModal targetType="property" targetId={String(p.id).replace(/^db-/, "")} title={p.title || "Listing"}
          currentUser={null} onRequireSignIn={undefined} onClose={() => setShowComments(false)} />
      )}

      {/* Bottom chrome — poster profile first (name + avatar), then listing + Intelligence */}
      <div className="absolute left-0 right-0 bottom-0 z-20 px-4"
        style={{ paddingRight: 76, paddingBottom: "calc(16px + var(--safe-bottom, 0px))" }}>
        {/* Poster row — always show person, not only role */}
        <button type="button" onClick={(e) => { e.stopPropagation(); openPoster(); }}
          className="flex items-center gap-2.5 mb-2.5 text-left w-full max-w-[calc(100%-8px)]" aria-label={`Open profile ${displayName}`}>
          <div className="relative w-11 h-11 shrink-0">
            <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-white/30"
              style={{ background: "linear-gradient(135deg,#0E9AA7,#0A7A85)" }}>
              {ownerAvatar
                ? <img src={ownerAvatar} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white">{(displayName || "?")[0]}</div>}
            </div>
            {!isOwn && (ownerPresence === "online" || ownerPresence === "busy") && (
              <span className="absolute -bottom-0.5 -right-0.5"><PresenceDot status={ownerPresence} size={11} /></span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold text-white truncate leading-tight inline-flex items-center gap-1">
              {displayName}
              {!isOwn && isNewCitizen({ created_at: p.owner_created_at }) && <NewEmojiBadge show />}
            </div>
            <div className="text-[11px] text-white/65 truncate">
              {[listerRole, p.area, p.emirate].filter(Boolean).join(" · ") || "Pulse listing"}
            </div>
          </div>
          {isOwn && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{ background: "rgba(6,182,212,0.35)", color: "#A5F3FC", border: "1px solid rgba(6,182,212,0.5)" }}>YOURS</span>
          )}
          {!isOwn && (p.isNew || p.isLive) && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{ background: "rgba(52,211,153,0.25)", color: "#A7F3D0" }}>FRESH</span>
          )}
        </button>

        <div className="text-white text-xl font-bold leading-tight" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
          AED {fmtAED(p.price)}{p.priceFreq && <span className="text-sm font-normal opacity-80">/{p.priceFreq}</span>}
        </div>
        <div className="text-white/90 text-sm font-medium truncate mt-0.5">{p.title || bedsLine || "Property"}</div>
        {bedsLine && <div className="text-white/55 text-[11px] mt-0.5">{bedsLine}</div>}

        <button type="button" onClick={() => setExpanded(true)}
          className="mt-2.5 flex items-center gap-2 text-left w-full rounded-2xl px-3 py-2.5"
          style={{
            background: "linear-gradient(135deg, rgba(14,154,167,0.45) 0%, rgba(6,182,212,0.22) 50%, rgba(15,23,42,0.55) 100%)",
            border: "1px solid rgba(46,196,208,0.35)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 24px rgba(14,154,167,0.18)",
          }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#06B6D4,#0E9AA7)" }}>
            <Sparkles size={16} color="#fff" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-bold text-white tracking-wide">Merveil Intelligence</div>
            <div className="text-[10px] text-white/70 truncate">
              {insight?.demand != null
                ? `Demand ${insight.demand}/100 · ${insight.position || "market scan"} · tap for full read`
                : "Live market read · price · demand · tip"}
            </div>
          </div>
          {insight?.demand != null && (
            <div className="text-[13px] font-bold tabular-nums shrink-0" style={{ color: "#67E8F9" }}>{insight.demand}</div>
          )}
        </button>
      </div>

      {expanded && (
        <div className="absolute inset-0 z-30 flex flex-col justify-end tab-fade" onClick={() => setExpanded(false)}
          style={{ background: "rgba(0,0,0,0.55)" }}>
          <div className="rounded-t-3xl overflow-y-auto px-4 pt-3 pb-6" style={{ background: "linear-gradient(180deg,#0c1929 0%,#0B1220 40%)", maxHeight: "78%" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto mb-3" style={{ background: "rgba(255,255,255,0.2)" }} />
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#06B6D4,#0E9AA7)" }}>
                  <Sparkles size={14} color="#fff" />
                </div>
                <div>
                  <div className="text-[12px] font-bold tracking-wide" style={{ color: "#67E8F9" }}>MERVEIL INTELLIGENCE</div>
                  <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>Pulse · real estate · instant</div>
                </div>
              </div>
              <button type="button" onClick={() => setExpanded(false)} className="text-xs px-2 py-1 rounded-full" style={{ color: "rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.08)" }}>Close</button>
            </div>

            {/* Poster in sheet */}
            <button type="button" onClick={openPoster} className="flex items-center gap-2.5 w-full mb-3 p-2 rounded-xl text-left"
              style={{ background: "rgba(255,255,255,0.05)" }}>
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0" style={{ background: "#0E9AA7" }}>
                {ownerAvatar
                  ? <img src={ownerAvatar} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white">{(displayName || "?")[0]}</div>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white truncate">{displayName}</div>
                <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>{[listerRole, "Open profile"].filter(Boolean).join(" · ")}</div>
              </div>
              {!isOwn && (
                <span type="button" onClick={(e) => { e.stopPropagation(); onChat?.(); }}
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1" style={{ background: "#06B6D4", color: "#04111F" }}>
                  <span aria-hidden>💌</span> Chat
                </span>
              )}
            </button>

            <div className="rounded-2xl p-3.5 mb-3" style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)" }}>
              <div className="text-xl font-bold text-white" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                AED {fmtAED(p.price)}{p.priceFreq && <span className="text-xs font-normal" style={{ color: "rgba(255,255,255,0.55)" }}>/{p.priceFreq}</span>}
              </div>
              <div className="text-xs text-white/80 mt-1">{p.title || bedsLine}</div>
              <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{[p.area, p.emirate].filter(Boolean).join(", ")}</div>
            </div>

            {/* Demand meter */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold" style={{ color: "#67E8F9" }}>Demand signal</span>
                <span className="text-[13px] font-bold tabular-nums text-white">{insight?.demand ?? "—"}<span className="text-[10px] font-medium text-white/40">/100</span></span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full transition-all" style={{
                  width: `${insight?.demand || 8}%`,
                  background: "linear-gradient(90deg,#0E9AA7,#06B6D4,#67E8F9)",
                  boxShadow: "0 0 12px rgba(6,182,212,0.5)",
                }} />
              </div>
              <div className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Freshness · supers · views · video presence</div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>vs area</div>
                <div className="text-sm font-bold mt-0.5" style={{ color: insight?.diffPct != null ? (insight.diffPct <= 0 ? "#34D399" : "#FBBF24") : "#fff" }}>
                  {insight?.diffPct != null ? `${insight.diffPct > 0 ? "+" : ""}${insight.diffPct}%` : "—"}
                </div>
                <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {insight?.sampleSize ? `${insight.sampleSize} comps` : "Need more comps"}
                </div>
              </div>
              <div className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>Position</div>
                <div className="text-sm font-bold mt-0.5 capitalize text-white">{insight?.position || "scanning"}</div>
                <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {insight?.avg != null ? `Avg AED ${fmtAED(Math.round(insight.avg))}` : "Building sample"}
                </div>
              </div>
            </div>

            {insight?.tip && (
              <div className="rounded-xl p-3 mb-3 text-[12px] leading-relaxed" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="font-bold" style={{ color: "#67E8F9" }}>Insight · </span>{insight.tip}
              </div>
            )}

            <div className="flex flex-col gap-1.5 text-xs mb-2">
              {p.status !== "sold" && p.status !== "rented" && (
                <div className="flex items-center gap-1.5" style={{ color: "#34D399" }}><Check size={12}/> Available now</div>
              )}
              {(p.isNew || p.isLive) && (
                <div className="flex items-center gap-1.5" style={{ color: "#67E8F9" }}><Zap size={12}/> Fresh on Pulse</div>
              )}
              {p.video_url && (
                <div className="flex items-center gap-1.5" style={{ color: "#06B6D4" }}><Zap size={12}/> Video listing — higher attention</div>
              )}
              {insight?.similarCount > 0 && (
                <div className="flex items-center gap-1.5" style={{ color: "#94A3B8" }}><Zap size={12}/> {insight.similarCount} similar bed-count in {p.area || "area"}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReelCard({ p, views, liked, likesCount, supered, superCount, onLike, onSuper, onChat, onCall, onShare, isFirst, isActive, forceMuted, compact }) {
  const [muted, setMuted] = useState(false);
  const [userMuted, setUserMuted] = useState(false);
  const videoElRef = useRef(null);

  useEffect(() => {
    const el = videoElRef.current;
    if (!el) return;
    if (isActive) {
      // Try to play with sound first — muting by default was the wrong
      // call when the user never asked for it. Browsers only block this
      // if the page hasn't been interacted with yet; when that happens we
      // fall back to muted (the only way it's still allowed to autoplay)
      // rather than showing a frozen video. Satellite reels in the cluster
      // engine (forceMuted) always stay muted, matching the spec: only
      // the Main Reel ever carries audio.
      el.muted = forceMuted || userMuted;
      const attempt = el.play();
      if (attempt?.catch) {
        attempt.catch(() => {
          el.muted = true;
          setMuted(true);
          el.play().catch(() => {});
        });
      }
    } else {
      // This is the actual fix for videos overlapping as you scroll: every
      // reel that isn't the one currently in view gets paused and reset,
      // instead of every video just autoplaying independently forever.
      el.pause();
      el.currentTime = 0;
    }
  }, [isActive, userMuted, forceMuted]);

  return (
    <div
      className="relative w-full h-full flex flex-col justify-end overflow-hidden"
      style={{
        background: (!p.video_url && p.photo_url)
          ? `url(${p.photo_url}) center/cover no-repeat`
          : `linear-gradient(160deg, ${p.grad[0]}, ${p.grad[1]} 75%)`,
      }}
    >
      {p.video_url && (
        <video ref={videoElRef} src={p.video_url} className="absolute inset-0 w-full h-full object-cover" loop muted={forceMuted || muted} playsInline />
      )}
      {p.video_url && !compact && (
        <button
          onClick={(e) => { e.stopPropagation(); setUserMuted((m) => !m); setMuted((m) => !m); }}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
        >
          {muted ? <VolumeX size={15} color="#fff" /> : <Volume2 size={15} color="#fff" />}
        </button>
      )}
      {(p.photo_url || p.video_url) && (
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.55) 80%)" }} />
      )}
      {/* subtle texture overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 75% 20%, rgba(255,255,255,0.10), transparent 45%), radial-gradient(circle at 15% 85%, rgba(0,0,0,0.25), transparent 50%)",
        }}
      />

      {/* ambient floating balloons */}
      <div className="absolute rounded-full" style={{ width: "70px", height: "70px", background: "rgba(255,255,255,0.08)", top: "18%", left: "8%", animation: "balloonDrift 7s ease-in-out infinite" }} />
      <div className="absolute rounded-full" style={{ width: "110px", height: "110px", background: "rgba(255,255,255,0.05)", top: "50%", right: "-20px", animation: "balloonDrift 9s ease-in-out 1.2s infinite" }} />
      <div className="absolute rounded-full" style={{ width: "44px", height: "44px", background: "rgba(255,255,255,0.10)", top: "75%", left: "22%", animation: "balloonDrift 6s ease-in-out 0.6s infinite" }} />

      {/* top badges */}
      {!compact && (
      <div className="absolute top-4 left-4 flex gap-1.5 z-10">
        {p.promoted && (
          <span className="text-[11px] font-semibold px-2 py-1 rounded-full flex items-center gap-1" style={{ background: T.brass, color: T.ink }}>
            <Zap size={12} /> Promoted
          </span>
        )}
        {p.trending && (
          <span className="text-[11px] font-semibold px-2 py-1 rounded-full flex items-center gap-1" style={{ background: T.signal, color: "#fff" }}>
            <Flame size={12} /> Trending
          </span>
        )}
      </div>
      )}
      {!compact && (
      <div className="absolute top-4 right-4 z-10">
        <span className="text-[11px] font-semibold px-2 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.35)", color: "#fff" }}>
          {LISTER_TYPE_STYLE[p.listedAs]?.label}
        </span>
      </div>
      )}

      {/* right action rail — Super / Comments / Connect / Call + … */}
      {!compact && (
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-4 z-10">
        <button onClick={onSuper} className="flex flex-col items-center gap-0.5 relative">
          {supered && (
            <Zap size={40} color="#06B6D4" fill="none" strokeWidth={2}
              className="absolute -top-2 left-1/2 -translate-x-1/2 pointer-events-none"
              style={{ animation: "energyBurst 0.5s ease-out" }} />
          )}
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: supered ? "rgba(6,182,212,0.35)" : "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}>
            <Zap size={20} color={supered ? "#06B6D4" : "#fff"} fill={supered ? "#06B6D4" : "none"} />
          </div>
          <span className="text-[10px] font-semibold text-white">{superCount || 0}</span>
          <span className="text-[8px] font-bold text-white/70">SUPER</span>
        </button>
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}>
            <Eye size={18} color="#fff" />
          </div>
          <span className="text-[10px] font-semibold text-white">{(Number(views) || Number(p?.views) || 0).toLocaleString()}</span>
          <span className="text-[8px] font-bold text-white/70">VIEWS</span>
        </div>
        <button onClick={onChat} className="flex flex-col items-center gap-0.5">
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}>
            <MessageSquare size={18} color="#fff" />
          </div>
          <span className="text-[8px] font-bold text-white/70">COMMENTS</span>
        </button>
        <button onClick={onChat} className="flex flex-col items-center gap-0.5">
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}>
            <UserPlus size={18} color="#fff" />
          </div>
          <span className="text-[8px] font-bold text-white/70">CONNECT</span>
        </button>
        <button onClick={() => onCall?.()} className="flex flex-col items-center gap-0.5">
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "rgba(6,182,212,0.95)" }}>
            <AnimatedPhone size={18} color="#fff" />
          </div>
          <span className="text-[8px] font-bold text-white/90">CALL</span>
        </button>
        <button onClick={onShare} className="flex flex-col items-center gap-0.5">
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}>
            <MoreHorizontal size={18} color="#fff" />
          </div>
          <span className="text-[8px] font-bold text-white/70">MORE</span>
        </button>
      </div>
      )}

      {/* bottom info */}
      <div className="relative z-10 p-4 pr-20 pb-6">
        {isFirst && !compact && (
          <div
            className="flex flex-col items-center text-white mb-2"
            style={{ animation: "swipeHint 1.6s ease-in-out infinite", opacity: 0.85 }}
          >
            <ChevronRight size={18} style={{ transform: "rotate(-90deg)" }} />
            <span className="text-[11px] font-medium">Swipe up for more</span>
          </div>
        )}
        {compact ? (
          <div className="text-[11px] font-semibold text-white leading-tight" style={{ textShadow: "0 1px 3px rgba(0,0,0,.6)" }}>
            AED {fmtAED(p.price)}
          </div>
        ) : (
        <>
        <div
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          className="text-2xl font-semibold text-white"
        >
          AED {fmtAED(p.price)}
          {p.priceFreq && <span className="text-sm font-normal"> / {p.priceFreq}</span>}
        </div>
        <div className="text-base font-semibold text-white mt-1">{p.title}</div>
        <div className="flex items-center gap-1 text-sm mt-1" style={{ color: "rgba(255,255,255,0.85)" }}>
          <MapPin size={13} /> {p.area}, {p.emirate}
        </div>
        <div className="flex items-center gap-3 text-sm mt-2" style={{ color: "rgba(255,255,255,0.85)" }}>
          {p.beds !== null && <span className="flex items-center gap-1"><BedDouble size={14} /> {p.beds}</span>}
          {p.baths !== null && <span className="flex items-center gap-1"><Bath size={14} /> {p.baths}</span>}
          {p.sqft != null && <span className="flex items-center gap-1"><Maximize size={14} /> {p.sqft.toLocaleString()} sqft</span>}
        </div>
        </>
        )}
      </div>
    </div>
  );
}

function ServiceReelCard({ s, liked, likesCount, onLike, onChat, onCall, onShare, isFirst, compact }) {
  return (
    <div
      className="relative w-full h-full flex flex-col justify-end overflow-hidden"
      style={{ background: `linear-gradient(160deg, ${s.grad[0]}, ${s.grad[1]} 75%)` }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 75% 20%, rgba(255,255,255,0.10), transparent 45%), radial-gradient(circle at 15% 85%, rgba(0,0,0,0.25), transparent 50%)",
        }}
      />
      {!compact && <div className="absolute rounded-full" style={{ width: "70px", height: "70px", background: "rgba(255,255,255,0.08)", top: "18%", left: "8%", animation: "balloonDrift 7s ease-in-out infinite" }} />}
      {!compact && <div className="absolute rounded-full" style={{ width: "110px", height: "110px", background: "rgba(255,255,255,0.05)", top: "50%", right: "-20px", animation: "balloonDrift 9s ease-in-out 1.2s infinite" }} />}

      {!compact && (
      <div className="absolute top-4 left-4 flex gap-1.5 z-10">
        <span className="text-[11px] font-semibold px-2 py-1 rounded-full flex items-center gap-1" style={{ background: "rgba(0,0,0,0.4)", color: "#fff" }}>
          <Wrench size={11} /> Service
        </span>
        {s.pending && (
          <span className="text-[11px] font-semibold px-2 py-1 rounded-full" style={{ background: T.brass, color: T.ink }}>
            New
          </span>
        )}
      </div>
      )}
      {!compact && (
      <div className="absolute top-4 right-4 z-10">
        <span className="text-[11px] font-semibold px-2 py-1 rounded-full flex items-center gap-1" style={{ background: s.online ? "#1F7A4D" : "rgba(0,0,0,0.35)", color: "#fff" }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#fff" }} />
          {s.online ? "Available now" : "Offline"}
        </span>
      </div>
      )}

      {!compact && (
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-10">
        <button onClick={onLike} className="flex flex-col items-center gap-1">
          <Heart
            size={28}
            color="#fff"
            fill={liked ? T.signal : "none"}
            style={{
              stroke: liked ? T.signal : "#fff",
              transform: liked ? "scale(1.18)" : "scale(1)",
              transition: "transform 0.25s cubic-bezier(.34,1.56,.64,1)",
            }}
          />
          <span className="text-[11px] font-semibold text-white">{likesCount || 0} {REACTION_LABEL}</span>
        </button>
        <button onClick={() => onChat?.(s)} className="flex flex-col items-center gap-1">
          <MessageCircle size={28} color="#fff" />
          <span className="text-[11px] font-semibold text-white">Chat</span>
        </button>
        <button onClick={() => onCall?.()} className="flex flex-col items-center gap-1">
          <AnimatedPhone size={28} color="#fff" />
          <span className="text-[11px] font-semibold text-white">Call</span>
        </button>
        <button onClick={onShare} className="flex flex-col items-center gap-1">
          <Share2 size={26} color="#fff" />
          <span className="text-[11px] font-semibold text-white">Share</span>
        </button>
      </div>
      )}

      <div className="relative z-10 p-4 pr-20 pb-6">
        {isFirst && !compact && (
          <div
            className="flex flex-col items-center text-white mb-2"
            style={{ animation: "swipeHint 1.6s ease-in-out infinite", opacity: 0.85 }}
          >
            <ChevronRight size={18} style={{ transform: "rotate(-90deg)" }} />
            <span className="text-[11px] font-medium">Swipe up for more</span>
          </div>
        )}
        {compact ? (
          <div className="text-[11px] font-semibold text-white leading-tight" style={{ textShadow: "0 1px 3px rgba(0,0,0,.6)" }}>{s.name}</div>
        ) : (
        <>
        <div
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          className="text-2xl font-semibold text-white"
        >
          {s.rate}
        </div>
        <div className="text-base font-semibold text-white mt-1">{s.name}</div>
        <div className="flex items-center gap-1 text-sm mt-1" style={{ color: "rgba(255,255,255,0.85)" }}>
          <Wrench size={13} /> {s.category}
        </div>
        <div className="flex items-center gap-3 text-sm mt-2" style={{ color: "rgba(255,255,255,0.85)" }}>
          <span className="flex items-center gap-1"><MapPin size={14} /> {s.area}, {s.emirate}</span>
          {s.rating > 0 && (
            <span className="flex items-center gap-1"><Star size={14} fill="#fff" stroke="none" /> {s.rating}</span>
          )}
        </div>
        </>
        )}
      </div>
    </div>
  );
}

// Real market comparison for the Pulse Intelligence panel — computed
// from the actual properties currently loaded, never invented. If
// there isn't enough real data to say something honest, it says so
// instead of guessing (no "4% below average" unless there's a real
// peer set to average).
function computePropertyMarketInsight(p, items) {
  if (typeof p.price !== "number") return null;
  const all = (items || []).map((it) => it.data || it).filter(Boolean);
  const peers = all.filter((o) => o.id !== p.id && o.area === p.area && typeof o.price === "number");
  const tightPeers = peers.filter((o) => o.beds === p.beds);
  const pool = tightPeers.length >= 2 ? tightPeers : peers;
  const areaCount = peers.length;
  const views = Number(p.views) || 0;
  const supers = Number(p.superCount) || Number(p.super_count) || 0;
  const likes = Number(p.likesCount) || Number(p.likes_count) || 0;

  // Demand signal 0–100 from engagement + freshness
  const ts = p.created_at || p.updated_at || p.posted_at;
  const ageH = ts ? Math.max(0, (Date.now() - new Date(ts).getTime()) / 3600000) : 999;
  let demand = 28;
  if (ageH < 24) demand += 22;
  else if (ageH < 72) demand += 14;
  else if (ageH < 168) demand += 8;
  demand += Math.min(20, supers * 4 + likes * 1.5);
  demand += Math.min(12, Math.log10(views + 1) * 5);
  if (p.video_url) demand += 6;
  demand = Math.max(5, Math.min(98, Math.round(demand)));

  if (pool.length < 2) {
    return {
      similarCount: peers.filter((o) => o.beds === p.beds).length,
      areaCount,
      avg: null,
      diffPct: null,
      sampleSize: pool.length,
      tight: false,
      demand,
      position: null,
      tip: areaCount === 0
        ? "First listing in this area on Pulse — early visibility advantage."
        : "Add more listings in this area to unlock a full market read.",
    };
  }
  const prices = pool.map((o) => o.price).sort((a, b) => a - b);
  const avg = prices.reduce((s, x) => s + x, 0) / prices.length;
  const median = prices[Math.floor(prices.length / 2)];
  const diffPct = Math.round(((p.price - avg) / avg) * 100);
  const belowMed = p.price <= median;
  let position = "mid-market";
  if (diffPct <= -12) position = "value";
  else if (diffPct <= -4) position = "competitive";
  else if (diffPct >= 12) position = "premium";
  else if (diffPct >= 4) position = "above average";

  let tip = "Price sits near local average — lead with unique features.";
  if (diffPct <= -8) tip = "Strong value vs area comps — highlight readiness to view.";
  else if (diffPct >= 10) tip = "Premium vs comps — justify with finish, view, or amenities.";
  if (p.video_url) tip = `${tip} Video already lifts attention.`;

  return {
    similarCount: peers.filter((o) => o.beds === p.beds).length,
    areaCount,
    avg,
    median,
    diffPct,
    sampleSize: pool.length,
    tight: tightPeers.length >= 2,
    demand,
    position,
    tip,
  };
}

/** Stable noise for Pulse (same idea as World) — no rank flicker */
function pulseStableNoise(id) {
  const s = String(id || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return (Math.abs(h) % 1000) / 100; // 0–9.99
}

// Pulse Reels ranking — REAL ESTATE ONLY (never World content).
// Same algorithm family as rankWorldReels: freshness + engagement quality +
// affinity-style mild own boost + small-lister lift + diversity pass.
function rankPulseReels(properties, currentUserId) {
  const list = (properties || []).filter((p) => p && p.visibility !== "investor");
  if (!list.length) return [];
  const me = currentUserId ? String(currentUserId) : null;

  const scored = list.map((p) => {
    let score = 0;
    const owner = String(p.ownerId || p.owner_id || p.user_id || "");
    const area = p.area || p.emirate || "other";
    const views = Number(p.views) || 0;
    const likes = Number(p.likesCount) || Number(p.likes_count) || 0;
    const supers = Number(p.superCount) || Number(p.super_count) || 0;

    // Freshness (mirror World bands)
    const ts = p.created_at || p.updated_at || p.posted_at;
    const ageH = ts ? Math.max(0, (Date.now() - new Date(ts).getTime()) / 3600000) : 9999;
    if (ageH < 6) score += 36;
    else if (ageH < 24) score += 28;
    else if (ageH < 72) score += 18;
    else if (ageH < 168) score += 10;
    else score += Math.max(0, 8 - ageH / 168);
    if (p.isNew || p.isLive) score += 8;

    // Engagement quality (rate > volume)
    if (views > 0) {
      const er = (likes + supers * 3) / Math.max(views, 1);
      score += Math.min(42, er * 220);
      score += Math.min(18, Math.log10(views + 1) * 7);
    } else {
      score += 14; // fair opening for brand-new
    }
    score += Math.min(16, supers * 1.4);
    if (p.video_url) score += 12;

    // Own listings: strong but not absolute monopoly (publish path still jumps to 0)
    if (me && owner && owner === me) score += 48;

    // Small-lister opportunity
    if (owner && views < 800 && (likes + supers) > 0) score += 14;
    if (owner && views < 200) score += 6;

    if (p.status === "sold" || p.status === "rented") score -= 80;

    score += pulseStableNoise(p.id);
    return { p, score, owner, area };
  });

  scored.sort((a, b) => b.score - a.score);

  // Diversity: avoid back-to-back same owner; avoid 3× same area runs
  const out = [];
  const used = new Set();
  const ownerLast = new Map();
  const areaWindow = [];

  const pickNext = () => {
    for (let i = 0; i < scored.length; i++) {
      if (used.has(i)) continue;
      const c = scored[i];
      const lastO = ownerLast.get(c.owner);
      if (
        c.owner &&
        lastO != null &&
        out.length - lastO < 2 &&
        scored.some((x, j) => !used.has(j) && x.owner && x.owner !== c.owner)
      ) continue;
      if (
        areaWindow.length >= 2 &&
        areaWindow[areaWindow.length - 1] === c.area &&
        areaWindow[areaWindow.length - 2] === c.area &&
        scored.some((x, j) => !used.has(j) && x.area !== c.area)
      ) continue;
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
    if (c.owner) ownerLast.set(c.owner, out.length - 1);
    areaWindow.push(c.area);
  }
  return out;
}

function ReelsView({ properties, liveViews, onChat, currentUserId, onRequireSignIn, currentUser }) {
  const guard = (fn) => () => { if (!currentUserId) { onRequireSignIn?.(); return; } fn(); };
  const [liked, setLiked] = useState({});
  const [likesCountOverride, setLikesCountOverride] = useState({});
  const [supered, setSupered] = useState({});
  const [superCountOverride, setSuperCountOverride] = useState({});
  const [activeIndex, setActiveIndex] = useState(0);
  const viewedRef = useRef(new Set());

  useEffect(() => {
    if (!currentUserId) return;
    merveilFetch("/api/properties?action=likes")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.likedIds) return;
        const map = {};
        for (const id of data.likedIds) map[String(id).startsWith("db-") ? id : `db-${id}`] = true;
        setLiked(map);
      })
      .catch(() => {});
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    merveilFetch("/api/properties?action=supers")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.superedIds) return;
        const map = {};
        for (const id of data.superedIds) map[String(id).startsWith("db-") ? id : `db-${id}`] = true;
        setSupered(map);
      })
      .catch(() => {});
  }, [currentUserId]);

  const toggleLike = async (propertyId) => {
    if (!currentUserId) { onRequireSignIn?.(); return; }
    const was = !!liked[propertyId];
    setLiked((prev) => ({ ...prev, [propertyId]: !was }));
    setLikesCountOverride((prev) => {
      const base = prev[propertyId] ?? 0;
      const next = was ? Math.max(0, base - 1) : base + 1;
      return { ...prev, [propertyId]: next };
    });
    try {
      const res = await merveilFetch("/api/properties?action=like", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: String(propertyId).replace(/^db-/, "") }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setLiked((prev) => ({ ...prev, [propertyId]: was }));
        setLikesCountOverride((prev) => {
          const base = prev[propertyId] ?? 0;
          return { ...prev, [propertyId]: was ? base + 1 : Math.max(0, base - 1) };
        });
        if (res.status === 401) onRequireSignIn?.();
      } else if (data && typeof data.likesCount === "number") {
        setLikesCountOverride((prev) => ({ ...prev, [propertyId]: data.likesCount }));
        if (typeof data.liked === "boolean") setLiked((prev) => ({ ...prev, [propertyId]: data.liked }));
      }
    } catch {
      setLiked((prev) => ({ ...prev, [propertyId]: was }));
      setLikesCountOverride((prev) => {
        const base = prev[propertyId] ?? 0;
        return { ...prev, [propertyId]: was ? base + 1 : Math.max(0, base - 1) };
      });
    }
  };

  const toggleSuper = async (propertyId) => {
    if (!currentUserId) { onRequireSignIn?.(); return; }
    const was = !!supered[propertyId];
    setSupered((prev) => ({ ...prev, [propertyId]: !was }));
    setSuperCountOverride((prev) => {
      const base = prev[propertyId] ?? 0;
      const next = was ? Math.max(0, base - 1) : base + 1;
      return { ...prev, [propertyId]: next };
    });
    try {
      const res = await merveilFetch("/api/properties?action=super", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: String(propertyId).replace(/^db-/, "") }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setSupered((prev) => ({ ...prev, [propertyId]: was }));
        setSuperCountOverride((prev) => {
          const base = prev[propertyId] ?? 0;
          return { ...prev, [propertyId]: was ? base + 1 : Math.max(0, base - 1) };
        });
        if (res.status === 401) onRequireSignIn?.();
      } else if (data && typeof data.superCount === "number") {
        setSuperCountOverride((prev) => ({ ...prev, [propertyId]: data.superCount }));
        if (typeof data.supered === "boolean") setSupered((prev) => ({ ...prev, [propertyId]: data.supered }));
      }
    } catch {
      setSupered((prev) => ({ ...prev, [propertyId]: was }));
      setSuperCountOverride((prev) => {
        const base = prev[propertyId] ?? 0;
        return { ...prev, [propertyId]: was ? base + 1 : Math.max(0, base - 1) };
      });
    }
  };

  // Pulse = real estate ecosystem only. Never mix World / services / jobs.
  // Rank only when the catalog signature changes — not on every parent re-render.
  const pulseCatalogSig = useMemo(() => {
    const list = properties || [];
    return list.map((p) => `${p.id}:${p.likesCount || 0}:${p.superCount || 0}:${p.views || 0}:${p.isLive ? 1 : 0}`).join("|");
  }, [properties]);
  const ranked = useMemo(
    () => rankPulseReels(properties || [], currentUserId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pulseCatalogSig, currentUserId]
  );
  const merged = ranked.map((p) => ({
    kind: "property",
    data: p,
    isNew: !!p.isNew || !!p.isLive,
  }));

  // When the citizen publishes a new listing, surface it at index 0 (creator visibility).
  useEffect(() => {
    if (!currentUserId || !merged.length) return;
    const first = merged[0]?.data;
    const owner = first?.ownerId || first?.owner_id || first?.user_id;
    if (owner && String(owner) === String(currentUserId)) {
      setActiveIndex(0);
    }
  }, [merged.length, currentUserId, merged[0]?.data?.id]);

  const activeItem = merged[activeIndex] || merged[0];

  useEffect(() => {
    const pid = activeItem?.data?.id;
    if (!pid || viewedRef.current.has(pid)) return;
    viewedRef.current.add(pid);
    fetch("/api/properties?action=view", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: String(pid).replace(/^db-/, "") }),
    }).catch(() => {});
  }, [activeItem?.data?.id]);

  const shareReel = (item) => {
    const d = item?.data || {};
    const origin = typeof window !== "undefined" ? window.location.origin : "https://www.junction.technology";
    const id = String(d.id || "").replace(/^db-/, "");
    const url = `${origin}/api/share?type=property&id=${encodeURIComponent(id)}`;
    const bits = [];
    if (d.type || d.listing_type) bits.push(String(d.type || d.listing_type));
    if (d.beds != null && d.beds !== "") bits.push(`${d.beds} bed`);
    if (d.area || d.location) bits.push(String(d.area || d.location));
    if (d.emirate) bits.push(String(d.emirate));
    if (d.price != null && d.price !== "") bits.push(`${Number(d.price).toLocaleString()} AED`);
    const summary = bits.filter(Boolean).join(" · ");
    const title = d.title || summary || "Property on Merveil";
    const text = [summary, (d.description || "").slice(0, 160)].filter(Boolean).join(" — ") || title;
    const imageUrl =
      d.photo_url ||
      d.photo ||
      (Array.isArray(d.photo_urls) ? d.photo_urls[0] : null) ||
      (Array.isArray(d.photos) ? d.photos[0] : null) ||
      `${origin}/icons/icon-512.png`;
    shareMerveilContent({ title, text, url, imageUrl });
  };

  const messageLister = async (item) => {
    if (!currentUserId) { onRequireSignIn?.(); return; }
    const p = item?.data;
    const ownerId = p?.ownerId || p?.owner_id || p?.user_id;
    if (!ownerId || String(ownerId) === String(currentUserId)) {
      onChat?.();
      return;
    }
    try {
      const res = await merveilFetch("/api/conversations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantIds: [currentUserId, ownerId] }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.conversation?.id) {
        const detail = {
          conversationId: data.conversation.id,
          otherUserId: ownerId,
          participantIds: [currentUserId, ownerId],
          reused: !!data.reused,
        };
        try {
          sessionStorage.setItem("merveil_pending_conversation", JSON.stringify({ ...detail, at: Date.now() }));
        } catch {}
        try {
          window.dispatchEvent(new CustomEvent("merveil:open-conversation", { detail }));
        } catch {}
      }
      // Switch to Connect/Messages AFTER pending is stored so the mounted
      // MessagesView can open the exact person chat, not a blank list.
      onChat?.();
    } catch {
      onChat?.();
    }
  };

  const callLister = async (item) => {
    if (!currentUserId) { onRequireSignIn?.(); return; }
    const p = item?.data;
    const ownerId = p?.ownerId || p?.owner_id || p?.user_id;
    if (!ownerId || String(ownerId) === String(currentUserId)) return;
    try {
      const res = await merveilFetch("/api/calls?action=create", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calleeId: ownerId, mode: "voice" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { alert(data?.error || "Couldn't start the call."); return; }
      try {
        window.dispatchEvent(new CustomEvent("merveil:start-call", {
          detail: { callId: data?.call?.id, mode: "voice", otherName: p?.owner_name || p?.listerName || "Citizen", role: "caller" },
        }));
      } catch {}
    } catch {
      alert("Couldn't start the call.");
    }
  };

  const connectLister = async (item) => {
    if (!currentUserId) { onRequireSignIn?.(); return; }
    const p = item?.data;
    const ownerId = p?.ownerId || p?.owner_id || p?.user_id;
    if (!ownerId || String(ownerId) === String(currentUserId)) return;
    const result = await requestMerveilConnection(ownerId);
    if (result.status === "error") alert(result.error || "Couldn't connect.");
    else if (result.status === "accepted" || result.alreadyConnected) messageLister(item);
    else alert("Connection request sent.");
  };

  return (
    <div className="h-full pulse-desktop-stage" style={{ background: "#0B0F14" }}>
      <div className="pulse-reel-column h-full w-full" style={{ background: "#000" }}>
      {merged.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-sm px-6 text-center gap-2" style={{ color: "rgba(255,255,255,0.85)" }}>
          <div className="text-[10px] font-bold tracking-wide" style={{ color: T.signalSoft }}>PULSE REELS</div>
          <div className="text-base font-semibold">{t("pulse.emptyTitle")}</div>
          <div className="text-xs max-w-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
            {t("pulse.emptyBody")}
          </div>
        </div>
      )}
      {merged.length > 0 && (
        <PulseIntelligenceReel
          items={merged}
          activeIndex={Math.min(activeIndex, merged.length - 1)}
          onActiveChange={setActiveIndex}
          liked={!!liked[activeItem?.data?.id]}
          likesCount={likesCountOverride[activeItem?.data?.id] ?? activeItem?.data?.likesCount ?? activeItem?.data?.likes_count}
          supered={!!supered[activeItem?.data?.id]}
          superCount={superCountOverride[activeItem?.data?.id] ?? activeItem?.data?.superCount ?? activeItem?.data?.super_count}
          onLike={() => activeItem && toggleLike(activeItem.data.id)}
          onSuper={() => activeItem && toggleSuper(activeItem.data.id)}
          onChat={guard(() => messageLister(activeItem))}
          onShare={() => shareReel(activeItem)}
          onCall={guard(() => callLister(activeItem))}
          onConnect={guard(() => connectLister(activeItem))}
          onOpenProfile={(uid) => {
            if (!uid) return;
            try {
              // Creator page (not only Passport sheet) — same as World
              window.dispatchEvent(new CustomEvent("merveil:open-creator-profile", { detail: { userId: uid } }));
            } catch {}
          }}
          currentUserId={currentUserId}
        />
      )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// SERVICES — marketplace for technicians & trades (carpenters,
// plumbers, electricians, etc.) — the "junction grows" feature
// ---------------------------------------------------------------


function MarketplaceFeedView({
  services = [],
  currentUser,
  onSignIn,
  onChat,
  onPublishService,
  verifyStatuses,
  onUserUpdated,
}) {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all"); // all | jobs | services | seekers
  const [showPost, setShowPost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [visibleCount, setVisibleCount] = useState(12);
  const [upgradeCap, setUpgradeCap] = useState(null);
  const [switchingUpgrade, setSwitchingUpgrade] = useState(false);

  const tryOpenPost = () => {
    if (!currentUser) { onSignIn?.(); return; }
    if (!hasAccess(currentUser, "postService") && !hasAccess(currentUser, "postJob")) {
      setUpgradeCap("postService");
      return;
    }
    setShowPost(true);
  };
  const activateFromUpgrade = async (tierId) => {
    setSwitchingUpgrade(true);
    try {
      const res = await merveilFetch("/api/passport?action=activate", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tierId }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 403 && data?.code === "KYC_REQUIRED") {
        alert("Verify your identity in Passport → Verify before activating this Passport.");
        setUpgradeCap(null);
        return;
      }
      if (res.ok) {
        onUserUpdated?.({ passportTier: data.passportTier || tierId });
        setUpgradeCap(null);
        setShowPost(true);
        return;
      }
      if (res.status === 402 || data?.code === "INSUFFICIENT_BALANCE") {
        const productId = passportProductId(tierId);
        if (!productId) {
          alert(data?.error || "Top up your wallet in Passport → Wallet, then try again.");
          setUpgradeCap(null);
          return;
        }
        const checkout = await createProductCheckout(productId, {
          idempotencyKey: `svc_up_${tierId}_${Date.now()}`,
        });
        if (checkout.mode === "sandbox") {
          onUserUpdated?.({ passportTier: tierId });
          setUpgradeCap(null);
          setShowPost(true);
          return;
        }
        if (checkout.clientSecret) {
          const conf = await confirmStripePayment(checkout.clientSecret);
          if (!conf.ok && conf.reason !== "stripe_js_missing") {
            throw new Error(conf.message || "Card confirmation failed");
          }
          const intentId = checkout.intent?.id;
          if (intentId) {
            const status = await pollPaymentStatus(intentId, { maxAttempts: 18, intervalMs: 1500 });
            if (status?.settled) {
              const act2 = await merveilFetch("/api/passport?action=activate", {
                method: "POST", credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tier: tierId }),
              });
              const actData = await act2.json().catch(() => null);
              onUserUpdated?.({ passportTier: actData?.passportTier || tierId });
              setUpgradeCap(null);
              setShowPost(true);
              return;
            }
          }
          alert("Payment is processing. Access unlocks when the bank confirms.");
          setUpgradeCap(null);
          return;
        }
        alert(data?.error || "Top up your wallet in Passport → Wallet, then try again.");
        setUpgradeCap(null);
        return;
      }
      throw new Error(data?.error || "Activation failed");
    } catch (e) {
      alert(e.message || "Could not activate Passport");
    } finally {
      setSwitchingUpgrade(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetch("/api/jobs").then((r) => (r.ok ? r.json() : { jobs: [] })).catch(() => ({ jobs: [] })),
      fetch("/api/services").then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([jobsData, servicesData]) => {
      if (cancelled) return;
      const jobItems = (jobsData?.jobs || []).map((j) => ({
        kind: "job",
        id: `job-${j.id}`,
        rawId: j.id,
        title: j.title,
        subtitle: [j.company, j.location, j.job_type].filter(Boolean).join(" · "),
        body: j.description,
        salary: j.salary_range,
        category: j.category,
        ownerId: j.owner_id,
        photo: j.photo_url,
        createdAt: j.created_at || j.posted_at || null,
        views: j.views || 0,
      }));
      const apiServices = (servicesData?.services || servicesData?.providers || []).map((s) => ({
        kind: "service",
        id: `svc-${s.id}`,
        rawId: s.id,
        title: s.title || s.name,
        subtitle: [s.category, s.area, s.price_text || s.priceText || s.price].filter(Boolean).join(" · "),
        body: s.description,
        category: s.category,
        ownerId: s.owner_id || s.ownerId,
        photo: s.photo_url || s.photo,
        createdAt: s.created_at,
        views: s.views || 0,
      }));
      const localServices = (services || []).map((s, i) => ({
        kind: "service",
        id: s.id || `local-svc-${i}`,
        rawId: s.id,
        title: s.title || s.name,
        subtitle: [s.category, s.area, s.price || s.priceText].filter(Boolean).join(" · "),
        body: s.description,
        category: s.category,
        ownerId: s.ownerId || s.owner_id,
        photo: s.photo_url || s.photo,
        createdAt: s.created_at || null,
        views: s.views || 0,
      }));
      const merged = [...jobItems, ...apiServices];
      const seen = new Set(merged.map((m) => m.id));
      localServices.forEach((s) => { if (!seen.has(s.id)) merged.push(s); });
      merged.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setItems(merged);
      setVisibleCount(12);
    }).finally(() => { if (!cancelled) setLoading(false); });
    // Soft refresh while Marketplace is open
    const id = setInterval(() => {
      fetch("/api/jobs").then((r) => (r.ok ? r.json() : null)).then((jobsData) => {
        if (!jobsData || cancelled) return;
        // light refresh — merge new jobs on top without full loading flash
        setItems((prev) => {
          const jobItems = (jobsData?.jobs || []).map((j) => ({
            kind: "job", id: `job-${j.id}`, rawId: j.id, title: j.title,
            subtitle: [j.company, j.location, j.job_type].filter(Boolean).join(" · "),
            body: j.description, salary: j.salary_range, category: j.category,
            ownerId: j.owner_id, photo: j.photo_url, createdAt: j.created_at || j.posted_at || null, views: j.views || 0,
          }));
          const map = new Map(prev.map((p) => [p.id, p]));
          jobItems.forEach((j) => map.set(j.id, j));
          return [...map.values()].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        });
      }).catch(() => {});
    }, 45000);
    return () => { cancelled = true; clearInterval(id); };
  }, [services]);

  const filtered = items.filter((it) => {
    if (filter === "all") return true;
    if (filter === "jobs") return it.kind === "job";
    if (filter === "services") return it.kind === "service";
    if (filter === "seekers") return it.kind === "seeker";
    return true;
  });
  const visible = filtered.slice(0, visibleCount);
  const canShowMore = visibleCount < filtered.length;

  const openChat = async (item) => {
    if (!currentUser) { onSignIn?.(); return; }
    if (!item.ownerId) return;
    try {
      const created = await fetch("/api/conversations", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantIds: [currentUser.id, item.ownerId] }),
      }).then((r) => r.json());
      if (created?.conversation?.id) {
        await fetch(`/api/conversations/${created.conversation.id}/messages`, {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: `Hi — interested in "${item.title}" on Merveil Marketplace.` }),
        });
      }
      onChat?.();
    } catch {}
  };

  return (
    <div className="max-w-xl lg:max-w-4xl xl:max-w-5xl mx-auto px-3 md:px-4 lg:px-6 pb-8 w-full">
      {/* LinkedIn-style composer entry */}
      <div className="mt-3 mb-3 rounded-xl p-3 flex items-center gap-3"
        style={{ background: T.panel, border: `1px solid ${T.line}` }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "rgba(6,182,212,0.12)", color: "#06B6D4", fontWeight: 700, fontFamily: "Space Grotesk,sans-serif" }}>
          {(currentUser?.name || "M")[0]}
        </div>
        <button type="button"
          onClick={tryOpenPost}
          className="flex-1 text-left text-sm px-4 py-2.5 rounded-full"
          style={{ background: T.paper, border: `1px solid ${T.line}`, color: T.sub }}>
          Post a job, service, or that you’re open to work…
        </button>
        <button type="button"
          onClick={tryOpenPost}
          className="text-xs font-semibold px-3 py-2 rounded-lg shrink-0"
          style={{ background: "#06B6D4", color: "#fff" }}>
          Post
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3">
        {[
          { id: "all", label: "All" },
          { id: "jobs", label: "Jobs" },
          { id: "services", label: "Services" },
        ].map((f) => (
          <button key={f.id} type="button" onClick={() => setFilter(f.id)}
            className="text-xs font-semibold px-3 py-1.5 rounded-full shrink-0"
            style={{
              background: filter === f.id ? "rgba(6,182,212,0.12)" : T.panel,
              color: filter === f.id ? "#06B6D4" : T.sub,
              border: `1px solid ${filter === f.id ? "rgba(6,182,212,0.35)" : T.line}`,
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 size={22} className="animate-spin" style={{ color: "#06B6D4" }} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 px-6">
          <Store size={28} style={{ color: T.sub, margin: "0 auto 12px" }} />
          <div className="text-sm font-semibold" style={{ color: T.ink }}>Marketplace is ready</div>
          <p className="text-xs mt-1 max-w-xs mx-auto" style={{ color: T.sub }}>
            Jobs and services share one feed. Be the first to post a role or a service.
          </p>
          <button type="button" onClick={tryOpenPost}
            className="mt-4 text-xs font-semibold px-4 py-2 rounded-lg" style={{ background: "#06B6D4", color: "#fff" }}>
            Create a post
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 lg:gap-4">
          {visible.map((it) => (
            <div key={it.id} role="button" tabIndex={0}
              onClick={() => setDetail(it)}
              onKeyDown={(e) => { if (e.key === "Enter") setDetail(it); }}
              className="text-left overflow-hidden transition-all cursor-pointer active:scale-[0.99]"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E4E6EB",
                borderRadius: 12,
                boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
              }}>
              {/* Facebook-style feed card: photo or clean header */}
              <div className="relative w-full overflow-hidden" style={{ height: it.photo ? 180 : "auto", background: it.photo ? "#E4E6EB" : "#F0F2F5" }}>
                {it.photo ? (
                  <img src={it.photo} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="px-4 pt-4 pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                        style={{
                          background: it.kind === "job" ? "rgba(14,154,167,0.12)" : "rgba(14,154,167,0.08)",
                          color: "#0E9AA7",
                        }}>
                        {it.kind === "job" ? "Job" : it.kind === "seeker" ? "Open to work" : "Service"}
                      </span>
                    </div>
                    <div className="text-[17px] font-semibold leading-snug" style={{ color: "#050505", fontFamily: "Inter,system-ui,sans-serif" }}>
                      {it.title || "Marketplace listing"}
                    </div>
                    {it.salary && <div className="mt-1 text-[14px] font-semibold" style={{ color: "#0E9AA7" }}>{it.salary}</div>}
                  </div>
                )}
                {it.photo && (
                  <span className="absolute top-3 left-3 text-[11px] font-semibold px-2 py-0.5 rounded-md"
                    style={{ background: "rgba(255,255,255,0.95)", color: "#0E9AA7" }}>
                    {it.kind === "job" ? "Job" : it.kind === "seeker" ? "Seeker" : "Service"}
                  </span>
                )}
              </div>
              <div className="px-4 py-3">
                {it.photo && (
                  <div className="text-[16px] font-semibold leading-snug mb-1" style={{ color: "#050505" }}>{it.title}</div>
                )}
                {it.subtitle && <div className="text-[13px] mb-0.5" style={{ color: "#65676B" }}>{it.subtitle}</div>}
                {it.category && <div className="text-[12px] mb-1" style={{ color: "#8A8D91" }}>{it.category}</div>}
                {it.body && <p className="text-[14px] leading-relaxed line-clamp-3 mb-2" style={{ color: "#050505" }}>{it.body}</p>}
                {it.photo && it.salary && <div className="text-[14px] font-semibold mb-2" style={{ color: "#0E9AA7" }}>{it.salary}</div>}
                <div className="flex items-center gap-2 pt-2" style={{ borderTop: "1px solid #E4E6EB" }}>
                  <button type="button" className="flex-1 flex items-center justify-center gap-1.5 text-[13px] font-semibold py-2 rounded-lg"
                    style={{ background: "#E7F3FF", color: "#0E9AA7" }}
                    onClick={(e) => { e.stopPropagation(); openChat(it); }}>
                    <MessageCircle size={15} /> Message
                  </button>
                  <button type="button" className="flex-1 flex items-center justify-center gap-1.5 text-[13px] font-semibold py-2 rounded-lg"
                    style={{ background: "#0E9AA7", color: "#fff" }}
                    onClick={(e) => { e.stopPropagation(); setDetail(it); }}>
                    <Eye size={15} /> Open
                  </button>
                  {it.views > 0 && (
                    <span className="text-[12px] px-1" style={{ color: "#65676B" }}>{it.views}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {canShowMore && (
            <button type="button" onClick={() => setVisibleCount((n) => n + 12)}
              className="w-full py-3 rounded-xl text-xs font-bold"
              style={{ background: T.panel, border: `1px solid ${T.line}`, color: "#06B6D4" }}>
              Load more · {filtered.length - visibleCount} remaining
            </button>
          )}
        </div>
      )}

      {showPost && (
        <MarketplacePostModal
          currentUser={currentUser}
          onClose={() => setShowPost(false)}
          onPublished={(item) => {
            setItems((prev) => [item, ...prev]);
            setShowPost(false);
            if (item.kind === "service") onPublishService?.(item);
          }}
          verifyStatuses={verifyStatuses}
        />
      )}

      {upgradeCap && (
        <PassportUpgradeSheet
          user={currentUser}
          capability={upgradeCap}
          switching={switchingUpgrade}
          onClose={() => setUpgradeCap(null)}
          onActivate={activateFromUpgrade}
        />
      )}

      {detail && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.55)" }} onClick={() => setDetail(null)}>
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[85vh] overflow-y-auto"
            style={{ background: T.paper }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                style={{ background: "rgba(6,182,212,0.12)", color: "#06B6D4" }}>
                {detail.kind === "job" ? "Job" : "Service"}
              </span>
              <button type="button" onClick={() => setDetail(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: T.panel }}>
                <X size={16} color={T.sub} />
              </button>
            </div>
            <h2 className="text-lg font-bold" style={{ color: T.ink, fontFamily: "Space Grotesk,sans-serif" }}>{detail.title}</h2>
            {detail.subtitle && <p className="text-xs mt-1" style={{ color: T.sub }}>{detail.subtitle}</p>}
            {detail.salary && <p className="text-sm font-semibold mt-2" style={{ color: "#06B6D4" }}>{detail.salary}</p>}
            {detail.body && <p className="text-sm mt-4 whitespace-pre-wrap" style={{ color: T.ink }}>{detail.body}</p>}
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => openChat(detail)}
                className="flex-1 text-sm font-semibold py-2.5 rounded-xl" style={{ background: "#06B6D4", color: "#fff" }}>
                Message
              </button>
              <button type="button" onClick={() => setDetail(null)}
                className="flex-1 text-sm font-semibold py-2.5 rounded-xl" style={{ background: T.panel, color: T.ink, border: `1px solid ${T.line}` }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MarketplacePostModal({ currentUser, onClose, onPublished, verifyStatuses }) {
  const [kind, setKind] = useState("job"); // job | service | seeker
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [salaryOrPrice, setSalaryOrPrice] = useState("");
  const [jobType, setJobType] = useState("Full-time");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [description, setDescription] = useState("");
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const publish = async () => {
    if (!title.trim()) { setError("Add a clear title."); return; }
    if (!description.trim() || description.trim().length < 40) {
      setError("Add a detailed description (at least a short paragraph) so people know exactly what this is.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (kind === "job") {
        const res = await fetch("/api/jobs", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            category: category || "General",
            jobType,
            salaryRange: salaryOrPrice.trim() || null,
            location: location.trim() || null,
            description: description.trim(),
            company: company.trim() || currentUser?.companyName || null,
            requirements: skills.split(",").map((s) => s.trim()).filter(Boolean),
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || "Couldn't publish job");
        onPublished?.({
          kind: "job",
          id: `job-${data.job?.id || Date.now()}`,
          title: title.trim(),
          subtitle: [company || currentUser?.name, location, jobType].filter(Boolean).join(" · "),
          body: description.trim(),
          salary: salaryOrPrice.trim(),
          category,
          ownerId: currentUser?.id,
          createdAt: new Date().toISOString(),
        });
      } else if (kind === "service") {
        const res = await fetch("/api/services", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            category: category || "service",
            area: location.trim() || null,
            priceText: salaryOrPrice.trim() || null,
            description: description.trim(),
            ownerId: currentUser?.id || null,
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || "Couldn't publish service");
        onPublished?.({
          kind: "service",
          id: `svc-${data.service?.id || Date.now()}`,
          title: title.trim(),
          subtitle: [category, location, salaryOrPrice].filter(Boolean).join(" · "),
          body: description.trim(),
          category,
          ownerId: currentUser?.id,
          createdAt: new Date().toISOString(),
        });
      } else {
        // Open to work — candidate profile
        await fetch("/api/people?action=candidate", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: category || title.trim(),
            emirate: location.trim() || "Dubai",
            experience: experience.trim(),
            languages: skills.split(",").map((s) => s.trim()).filter(Boolean),
            bio: description.trim(),
          }),
        });
        onPublished?.({
          kind: "seeker",
          id: `seeker-${currentUser?.id || Date.now()}`,
          title: title.trim() || "Open to work",
          subtitle: [category, location, experience].filter(Boolean).join(" · "),
          body: description.trim(),
          ownerId: currentUser?.id,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      setError(e.message || "Publish failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto"
        style={{ background: T.paper }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b"
          style={{ background: T.paper, borderColor: T.line }}>
          <button type="button" onClick={onClose} className="text-sm font-medium" style={{ color: T.sub }}>Cancel</button>
          <div className="text-sm font-bold" style={{ color: T.ink }}>Create post</div>
          <button type="button" onClick={publish} disabled={busy}
            className="text-sm font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: "#06B6D4", color: "#fff", opacity: busy ? 0.6 : 1 }}>
            {busy ? "…" : "Post"}
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            {[
              { id: "job", label: "Hiring", icon: Briefcase },
              { id: "service", label: "Service", icon: Wrench },
              { id: "seeker", label: "Open to work", icon: UserCheck },
            ].map((k) => {
              const Icon = k.icon;
              return (
                <button key={k.id} type="button" onClick={() => setKind(k.id)}
                  className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-semibold"
                  style={{
                    background: kind === k.id ? "rgba(6,182,212,0.12)" : T.panel,
                    color: kind === k.id ? "#06B6D4" : T.sub,
                    border: `1px solid ${kind === k.id ? "rgba(6,182,212,0.35)" : T.line}`,
                  }}>
                  <Icon size={16} /> {k.label}
                </button>
              );
            })}
          </div>

          <div>
            <label className="text-[11px] font-semibold" style={{ color: T.sub }}>
              {kind === "job" ? "Job title" : kind === "service" ? "Service title" : "Headline"}
            </label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={kind === "job" ? "e.g. Senior Property Manager — Dubai Marina" : kind === "service" ? "e.g. Licensed AC repair — 24/7 Dubai" : "e.g. Real estate agent open to opportunities"}
              className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl outline-none"
              style={{ background: T.panel, border: `1px solid ${T.line}`, color: T.ink }} />
          </div>

          {kind === "job" && (
            <div>
              <label className="text-[11px] font-semibold" style={{ color: T.sub }}>Company</label>
              <input value={company} onChange={(e) => setCompany(e.target.value)}
                placeholder="Company or agency name"
                className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                style={{ background: T.panel, border: `1px solid ${T.line}`, color: T.ink }} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold" style={{ color: T.sub }}>Category</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)}
                placeholder={kind === "service" ? "Plumbing, Cleaning…" : "Real Estate, Tech…"}
                className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                style={{ background: T.panel, border: `1px solid ${T.line}`, color: T.ink }} />
            </div>
            <div>
              <label className="text-[11px] font-semibold" style={{ color: T.sub }}>Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="Dubai, Abu Dhabi…"
                className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                style={{ background: T.panel, border: `1px solid ${T.line}`, color: T.ink }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold" style={{ color: T.sub }}>
                {kind === "job" ? "Salary range" : kind === "service" ? "Price / rate" : "Experience"}
              </label>
              <input value={kind === "seeker" ? experience : salaryOrPrice}
                onChange={(e) => (kind === "seeker" ? setExperience(e.target.value) : setSalaryOrPrice(e.target.value))}
                placeholder={kind === "job" ? "AED 8,000–12,000" : kind === "service" ? "From AED 150" : "5 years"}
                className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                style={{ background: T.panel, border: `1px solid ${T.line}`, color: T.ink }} />
            </div>
            {kind === "job" ? (
              <div>
                <label className="text-[11px] font-semibold" style={{ color: T.sub }}>Job type</label>
                <select value={jobType} onChange={(e) => setJobType(e.target.value)}
                  className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                  style={{ background: T.panel, border: `1px solid ${T.line}`, color: T.ink }}>
                  {["Full-time", "Part-time", "Contract", "Freelance", "Internship"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-[11px] font-semibold" style={{ color: T.sub }}>
                  {kind === "service" ? "Skills / tags" : "Languages"}
                </label>
                <input value={skills} onChange={(e) => setSkills(e.target.value)}
                  placeholder="Comma-separated"
                  className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                  style={{ background: T.panel, border: `1px solid ${T.line}`, color: T.ink }} />
              </div>
            )}
          </div>

          {kind === "job" && (
            <div>
              <label className="text-[11px] font-semibold" style={{ color: T.sub }}>Requirements / skills</label>
              <input value={skills} onChange={(e) => setSkills(e.target.value)}
                placeholder="RERA, Arabic, CRM…"
                className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                style={{ background: T.panel, border: `1px solid ${T.line}`, color: T.ink }} />
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold" style={{ color: T.sub }}>
              Full details <span style={{ color: T.sub, fontWeight: 400 }}>(required — be specific)</span>
            </label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5}
              placeholder={
                kind === "job"
                  ? "Role responsibilities, must-have experience, benefits, how to apply…"
                  : kind === "service"
                    ? "What you offer, coverage areas, response time, certifications, pricing notes…"
                    : "What roles you’re targeting, strengths, availability, visa status if relevant…"
              }
              className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl outline-none resize-none"
              style={{ background: T.panel, border: `1px solid ${T.line}`, color: T.ink }} />
          </div>

          {error && <p className="text-xs" style={{ color: "#E0554C" }}>{error}</p>}
          <p className="text-[10px]" style={{ color: T.sub }}>
            Intelligent posts convert better: clear title, location, price or salary, and a detailed description help Merveil match the right citizens.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// SOUK — legacy services surface (still used inside Marketplace feed
// paths when needed). Prefer MarketplaceFeedView for the main tab.
// ---------------------------------------------------------------


export {
  PropertyCard,
  DiscoveryOrbs,
  FeedView,
  InvestorZone,
  PulseIntelligenceReel,
  rankPulseReels,
  ReelsView,
  MarketplaceFeedView,
  MarketplacePostModal,
};
