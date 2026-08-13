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
   * Same-origin proxy for the API. Session cookies are `SameSite=Strict`
   * (docs/API.md) — a real browser never attaches them to a cross-site
   * request, so calling the deployed API directly from a frontend on a
   * *different registrable domain* (localhost, or a staging frontend on
   * a different domain than its backend) makes login silently succeed
   * while every subsequent authenticated call 401s, since the cookie
   * never gets sent back. Proxying server-side here makes the browser
   * see same-origin requests instead, so the cookie round-trips
   * normally.
   *
   * Opt-in per environment, not tied to NODE_ENV — 2026-08-13: this
   * used to hard-disable in production, which silently broke any
   * staging deploy whose frontend and backend live on different
   * domains (the same cross-site cookie problem this proxy exists to
   * solve, just not in local dev). Local dev still gets a working
   * default with zero config; any other environment (staging included)
   * opts in by setting `API_PROXY_TARGET` to the real backend's origin
   * — and must also set `NEXT_PUBLIC_API_BASE_URL=/api/v1` (relative)
   * for that same environment, same as `.env.local` already does for
   * dev, so requests actually go through this rewrite instead of
   * straight to the backend. Once frontend and backend share a
   * registrable domain (the correct long-term fix — see docs/API.md's
   * "CORS and cookies" section), leave `API_PROXY_TARGET` unset and
   * this becomes a no-op. Requires a Node.js server at runtime
   * (rewrites don't apply to a static export) — confirm your staging
   * host actually runs `next start` (or equivalent) rather than
   * serving a static build.
   */
  async rewrites() {
    const isDev = process.env.NODE_ENV === "development";
    const upstream = process.env.API_PROXY_TARGET ?? (isDev ? "https://locoomo-api.up.railway.app" : undefined);
    if (!upstream) return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: `${upstream}/api/v1/:path*`,
      },
    ];
  },
};

export default withSerwist(nextConfig);
