import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { validateEnv } from "./lib/env";
import "./i18n/config";
import App from "./App.tsx";
import "./styles/theme.css";
import "./index.css";

const APP_BUILD_MARKER = "sora-vault-2026-05-03-publish-unstick";

declare global {
  interface Window {
    __SORA_VAULT_BUILD_MARKER__?: string;
  }
}

window.__SORA_VAULT_BUILD_MARKER__ = APP_BUILD_MARKER;
console.info(`[Sora Vault] build marker: ${APP_BUILD_MARKER}`);

validateEnv();

// Stale-build detector. After load, fetch the deployed index.html (cache-busted)
// and pull out the module entry script src. If it differs from the entry the
// browser actually loaded, the user is running a stale SPA — do a cache-busting
// reload so they pick up the new asset hashes. This is the failsafe for the
// "Lovable committed an update but the app didn't change" symptom: it handles
// the case where the browser still has a stale index.html in its HTTP cache
// even after caches/SW have been cleared.
const STALE_BUILD_QS = "stale-build";
const STALE_BUILD_SESSION_KEY = "sora-vault-stale-build-reload-v1";

const checkForStaleBuild = () => {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (params.has(STALE_BUILD_QS) || params.has("sw-cleanup")) return;
  if (sessionStorage.getItem(STALE_BUILD_SESSION_KEY)) return;

  const probe = async () => {
    try {
      const url = new URL(window.location.origin);
      url.searchParams.set("__build_probe", Date.now().toString());
      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) return;
      const html = await res.text();

      const moduleEntryRegex = /<script[^>]*type=["']module["'][^>]*src=["']([^"']+)["']/i;
      const deployedMatch = html.match(moduleEntryRegex);
      if (!deployedMatch) return;
      const deployedEntry = deployedMatch[1];

      const runningEntry = Array.from(
        document.querySelectorAll<HTMLScriptElement>('script[type="module"][src]'),
      )
        .map((s) => new URL(s.src, window.location.origin).pathname)
        .find((p) => p.includes("main") || p.includes("index"));

      if (!runningEntry) return;
      const deployedPath = new URL(deployedEntry, window.location.origin).pathname;
      if (deployedPath === runningEntry) return;

      console.warn(
        `[Sora Vault] stale build detected. running=${runningEntry} deployed=${deployedPath} — reloading.`,
      );
      sessionStorage.setItem(STALE_BUILD_SESSION_KEY, "true");
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set(STALE_BUILD_QS, Date.now().toString());
      window.location.replace(nextUrl.toString());
    } catch {
      // Network failures shouldn't break app startup.
    }
  };
  window.setTimeout(() => {
    probe().catch(() => undefined);
  }, 1500);
};

checkForStaleBuild();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
