// EXTRACTED from App.jsx — production still mounts from App until import pass.
// Dependencies: React hooks, merveilFetch, T, t, stableMergeById, ensureRealtimeAuth, etc. live in App.jsx.
// Next: import shared from ./merveilShared.js and switch App to: export { MessagesView } from "./merveil/MessagesView.jsx"

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
      setThreads((p) => {
        if (p.some((t) => t.id === conversationId)) return p;
        return [{
          id: conversationId,
          participant_ids: d.participantIds || (d.otherUserId ? [d.otherUserId] : []),
          other_user_id: d.otherUserId || null,
          context_label: null,
          last_body: "",
          last_message_at: new Date().toISOString(),
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
    return () => window.removeEventListener("merveil:open-conversation", onOpen);
  }, []);

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
          setThreads((prev) => {
            const merged = stableMergeById(prev, data.conversations);
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
            ? { ...t, last_body: payload.is_e2ee ? "🔒 Secure message" : preview, last_message_at: nowIso, updated_at: nowIso }
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
    try {
      const createdRes = await fetch("/api/conversations", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantIds: [currentUser.id, otherUser.id] }),
      });
      const created = await createdRes.json().catch(() => null);
      const conversationId = created?.conversation?.id;
      if (!conversationId) throw new Error(created?.error || "No conversation returned");
      // Only send the greeting on a brand-new thread — never on reused ones
      if (!created.reused) {
        const greetName = (otherUser.name || otherUser.full_name || "").trim() || "there";
        await fetch(`/api/conversations/${conversationId}/messages`, {
          method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: `Hi ${greetName}! 👋` }),
        });
      }
      // Always reload messages for this thread so history appears immediately
      const msgsRes = await fetch(`/api/conversations/${conversationId}/messages`, { credentials: "include" });
      const msgsData = await msgsRes.json().catch(() => null);
      setThreadMessages(msgsData?.messages || []);
      setThreads((p) => {
        const existing = p.find((t) => t.id === conversationId);
        if (existing) {
          return [existing, ...p.filter((t) => t.id !== conversationId)];
        }
        return [{
          id: conversationId,
          participant_ids: [currentUser.id, otherUser.id],
          context_label: null,
          last_body: created.reused ? (msgsData?.messages?.slice(-1)?.[0]?.body || "") : `Hi ${(otherUser.name || otherUser.full_name || "").trim() || "there"}! 👋`,
          last_message_at: new Date().toISOString(),
        }, ...p];
      });
      setProfiles((prev) => ({ ...prev, [otherUser.id]: { name: otherUser.name, avatar_url: otherUser.avatar_url || otherUser.avatarUrl } }));
      setActiveId(conversationId);
      setShowNewChat(false);
      setDirectoryQuery("");
      setMobileView("chat");
    } catch (e) {
      setNewChatError(`Couldn't start the conversation — ${e.message}`);
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
          {[
            { id: "citizens", label: t("connect.citizens"), activeBg: "#1D6FBF", activeFg: "#FFFFFF", idle: "#7EB6E8" },
            { id: "circle", label: t("connect.circle"), activeBg: "#1FA64A", activeFg: "#FFFFFF", idle: "#7DDB9A" },
            { id: "messages", label: t("connect.messages"), activeBg: "#F5EDE3", activeFg: "#1E1814", idle: "#B8A99A", border: true },
            { id: "ai-call", label: "AI Call", isNew: true, activeBg: "#5C534A", activeFg: "#F5EDE3", idle: "#8A7B6C" },
          ].map((tabItem) => {
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
              const rawPreview = (r.thread.last_body || r.thread.context_label || "").trim();
              const isCallLine = /missed|video call|voice call|call ended|📞|📹/i.test(rawPreview);
              const subtitle = rawPreview || "Message";
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
                            <span className="text-[13px] font-medium" style={{ color: CT.sub }}>Message</span>
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

