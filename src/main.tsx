import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { validateEnv } from "./lib/env";
import "./i18n/config";
import App from "./App.tsx";
import "./styles/theme.css";
import "./index.css";

const APP_BUILD_MARKER = "sora-vault-auth-role-gate-2026-05-03-0026";

declare global {
  interface Window {
    __SORA_VAULT_BUILD_MARKER__?: string;
  }
}

window.__SORA_VAULT_BUILD_MARKER__ = APP_BUILD_MARKER;
console.info(`[Sora Vault] build marker: ${APP_BUILD_MARKER}`);

validateEnv();

const cleanupLegacyServiceWorkers = () => {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch(() => undefined);

    if ("caches" in window) {
      caches
        .keys()
        .then((names) => Promise.all(names.map((name) => caches.delete(name))))
        .catch(() => undefined);
    }
  });
};

cleanupLegacyServiceWorkers();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
