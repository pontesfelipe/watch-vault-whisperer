// Legacy PWA cleanup shim.
// Older deployed HTML may still load /registerSW.js, so this file must actively
// remove stale service workers/caches instead of being a no-op.
(async () => {
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    }

    const cleanupKey = "sora-vault-legacy-pwa-cleanup-v3";
    if (!sessionStorage.getItem(cleanupKey)) {
      sessionStorage.setItem(cleanupKey, "true");
      window.location.reload();
    }
  } catch {
    // Never block app startup if cleanup fails.
  }
})();
