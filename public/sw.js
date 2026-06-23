// SOBAYA — Service Worker PWA
// Sprint Phase 10 — Application mobile

const CACHE_NAME = "sobaya-v1";

// Ressources à mettre en cache immédiatement à l'installation
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/branding/favicon.ico",
  "/branding/logo-sobaya.png",
  "/branding/icon-sobaya.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png"
];

// Installation — mise en cache des ressources statiques
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activation — nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch — stratégie Network First avec fallback cache
// Pour les pages Next.js : on essaie le réseau, on sert le cache si offline
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // On ignore les requêtes non HTTP/HTTPS (extensions, etc.)
  if (!url.protocol.startsWith("http")) return;

  // On ignore Firebase (Auth, Firestore) — toujours en direct
  if (url.hostname.includes("firebase") || url.hostname.includes("google")) return;

  // Pour les assets statiques (images, fonts, chunks JS) : Cache First
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/branding/") ||
    url.pathname.startsWith("/ads/")
  ) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ?? fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
      )
    );
    return;
  }

  // Pour les pages : Network First avec fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && request.method === "GET") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Notifications push (préparation Phase 10 complète)
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  self.registration.showNotification(data.title ?? "SOBAYA", {
    body: data.body ?? "",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-96x96.png",
    data: { url: data.url ?? "/" }
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(clients.openWindow(url));
});
