// EXTRACTED from App.jsx — production still mounts from App until import pass.
// Dependencies: rankWorldReels, merveilFetch, World card helpers in App.jsx / lib/merveilRanking.js

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
    if (!post?.id) {
      try {
        window.dispatchEvent(new CustomEvent("merveil:toast", {
          detail: { type: "error", message: "No media to save to gallery." },
        }));
      } catch {}
      return;
    }
    // Step 1: same-origin API proxy (avoids storage CORS)
    try {
      const res = await merveilFetch(`/api/world?action=download&postId=${encodeURIComponent(post.id)}`, {
        credentials: "include",
      });
      if (res.ok) {
        const blob = await res.blob();
        const ctype = res.headers.get("content-type") || "";
        const ext = ctype.includes("video") ? "mp4" : ctype.includes("png") ? "png" : "jpg";
        const name = `merveil-${String(post.id).slice(0, 12)}.${ext}`;
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = name;
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
        try {
          window.dispatchEvent(new CustomEvent("merveil:toast", {
            detail: { type: "success", message: "Step complete — file in Downloads / Gallery." },
          }));
        } catch {}
        return;
      }
    } catch { /* fall through */ }
    // Step 2: direct media URL
    const mediaUrl = post?.video_url || post?.photo_url || (post?.photo_urls && post.photo_urls[0]);
    if (!mediaUrl) return;
    try {
      const res = await fetch(mediaUrl, { mode: "cors" });
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `merveil-${String(post.id).slice(0, 12)}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
    } catch {
      // Step 3: open for long-press save
      try {
        window.open(mediaUrl, "_blank", "noopener,noreferrer");
        window.dispatchEvent(new CustomEvent("merveil:toast", {
          detail: { type: "info", message: "Long-press the video → Save to gallery." },
        }));
      } catch {}
    }
  };

  const toggleSave = async (post) => {
    if (!currentUser) { onSignIn?.(); return; }
    const wasSaved = savedIds.includes(post.id);
    setSavedIds((prev) => (wasSaved ? prev.filter((id) => id !== post.id) : [...prev, post.id]));
    if (!wasSaved) {
      bumpWorldAffinity({ topic: post.topic, creatorId: post.owner_id, weight: 2 });
      setAffinityTick((t) => t + 1);
      // Always offer a real device download (phone gallery / Downloads)
      downloadWorldToDevice(post);
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
          <button type="button" onClick={openSavedGallery}
            className="pointer-events-auto flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-full shadow-lg min-h-[40px]"
            style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff" }}
            aria-label="Saved gallery">
            <Bookmark size={14} color="#FBBF24" /> Saved
          </button>
          <div className="pointer-events-auto px-2.5 py-1 rounded-full text-left"
            style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <div className="text-[10px] font-bold" style={{ color: "#fff" }}>WORLD REELS</div>
            <div className="text-[8px] leading-tight" style={{ color: "rgba(255,255,255,0.65)" }}>What should I discover next?</div>
          </div>
          <div className="flex-1" />
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
