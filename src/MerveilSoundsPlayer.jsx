import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, Search, Globe2, Music2, ExternalLink } from "lucide-react";

const TRACKS = [
  { id:"tarantella", title:"Tarantella", artist:"U.S. Air Force Band / traditional", country:"Italy", region:"Europe", category:"Traditional", license:"Public Domain", url:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Tarantella.ogg", source:"Wikimedia Commons" },
  { id:"egmont", title:"Egmont Overture, Op. 84", artist:"Musopen Symphony Orchestra / Beethoven", country:"Germany", region:"Europe", category:"Classical", license:"CC0", url:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Beethoven_EgmontOvertureOp.84_LudwigVanBeethoven-EgmontOvertureOp.84.ogg", source:"Wikimedia Commons" },
  { id:"beat-electronic", title:"Beat, Electronic", artist:"beat", country:"World", region:"Global", category:"Electronic", license:"Public Domain", url:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Beat_electronic.ogg", source:"Wikimedia Commons" },
  { id:"free-to-use-2", title:"Free To Use 2", artist:"Monplaisir", country:"France", region:"Europe", category:"Electronic", license:"CC0", url:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Monplaisir_-_02_-_Free_To_Use_2.ogg", source:"Wikimedia Commons" },
  { id:"free-to-use-5", title:"Free To Use 5", artist:"Monplaisir", country:"France", region:"Europe", category:"Ambient", license:"CC0", url:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Monplaisir_-_05_-_Free_To_Use_5.ogg", source:"Wikimedia Commons" },
  { id:"three-am", title:"3 am West End", artist:"Statusq", country:"United Kingdom", region:"Europe", category:"Electronic", license:"CC0", url:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Statusq_-_3_am_West_End.opus", source:"Wikimedia Commons" },
  { id:"horroriffic", title:"Horroriffic", artist:"Kevin MacLeod", country:"United States", region:"North America", category:"Cinematic", license:"CC0", url:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Kevin_MacLeod_-_Horroriffic.ogg", source:"Wikimedia Commons" },
  { id:"maple-leaf", title:"Maple Leaf Rag", artist:"Scott Joplin", country:"United States", region:"North America", category:"Ragtime", license:"Public Domain", url:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Maple_leaf_rag_-_played_by_Scott_Joplin_1916_V2.ogg", source:"Wikimedia Commons" },
  { id:"stars-stripes", title:"Stars and Stripes Forever", artist:"John Philip Sousa / Sousa's Band", country:"United States", region:"North America", category:"March", license:"Public Domain", url:"https://commons.wikimedia.org/wiki/Special:Redirect/file/John_Philip_Sousa_-_Stars_and_Stripes_Forever.ogg", source:"Wikimedia Commons" },
  { id:"shenandoah", title:"Shenandoah", artist:"U.S. Air Force Band / traditional", country:"United States", region:"North America", category:"Folk", license:"Public Domain", url:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Shenandoah.ogg", source:"Wikimedia Commons" },
];

const CATEGORIES = ["All", ...Array.from(new Set(TRACKS.map(t => t.category)))];
const REGIONS = ["All", ...Array.from(new Set(TRACKS.map(t => t.region)))];
const COUNTRIES = ["All", ...Array.from(new Set(TRACKS.map(t => t.country)))];

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2,"0")}`;
}

export default function MerveilSoundsPlayer() {
  const audioRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(() => Number(localStorage.getItem("merveil_sounds_volume") || 0.72));
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [region, setRegion] = useState("All");
  const [country, setCountry] = useState("All");
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);

  const filtered = useMemo(() => TRACKS.filter(t => {
    const q = query.trim().toLowerCase();
    return (!q || `${t.title} ${t.artist} ${t.country} ${t.category}`.toLowerCase().includes(q)) &&
      (category === "All" || t.category === category) && (region === "All" || t.region === region) && (country === "All" || t.country === country);
  }), [query, category, region, country]);

  const track = TRACKS[current];

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("merveil:open-sounds", handler);
    return () => window.removeEventListener("merveil:open-sounds", handler);
  }, []);

  useEffect(() => {
    localStorage.setItem("merveil_sounds_volume", String(volume));
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.src = track.url;
    audioRef.current.load();
    setProgress(0);
    if (playing) audioRef.current.play().catch(() => setPlaying(false));
  }, [current]);

  const selectTrack = (id) => {
    const index = TRACKS.findIndex(t => t.id === id);
    if (index >= 0) { setCurrent(index); setPlaying(true); }
  };

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); }
  };

  const next = () => {
    if (shuffle) {
      let n = current;
      while (TRACKS.length > 1 && n === current) n = Math.floor(Math.random() * TRACKS.length);
      setCurrent(n);
    } else setCurrent((current + 1) % TRACKS.length);
  };

  const previous = () => setCurrent((current - 1 + TRACKS.length) % TRACKS.length);

  if (!open) return null;

  return <>
    <audio ref={audioRef} preload="metadata" onLoadedMetadata={e => setDuration(e.currentTarget.duration)} onTimeUpdate={e => setProgress(e.currentTarget.currentTime)} onEnded={() => repeat ? audioRef.current?.play() : next()} />
    <div style={{position:"fixed",inset:0,zIndex:99999,background:"rgba(2,5,12,.82)",backdropFilter:"blur(18px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <section style={{width:"min(1120px,100%)",height:"min(760px,94vh)",background:"linear-gradient(145deg,#101827,#07101c)",border:"1px solid rgba(255,255,255,.12)",borderRadius:28,boxShadow:"0 30px 100px rgba(0,0,0,.55)",color:"#fff",display:"flex",flexDirection:"column",overflow:"hidden",fontFamily:"Inter,system-ui,sans-serif"}}>
        <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 24px",borderBottom:"1px solid rgba(255,255,255,.08)"}}>
          <div><div style={{fontSize:11,letterSpacing:2.5,opacity:.5}}>MERVEIL</div><h2 style={{margin:"3px 0 0",fontSize:25}}>Sounds</h2><div style={{fontSize:12,opacity:.55,marginTop:3}}>Open music & audio library · worldwide</div></div>
          <button onClick={() => setOpen(false)} aria-label="Close Sounds" style={{width:40,height:40,borderRadius:12,border:"1px solid rgba(255,255,255,.12)",background:"rgba(255,255,255,.06)",color:"#fff"}}><X size={20}/></button>
        </header>
        <div style={{display:"flex",gap:10,padding:"16px 20px",flexWrap:"wrap",borderBottom:"1px solid rgba(255,255,255,.07)"}}>
          <div style={{flex:"1 1 240px",position:"relative"}}><Search size={17} style={{position:"absolute",left:13,top:12,opacity:.5}}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search music, artist, country..." style={{width:"100%",boxSizing:"border-box",height:42,padding:"0 14px 0 38px",borderRadius:12,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.06)",color:"#fff",outline:"none"}}/></div>
          {[ ["Category",category,CATEGORIES,setCategory], ["Region",region,REGIONS,setRegion], ["Country",country,COUNTRIES,setCountry] ].map(([label,value,items,setter])=><select key={label} value={value} onChange={e=>setter(e.target.value)} style={{height:42,minWidth:130,borderRadius:12,border:"1px solid rgba(255,255,255,.1)",background:"#111c2a",color:"#fff",padding:"0 12px"}}>{items.map(x=><option key={x} value={x}>{label}: {x}</option>)}</select>)}
        </div>
        <div style={{flex:1,overflow:"auto",padding:"8px 20px 120px"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"13px 4px",fontSize:12,opacity:.55}}><Globe2 size={15}/> {filtered.length} open tracks · CC0/Public Domain prioritized</div>
          {filtered.map(t=><button key={t.id} onClick={()=>selectTrack(t.id)} style={{width:"100%",display:"grid",gridTemplateColumns:"48px 1fr auto",gap:14,alignItems:"center",textAlign:"left",padding:"12px 10px",border:0,borderRadius:16,background:t.id===track.id?"rgba(255,255,255,.09)":"transparent",color:"#fff",cursor:"pointer"}}>
            <span style={{width:44,height:44,borderRadius:13,display:"grid",placeItems:"center",background:"rgba(255,255,255,.07)"}}>{t.id===track.id&&playing?<Pause size={18}/>:<Music2 size={18}/>}</span>
            <span><strong style={{display:"block",fontSize:14}}>{t.title}</strong><span style={{display:"block",fontSize:12,opacity:.55,marginTop:3}}>{t.artist} · {t.country}</span></span>
            <span style={{fontSize:10,padding:"5px 8px",borderRadius:8,background:"rgba(255,255,255,.07)",opacity:.75}}>{t.license}</span>
          </button>)}
          {!filtered.length&&<div style={{padding:60,textAlign:"center",opacity:.55}}>No open tracks match those filters.</div>}
        </div>
        <footer style={{position:"absolute",left:0,right:0,bottom:0,background:"rgba(7,13,23,.96)",borderTop:"1px solid rgba(255,255,255,.1)",padding:"14px 20px"}}>
          <div style={{maxWidth:1080,margin:"auto"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}><div style={{minWidth:0,flex:1}}><strong style={{fontSize:14}}>{track.title}</strong><div style={{fontSize:11,opacity:.5}}>{track.artist} · {track.license}</div></div><button onClick={()=>setShuffle(!shuffle)} aria-label="Shuffle" style={{background:"none",border:0,color:shuffle?"#fff":"#657080"}}><Shuffle size={17}/></button><button onClick={previous} aria-label="Previous" style={{background:"none",border:0,color:"#fff"}}><SkipBack size={19}/></button><button onClick={togglePlay} aria-label={playing?"Pause":"Play"} style={{width:44,height:44,borderRadius:50,border:0,background:"#fff",color:"#08101b",display:"grid",placeItems:"center"}}>{playing?<Pause size={19}/>:<Play size={19} fill="currentColor"/>}</button><button onClick={next} aria-label="Next" style={{background:"none",border:0,color:"#fff"}}><SkipForward size={19}/></button><button onClick={()=>setRepeat(!repeat)} aria-label="Repeat" style={{background:"none",border:0,color:repeat?"#fff":"#657080"}}><Repeat size={17}/></button><button onClick={()=>setMuted(!muted)} aria-label="Mute" style={{background:"none",border:0,color:"#fff"}}>{muted?<VolumeX size={18}/>:<Volume2 size={18}/>}</button><input aria-label="Volume" type="range" min="0" max="1" step="0.01" value={muted?0:volume} onChange={e=>{setMuted(false);setVolume(Number(e.target.value))}} style={{width:90}}/></div>
            <div style={{display:"flex",alignItems:"center",gap:9,marginTop:8}}><span style={{fontSize:10,opacity:.5}}>{formatTime(progress)}</span><input aria-label="Seek" type="range" min="0" max={duration||0} step="0.1" value={Math.min(progress,duration||0)} onChange={e=>{const v=Number(e.target.value);setProgress(v);if(audioRef.current)audioRef.current.currentTime=v}} style={{flex:1}}/><span style={{fontSize:10,opacity:.5}}>{formatTime(duration)}</span><a href={`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(track.title)}.ogg`} target="_blank" rel="noreferrer" title="Open source" style={{color:"#fff",opacity:.55}}><ExternalLink size={14}/></a></div>
          </div>
        </footer>
      </section>
    </div>
  </>;
}
