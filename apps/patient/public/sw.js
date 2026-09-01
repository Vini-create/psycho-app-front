self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  // O worker existe para tornar o app instalável. Dados clínicos e sessões
  // continuam sempre network-first e nunca são persistidos em cache aqui.
  event.respondWith(fetch(event.request));
});
