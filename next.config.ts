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

  reactStrictMode: true,

  
 async rewrites() {
  const upstream = process.env.API_PROXY_TARGET;

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


