import { useEffect } from "react";
import { useAuthStore } from "../store/auth";
import { api } from "../lib/api";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user?.id) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const BASE = import.meta.env.BASE_URL ?? "/";

    async function register() {
      try {
        const reg = await navigator.serviceWorker.register(`${BASE}sw.js`, { scope: BASE });
        await navigator.serviceWorker.ready;

        let permission = Notification.permission;
        if (permission === "default") {
          permission = await Notification.requestPermission();
        }
        if (permission !== "granted") return;

        const { publicKey } = await api.get<{ publicKey: string }>("/push-config");
        if (!publicKey) return;

        const existingSub = await reg.pushManager.getSubscription();
        if (existingSub) {
          const j = existingSub.toJSON();
          await api.post("/push-subscriptions", {
            userId: user!.id,
            endpoint: j.endpoint,
            p256dh: j.keys?.p256dh,
            auth: j.keys?.auth,
          });
          return;
        }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as ArrayBuffer,
        });

        const json = sub.toJSON();
        await api.post("/push-subscriptions", {
          userId: user!.id,
          endpoint: json.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
        });
      } catch (err) {
        console.warn("[push] registration failed:", err);
      }
    }

    register();
  }, [user?.id]);
}
