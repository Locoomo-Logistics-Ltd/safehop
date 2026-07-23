"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker on mount. Mounted once in the root
 * layout (see app/layout.tsx). Silently no-ops in unsupported browsers
 * or during local dev over plain HTTP.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.warn("[Locoomo] Service worker registration failed:", error);
      });
    });
  }, []);

  return null;
}
