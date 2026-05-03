type CacheResetOptions = {
  targetPath?: string;
  queryKey?: string;
};

export async function purgeBrowserCachesAndReload(options: CacheResetOptions = {}) {
  const { targetPath, queryKey = "cache-reset" } = options;

  if ("serviceWorker" in navigator) {
    const existingRegistrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(existingRegistrations.map((registration) => registration.unregister()));

    await Promise.all(
      ["/sw.js", "/service-worker.js"].map(async (workerPath) => {
        try {
          const registration = await navigator.serviceWorker.register(workerPath, { updateViaCache: "none" });
          await registration.update();
          await registration.unregister();
        } catch {
          // A missing or blocked worker should not prevent the local cache reset.
        }
      }),
    );
  }

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }

  try {
    sessionStorage.removeItem("sora-vault-sw-cleanup-v3");
    sessionStorage.removeItem("sora-vault-legacy-pwa-cleanup-v3");
    sessionStorage.removeItem("sora-vault-legacy-pwa-cleanup-v4");
    sessionStorage.removeItem("sora-vault-stale-build-reload-v1");
    localStorage.removeItem("sora-vault-legacy-pwa-cleanup-v3");
  } catch {
    // Storage may be unavailable in private browsing or restricted contexts.
  }

  const nextUrl = new URL(targetPath || window.location.href, window.location.origin);
  nextUrl.searchParams.set(queryKey, Date.now().toString());
  window.location.replace(nextUrl.toString());
}