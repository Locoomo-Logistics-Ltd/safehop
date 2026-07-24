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
};

export default withSerwist(nextConfig);
