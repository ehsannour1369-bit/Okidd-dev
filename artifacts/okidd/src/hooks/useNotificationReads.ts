import { useState, useCallback, useEffect } from "react";

function storageKey(userId: number) {
  return `notif_last_seen_${userId}`;
}

function loadLastSeen(userId: number): Date {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? new Date(parseInt(raw)) : new Date(0);
  } catch {
    return new Date(0);
  }
}

function saveLastSeen(userId: number, date: Date) {
  try {
    localStorage.setItem(storageKey(userId), String(date.getTime()));
  } catch {}
}

export function useNotificationReads(userId?: number) {
  const [lastSeen, setLastSeen] = useState<Date>(() =>
    userId ? loadLastSeen(userId) : new Date(0)
  );

  useEffect(() => {
    if (userId) setLastSeen(loadLastSeen(userId));
  }, [userId]);

  const markAllSeen = useCallback(() => {
    if (!userId) return;
    const now = new Date();
    saveLastSeen(userId, now);
    setLastSeen(now);
  }, [userId]);

  const countUnread = useCallback(
    (notifs: { id: number; createdAt?: string }[]) =>
      notifs.filter(n => n.createdAt && new Date(n.createdAt) > lastSeen).length,
    [lastSeen]
  );

  return { markAllSeen, countUnread, lastSeen };
}
