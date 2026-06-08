self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("push", function (event) {
  let data = { title: "اعلان جدید", body: "" };
  try { data = event.data ? event.data.json() : data; } catch {}
  const options = {
    body: data.body || "",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    dir: "rtl",
    lang: "fa",
    data: { url: data.url || "/" },
    vibrate: [200, 100, 200],
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (cs) {
      const match = cs.find(c => c.url.includes(url) && "focus" in c);
      if (match) return match.focus();
      return self.clients.openWindow(url);
    })
  );
});
