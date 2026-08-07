import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";



const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Headers required for a PWA service worker to be installable
  // async headers() {
  //   return [
  //     {
  //       source: "/sw.js",
  //       headers: [
  //         { key: "Content-Type", value: "application/javascript; charset=utf-8" },
  //         { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
  //         { key: "Service-Worker-Allowed", value: "/" },
  //       ],
  //     },
  //     {
  //       source: "/manifest.webmanifest",
  //       headers: [{ key: "Content-Type", value: "application/manifest+json" }],
  //     },
  //   ];
  // },
  reactStrictMode: true,

  /**
   * Local-dev-only same-origin proxy for the API. Session cookies are
   * `SameSite=Strict` (docs/API.md) — a real browser never attaches
   * them to a cross-site request, so calling the deployed API directly
   * from http://localhost:3000 (a different registrable domain) makes
   * login silently succeed while every subsequent authenticated call
   * 401s, since the cookie never gets sent back. Proxying server-side
   * here makes the browser see same-origin requests instead, so the
   * cookie round-trips normally. A no-op outside development —
   * production points NEXT_PUBLIC_API_BASE_URL directly at the real
   * (same-site) API and never hits this rewrite.
   */
  async rewrites() {
    if (process.env.NODE_ENV === "production") return [];
    const upstream = process.env.DEV_API_PROXY_TARGET ?? "https://locoomo-api.up.railway.app";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${upstream}/api/v1/:path*`,
      },
    ];
  },
};

export default withSerwist(nextConfig);
