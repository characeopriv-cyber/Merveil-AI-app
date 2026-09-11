import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useNotifications(userId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(80);
    setItems(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`notif:${userId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` },
        (p) => setItems((prev) => [p.new, ...prev].slice(0, 200)))
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` },
        (p) => setItems((prev) => prev.map((n) => (n.id === p.new.id ? p.new : n))))
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` },
        (p) => setItems((prev) => prev.filter((n) => n.id !== p.old.id)))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId]);

  const unread = useMemo(() => items.filter((n) => !n.is_read).length, [items]);

  const markRead = useCallback(async (id) => {
    await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', id);
  }, []);

  const markAllRead = useCallback(async () => {
    await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() })
      .eq('recipient_id', userId).eq('is_read', false);
  }, [userId]);

  const remove = useCallback(async (id) => {
    await supabase.from('notifications').delete().eq('id', id);
  }, []);

  const clearAll = useCallback(async () => {
    await supabase.from('notifications').delete().eq('recipient_id', userId);
  }, [userId]);

  return { items, unread, loading, refresh, markRead, markAllRead, remove, clearAll };
}
