import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, Search, Globe2, Music2, ExternalLink, FolderOpen, Video, FileAudio, Maximize2 } from "lucide-react";

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
  const mediaRef = useRef(null);
  const fileInputRef = useRef(null);
  const objectUrlsRef = useRef([]);
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
  const [mode, setMode] = useState("open");
  const [localFiles, setLocalFiles] = useState([]);
  const [localIndex, setLocalIndex] = useState(0);
  const [localKind, setLocalKind] = useState("audio");
  const [mediaError, setMediaError] = useState("");

  const filtered = useMemo(() => TRACKS.filter(t => {
    const q = query.trim().toLowerCase();
    return (!q || `${t.title} ${t.artist} ${t.country} ${t.category}`.toLowerCase().includes(q)) &&
      (category === "All" || t.category === category) && (region === "All" || t.region === region) && (country === "All" || t.country === country);
  }), [query, category, region, country]);

  const track = TRACKS[current];
  const localFile = localFiles[localIndex];

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("merveil:open-sounds", handler);
    return () => window.removeEventListener("merveil:open-sounds", handler);
  }, []);

  useEffect(() => {
    localStorage.setItem("merveil_sounds_volume", String(volume));
    if (mediaRef.current) mediaRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  useEffect(() => () => objectUrlsRef.current.forEach(URL.revokeObjectURL), []);

  useEffect(() => {
    if (!mediaRef.current || mode !== "open") return;
    mediaRef.current.src = track.url;
    mediaRef.current.load();
    setProgress(0);
    setDuration(0);
    setMediaError("");
    if (playing) mediaRef.current.play().catch(() => setPlaying(false));
  }, [current, mode]);

  useEffect(() => {
    if (!mediaRef.current || mode !== "local" || !localFile) return;
    mediaRef.current.src = localFile.url;
    mediaRef.current.load();
    setProgress(0);
    setDuration(0);
    setMediaError("");
    if (playing) mediaRef.current.play().catch(() => setPlaying(false));
  }, [localIndex, localFile, mode]);

  const selectTrack = (id) => {
    const index = TRACKS.findIndex(t => t.id === id);
    if (index >= 0) { setMode("open"); setCurrent(index); setPlaying(true); }
  };

  const togglePlay = () => {
    const a = mediaRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().then(() => setPlaying(true)).catch(() => setMediaError("This media could not be played by the browser.")); }
  };

  const next = () => {
    if (mode === "local" && localFiles.length) {
      if (shuffle) {
        let n = localIndex;
        while (localFiles.length > 1 && n === localIndex) n = Math.floor(Math.random() * localFiles.length);
        setLocalIndex(n);
      } else setLocalIndex((localIndex + 1) % localFiles.length);
      setPlaying(true);
      return;
    }
    if (shuffle) {
      let n = current;
      while (TRACKS.length > 1 && n === current) n = Math.floor(Math.random() * TRACKS.length);
      setCurrent(n);
    } else setCurrent((current + 1) % TRACKS.length);
    setPlaying(true);
  };

  const previous = () => {
    if (mode === "local" && localFiles.length) setLocalIndex((localIndex - 1 + localFiles.length) % localFiles.length);
    else setCurrent((current - 1 + TRACKS.length) % TRACKS.length);
    setPlaying(true);
  };

  const openLocalFiles = (event) => {
    const files = Array.from(event.target.files || []).filter(file => file.type.startsWith("audio/") || file.type.startsWith("video/") || /\.(mp3|wav|m4a|aac|ogg|opus|flac|mp4|webm|mov|m4v|avi)$/i.test(file.name));
    if (!files.length) { setMediaError("No supported audio or video files were selected."); return; }
    objectUrlsRef.current.forEach(URL.revokeObjectURL);
    const mapped = files.map((file, index) => ({ id:`local-${Date.now()}-${index}`, name:file.name, type:file.type, size:file.size, url:URL.createObjectURL(file), kind:file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v|avi)$/i.test(file.name) ? "video" : "audio" }));
    objectUrlsRef.current = mapped.map(x => x.url);
    setLocalFiles(mapped);
    setLocalIndex(0);
    setLocalKind(mapped[0].kind);
    setMode("local");
    setPlaying(true);
    setOpen(true);
    setMediaError("");
    event.target.value = "";
  };

  const activeTitle = mode === "local" ? (localFile?.name || "Local media") : track.title;
  const activeArtist = mode === "local" ? "On this device · private playback" : `${track.artist} · ${track.license}`;

  if (!open) return null;

  return <>
    {mode === "local" && localKind === "video" ? <video ref={mediaRef} preload="metadata" playsInline onLoadedMetadata={e => setDuration(e.currentTarget.duration)} onTimeUpdate={e => setProgress(e.currentTarget.currentTime)} onEnded={() => repeat ? mediaRef.current?.play() : next()} onError={() => setMediaError("This video format is not supported by the browser. Try MP4/H.264 or WebM.")} style={{display:"none"}} /> : <audio ref={mediaRef} preload="metadata" onLoadedMetadata={e => setDuration(e.currentTarget.duration)} onTimeUpdate={e => setProgress(e.currentTarget.currentTime)} onEnded={() => repeat ? mediaRef.current?.play() : next()} onError={() => setMediaError("This media could not be played by the browser.")} />}
    <div style={{position:"fixed",inset:0,zIndex:99999,background:"rgba(2,5,12,.84)",backdropFilter:"blur(18px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <section style={{width:"min(1160px,100%)",height:"min(800px,94vh)",background:"linear-gradient(145deg,#101827,#07101c)",border:"1px solid rgba(255,255,255,.12)",borderRadius:28,boxShadow:"0 30px 100px rgba(0,0,0,.55)",color:"#fff",display:"flex",flexDirection:"column",overflow:"hidden",fontFamily:"Inter,system-ui,sans-serif",position:"relative"}}>
        <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 24px",borderBottom:"1px solid rgba(255,255,255,.08)"}}>
          <div><div style={{fontSize:11,letterSpacing:2.5,opacity:.5}}>MERVEIL</div><h2 style={{margin:"3px 0 0",fontSize:25}}>Sounds</h2><div style={{fontSize:12,opacity:.55,marginTop:3}}>Your personal media space · open library · private device playback</div></div>
          <div style={{display:"flex",gap:8}}><button onClick={()=>fileInputRef.current?.click()} style={{height:40,padding:"0 13px",borderRadius:12,border:"1px solid rgba(255,255,255,.12)",background:"rgba(255,255,255,.07)",color:"#fff",display:"flex",alignItems:"center",gap:7}}><FolderOpen size={16}/> Open device</button><button onClick={() => setOpen(false)} aria-label="Close Sounds" style={{width:40,height:40,borderRadius:12,border:"1px solid rgba(255,255,255,.12)",background:"rgba(255,255,255,.06)",color:"#fff"}}><X size={20}/></button></div>
          <input ref={fileInputRef} type="file" accept="audio/*,video/*,.mp3,.wav,.m4a,.aac,.ogg,.opus,.flac,.mp4,.webm,.mov,.m4v,.avi" multiple onChange={openLocalFiles} style={{display:"none"}} />
        </header>

        {mode === "local" && localFile?.kind === "video" ? <div style={{height:260,background:"#000",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",borderBottom:"1px solid rgba(255,255,255,.08)"}}>
          <video key={localFile.id} src={localFile.url} controls playsInline autoPlay onLoadedMetadata={e=>{setDuration(e.currentTarget.duration);mediaRef.current=e.currentTarget}} onTimeUpdate={e=>setProgress(e.currentTarget.currentTime)} onEnded={()=>repeat?e.currentTarget.play():next()} style={{width:"100%",height:"100%",objectFit:"contain"}} />
          <div style={{position:"absolute",top:12,left:14,padding:"6px 9px",borderRadius:9,background:"rgba(0,0,0,.6)",fontSize:10,display:"flex",gap:6,alignItems:"center"}}><Video size={13}/> LOCAL VIDEO</div>
        </div> : null}

        <div style={{display:"flex",gap:8,padding:"14px 20px",flexWrap:"wrap",borderBottom:"1px solid rgba(255,255,255,.07)"}}>
          <button onClick={()=>setMode("open")} style={{height:38,padding:"0 13px",borderRadius:11,border:"1px solid rgba(255,255,255,.1)",background:mode==="open"?"rgba(255,255,255,.12)":"transparent",color:"#fff"}}><Music2 size={14}/> Open Library</button>
          <button onClick={()=>setMode("local")} disabled={!localFiles.length} style={{height:38,padding:"0 13px",borderRadius:11,border:"1px solid rgba(255,255,255,.1)",background:mode==="local"?"rgba(255,255,255,.12)":"transparent",color:"#fff",opacity:localFiles.length?1:.45}}><FolderOpen size={14}/> My Device {localFiles.length ? `(${localFiles.length})` : ""}</button>
          {mode === "open" && <><div style={{flex:"1 1 220px",position:"relative"}}><Search size={17} style={{position:"absolute",left:13,top:10,opacity:.5}}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search music, artist, country..." style={{width:"100%",boxSizing:"border-box",height:38,padding:"0 14px 0 38px",borderRadius:11,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.06)",color:"#fff",outline:"none"}}/></div>{[["Category",category,CATEGORIES,setCategory],["Region",region,REGIONS,setRegion],["Country",country,COUNTRIES,setCountry]].map(([label,value,items,setter])=><select key={label} value={value} onChange={e=>setter(e.target.value)} style={{height:38,minWidth:125,borderRadius:11,border:"1px solid rgba(255,255,255,.1)",background:"#111c2a",color:"#fff",padding:"0 10px"}}>{items.map(x=><option key={x} value={x}>{label}: {x}</option>)}</select>)}</>}
        </div>

        {mediaError && <div style={{margin:"10px 20px 0",padding:"9px 12px",borderRadius:10,background:"rgba(255,80,80,.1)",border:"1px solid rgba(255,80,80,.2)",fontSize:12,color:"#ffb5b5"}}>{mediaError}</div>}

        <div style={{flex:1,overflow:"auto",padding:"8px 20px 150px"}}>
          {mode === "local" ? <>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"13px 4px",fontSize:12,opacity:.55}}><FolderOpen size={15}/> Local media · files are selected from this device and are not uploaded by Merveil.</div>
            {localFiles.map((f,i)=><button key={f.id} onClick={()=>{setLocalIndex(i);setLocalKind(f.kind);setPlaying(true)}} style={{width:"100%",display:"grid",gridTemplateColumns:"48px 1fr auto",gap:14,alignItems:"center",textAlign:"left",padding:"12px 10px",border:0,borderRadius:16,background:i===localIndex?"rgba(255,255,255,.09)":"transparent",color:"#fff",cursor:"pointer"}}>
              <span style={{width:44,height:44,borderRadius:13,display:"grid",placeItems:"center",background:"rgba(255,255,255,.07)"}}>{f.kind==="video"?<Video size={18}/>:<FileAudio size={18}/>}</span>
              <span><strong style={{display:"block",fontSize:14,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{f.name}</strong><span style={{display:"block",fontSize:12,opacity:.5,marginTop:3}}>{f.kind.toUpperCase()} · {(f.size/1024/1024).toFixed(1)} MB · local</span></span>
              {i===localIndex&&playing?<Pause size={17}/>:<Play size={17}/>} 
            </button>)}
          </> : <>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"13px 4px",fontSize:12,opacity:.55}}><Globe2 size={15}/> {filtered.length} open tracks · CC0/Public Domain prioritized</div>
            {filtered.map(t=><button key={t.id} onClick={()=>selectTrack(t.id)} style={{width:"100%",display:"grid",gridTemplateColumns:"48px 1fr auto",gap:14,alignItems:"center",textAlign:"left",padding:"12px 10px",border:0,borderRadius:16,background:t.id===track.id?"rgba(255,255,255,.09)":"transparent",color:"#fff",cursor:"pointer"}}>
              <span style={{width:44,height:44,borderRadius:13,display:"grid",placeItems:"center",background:"rgba(255,255,255,.07)"}}>{t.id===track.id&&playing?<Pause size={18}/>:<Music2 size={18}/>}</span>
              <span><strong style={{display:"block",fontSize:14}}>{t.title}</strong><span style={{display:"block",fontSize:12,opacity:.55,marginTop:3}}>{t.artist} · {t.country}</span></span>
              <span style={{fontSize:10,padding:"5px 8px",borderRadius:8,background:"rgba(255,255,255,.07)",opacity:.75}}>{t.license}</span>
            </button>)}
            {!filtered.length&&<div style={{padding:60,textAlign:"center",opacity:.55}}>No open tracks match those filters.</div>}
          </>}
        </div>

        <footer style={{position:"absolute",left:0,right:0,bottom:0,background:"rgba(7,13,23,.97)",borderTop:"1px solid rgba(255,255,255,.1)",padding:"14px 20px"}}>
          <div style={{maxWidth:1120,margin:"auto"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}><div style={{minWidth:160,flex:"1 1 220px"}}><strong style={{fontSize:14,display:"block",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{activeTitle}</strong><div style={{fontSize:11,opacity:.5,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{activeArtist}</div></div><button onClick={()=>setShuffle(!shuffle)} aria-label="Shuffle" style={{background:"none",border:0,color:shuffle?"#fff":"#657080"}}><Shuffle size={17}/></button><button onClick={previous} aria-label="Previous" style={{background:"none",border:0,color:"#fff"}}><SkipBack size={19}/></button><button onClick={togglePlay} aria-label={playing?"Pause":"Play"} style={{width:44,height:44,borderRadius:50,border:0,background:"#fff",color:"#08101b",display:"grid",placeItems:"center"}}>{playing?<Pause size={19}/>:<Play size={19} fill="currentColor"/>}</button><button onClick={next} aria-label="Next" style={{background:"none",border:0,color:"#fff"}}><SkipForward size={19}/></button><button onClick={()=>setRepeat(!repeat)} aria-label="Repeat" style={{background:"none",border:0,color:repeat?"#fff":"#657080"}}><Repeat size={17}/></button><button onClick={()=>setMuted(!muted)} aria-label="Mute" style={{background:"none",border:0,color:"#fff"}}>{muted?<VolumeX size={18}/>:<Volume2 size={18}/>}</button><input aria-label="Volume" type="range" min="0" max="1" step="0.01" value={muted?0:volume} onChange={e=>{setMuted(false);setVolume(Number(e.target.value))}} style={{width:90}}/></div>
            <div style={{display:"flex",alignItems:"center",gap:9,marginTop:8}}><span style={{fontSize:10,opacity:.5}}>{formatTime(progress)}</span><input aria-label="Seek" type="range" min="0" max={duration||0} step="0.1" value={Math.min(progress,duration||0)} onChange={e=>{const v=Number(e.target.value);setProgress(v);if(mediaRef.current)mediaRef.current.currentTime=v}} style={{flex:1}}/><span style={{fontSize:10,opacity:.5}}>{formatTime(duration)}</span>{mode==="open"&&<a href={`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(track.title)}.ogg`} target="_blank" rel="noreferrer" title="Open source" style={{color:"#fff",opacity:.55}}><ExternalLink size={14}/></a>}{mode==="local"&&localFile?.kind==="video"&&<Maximize2 size={14} style={{opacity:.5}}/>}</div>
          </div>
        </footer>
      </section>
    </div>
  </>;
}
