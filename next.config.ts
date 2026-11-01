import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";



const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
});

/**
 * Security headers for every route.
 *
 * Enforced: clickjacking (`frame-ancestors`), base-tag and plugin
 * injection, form hijacking, MIME sniffing, referrer leakage (the public
 * tracking URL carries a secret token), powerful browser features, HSTS.
 *
 * The script/connect allow-list is **Report-Only** for now: Next injects
 * inline bootstrap scripts, Google Identity Services, Geoapify tiles and
 * Cloudinary uploads all need listing, and enforcing it blind could break
 * sign-in or maps on launch day. Watch the browser console for violations
 * on staging, then promote it to `Content-Security-Policy`.
 */
const isDev = process.env.NODE_ENV === "development";

const ENFORCED_CSP = [
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
].join("; ");

const REPORT_ONLY_CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://accounts.google.com`,
  "style-src 'self' 'unsafe-inline' https://accounts.google.com",
  "img-src 'self' data: blob: https://maps.geoapify.com https://res.cloudinary.com https://*.googleusercontent.com",
  "font-src 'self' data:",
  "connect-src 'self' https://api.geoapify.com https://api.cloudinary.com https://accounts.google.com",
  "frame-src https://accounts.google.com",
  "worker-src 'self'",
  "manifest-src 'self'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: ENFORCED_CSP },
  { key: "Content-Security-Policy-Report-Only", value: REPORT_ONLY_CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), geolocation=(self), microphone=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {

  reactStrictMode: true,

  // No `<Image>` is used, and the optimizer endpoint has had critical
  // advisories — switch it off rather than leave it exposed.
  images: { unoptimized: true },

  poweredByHeader: false,

  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      // Live, per-user data: never cacheable by browsers or intermediaries.
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },

  
 async rewrites() {
  const upstream = process.env.API_PROXY_TARGET ?? "https://api.locoomo.com";

  if (!upstream) {
    return [];
  }

  return [
    {
      source: "/api/v1/:path*",
      destination: `${upstream}/api/v1/:path*`,
    },
  ];
},
};

export default withSerwist(nextConfig);


