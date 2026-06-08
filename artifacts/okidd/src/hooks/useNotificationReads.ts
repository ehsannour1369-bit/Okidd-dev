import { useState, useCallback } from "react";

type ReadMap = Record<number, string>;

function mapKey(userId: number) { return `notif_read_map_${userId}`; }
function legacyKey(userId: number) { return `notif_read_ids_${userId}`; }

function loadMap(userId: number): ReadMap {
  try {
    const raw = localStorage.getItem(mapKey(userId));
    if (raw) return JSON.parse(raw) as ReadMap;
    const legacy = localStorage.getItem(legacyKey(userId));
    if (legacy) {
      const ids = JSON.parse(legacy) as number[];
      const map: ReadMap = {};
      ids.forEach(id => { map[id] = ""; });
      return map;
    }
    return {};
  } catch { return {}; }
}

function saveMap(userId: number, map: ReadMap) {
  try { localStorage.setItem(mapKey(userId), JSON.stringify(map)); } catch {}
}

export function useNotificationReads(userId?: number | null) {
  const [readMap, setReadMap] = useState<ReadMap>(
    () => (userId ? loadMap(userId) : {})
  );

  const update = useCallback(
    (fn: (prev: ReadMap) => ReadMap) => {
      if (!userId) return;
      setReadMap(prev => {
        const next = fn(prev);
        saveMap(userId, next);
        return next;
      });
    },
    [userId]
  );

  const markRead = useCallback(
    (id: number) => update(prev =>
      id in prev ? prev : { ...prev, [id]: new Date().toISOString() }
    ),
    [update]
  );

  const markAllRead = useCallback(
    (ids: number[]) => update(prev => {
      const now = new Date().toISOString();
      const patch: ReadMap = {};
      ids.forEach(id => { if (!(id in prev)) patch[id] = now; });
      return Object.keys(patch).length ? { ...prev, ...patch } : prev;
    }),
    [update]
  );

  const isRead = useCallback((id: number) => id in readMap, [readMap]);

  const getReadAt = useCallback(
    (id: number): string | undefined => readMap[id] || undefined,
    [readMap]
  );

  const countUnread = useCallback(
    (notifs: { id: number }[]) => notifs.filter(n => !(n.id in readMap)).length,
    [readMap]
  );

  return { markRead, markAllRead, isRead, getReadAt, countUnread };
}
