import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';

const ToastCtx = createContext(null);

export function ToastProvider({ userId, children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((t) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, ...t }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), t.duration || 5000);
  }, []);

  const dismiss = useCallback((id) => setToasts((prev) => prev.filter((x) => x.id !== id)), []);

  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`toast:${userId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` },
        (p) => {
          const n = p.new;
          if (n.priority === 'silent') return;
          push({
            title: n.title || 'Merveil',
            body: n.body,
            tone: toneFor(n.type),
            action: n.data?.url ? { label: 'Open', href: n.data.url } : null,
          });
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, push]);

  return (
    <ToastCtx.Provider value={{ push, dismiss }}>
      {children}
      <div className="toast-host">
        {toasts.map((t) => (
          <div key={t.id} className={`toast tone-${t.tone || 'default'}`}>
            <div className="toast-body">
              <div className="toast-title">{t.title}</div>
              {t.body && <div className="toast-text">{t.body}</div>}
            </div>
            {t.action && <a className="toast-action" href={t.action.href}>{t.action.label}</a>}
            <button type="button" className="toast-x" onClick={() => dismiss(t.id)}>×</button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

function toneFor(type) {
  if (!type) return 'default';
  if (type.startsWith('build_success')) return 'success';
  if (type.startsWith('build_failed') || type.startsWith('payment_failed')) return 'warn';
  if (type.startsWith('payment') || type.startsWith('plan_renewed')) return 'success';
  if (type.startsWith('call')) return 'info';
  return 'default';
}
