import React, { useEffect, useRef } from "react";

const HEALTH_URL = "/api/auth-session";
const HEARTBEAT_MS = 10 * 60 * 1000;

async function syncSession(reason) {
  try {
    const response = await fetch(`${HEALTH_URL}?reason=${encodeURIComponent(reason || "heartbeat")}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    const payload = await response.json().catch(() => ({ authenticated: false, user: null }));
    window.dispatchEvent(new CustomEvent("merveil:auth", { detail: payload }));
    return payload;
  } catch {
    // Network interruptions should not log a citizen out. The server-side
    // session remains the source of truth and will be checked on the next
    // heartbeat / authenticated request.
    return null;
  }
}

export default function MerveilAuthSession({ children }) {
  const timer = useRef(null);

  useEffect(() => {
    let active = true;

    const run = async (reason) => {
      if (!active) return;
      await syncSession(reason);
    };

    run("startup");
    timer.current = window.setInterval(() => run("heartbeat"), HEARTBEAT_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") run("resume");
    };
    const onOnline = () => run("network-online");

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);

    return () => {
      active = false;
      if (timer.current) window.clearInterval(timer.current);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return children;
}
