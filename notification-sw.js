const APP_URL = "https://9workscrm.cloud/";

self.addEventListener("notificationclick", (event) => {
  const eventId = event.notification?.data?.eventId || "";
  event.notification?.close();

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find((client) => client.url.startsWith(APP_URL));

    if (existing) {
      await existing.focus();
      existing.postMessage({ type: "OPEN_NINEWORKS_EVENT", eventId });
      return;
    }

    const target = eventId ? `${APP_URL}?event=${encodeURIComponent(eventId)}` : APP_URL;
    await self.clients.openWindow(target);
  })());
});
