// Service worker: بيستقبل الإشعارات حتى لو الموقع مقفول
// payload: { title, body, url?, tag?, actions?: [{ action, title, url }], badgeCount? }
// على iOS: مفيش أزرار ولا badge صغير ولا هزّة — الضغط على الإشعار نفسه بيفتح url، والرقم الأحمر على الأيقونة شغال.
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : { title: "مسار مادا", body: "" };
  const actions = (data.actions || []).slice(0, 2);
  const badge =
    typeof data.badgeCount === "number" && "setAppBadge" in navigator
      ? data.badgeCount > 0
        ? navigator.setAppBadge(data.badgeCount)
        : navigator.clearAppBadge()
      : Promise.resolve();
  event.waitUntil(
    Promise.all([
      badge.catch(() => {}),
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-96.png", // شريط الحالة في Android: أبيض على شفاف
        dir: "rtl",
        lang: "ar",
        tag: data.tag || "mada-reminder",
        renotify: true,
        requireInteraction: true,
        vibrate: [120, 60, 120],
        actions: actions.map((a) => ({ action: a.action, title: a.title })),
        data: { url: data.url || "/", actions },
      }),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const { url: fallback, actions = [] } = event.notification.data || {};
  const url = actions.find((a) => a.action === event.action)?.url || fallback || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => "focus" in c);
      if (!open) return self.clients.openWindow(url);
      // navigate ممكن يفشل (iOS أو تاب مش متحكم فيه) — ساعتها افتح شباك جديد
      return open
        .navigate(url)
        .then((w) => (w || open).focus())
        .catch(() => self.clients.openWindow(url));
    }),
  );
});
