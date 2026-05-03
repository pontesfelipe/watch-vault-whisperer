// Legacy PWA cleanup shim.
// Older deployed HTML may still load /registerSW.js, so this file must actively
// remove stale service workers/caches instead of being a no-op.
//
// IMPORTANT: when we have to reload after cleanup, do it with a cache-busting
// query parameter so the browser actually re-fetches index.html from origin
// instead of replaying the stale HTML out of its disk cache. Without this,
// users get stuck on whatever index.html they downloaded before the latest
// Lovable deploy and never load the new asset hashes.
(async () => {
  try {
    let cleanedSomething = false;

    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length > 0) {
        cleanedSomething = true;
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
    }

    if ("caches" in window) {
      const names = await caches.keys();
      if (names.length > 0) {
        cleanedSomething = true;
        await Promise.all(names.map((name) => caches.delete(name)));
      }
    }

    if (!cleanedSomething) return;

    const cleanupKey = "sora-vault-legacy-pwa-cleanup-v4";
    if (sessionStorage.getItem(cleanupKey)) return;
    sessionStorage.setItem(cleanupKey, "true");

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("sw-cleanup", Date.now().toString());
    window.location.replace(nextUrl.toString());
  } catch {
    // Never block app startup if cleanup fails.
  }
})();
