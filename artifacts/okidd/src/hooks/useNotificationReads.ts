import { useState, useCallback } from "react";

function storageKey(userId: number) {
  return `notif_read_ids_${userId}`;
}

function loadIds(userId: number): Set<number> {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? new Set(JSON.parse(raw) as number[]) : new Set<number>();
  } catch {
    return new Set<number>();
  }
}

function saveIds(userId: number, ids: Set<number>) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify([...ids]));
  } catch {}
}

export function useNotificationReads(userId?: number | null) {
  const [readIds, setReadIds] = useState<Set<number>>(
    () => (userId ? loadIds(userId) : new Set<number>())
  );

  const update = useCallback(
    (fn: (prev: Set<number>) => Set<number>) => {
      if (!userId) return;
      setReadIds(prev => {
        const next = fn(prev);
        saveIds(userId, next);
        return next;
      });
    },
    [userId]
  );

  const markRead = useCallback(
    (id: number) => update(prev => new Set([...prev, id])),
    [update]
  );

  const markAllRead = useCallback(
    (ids: number[]) => update(prev => new Set([...prev, ...ids])),
    [update]
  );

  const isRead = useCallback((id: number) => readIds.has(id), [readIds]);

  const countUnread = useCallback(
    (notifs: { id: number }[]) => notifs.filter(n => !readIds.has(n.id)).length,
    [readIds]
  );

  return { markRead, markAllRead, isRead, countUnread };
}
