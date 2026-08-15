"use client";

import dynamic from "next/dynamic";
import type { MapViewProps } from "./MapView";

/**
 * Client-only entry point for `MapView`.
 *
 * Leaflet reads `window` at module scope, so importing it during the
 * server render crashes the build. Every screen imports the map through
 * here, never from `./MapView` directly.
 *
 * The `loading` state matches the app's standard spinner block so the
 * map area doesn't jump when the chunk lands.
 */
export const MapViewDynamic = dynamic<MapViewProps>(
  () => import("./MapView").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-bg-subtle">
        <div className="w-6 h-6 rounded-full border-2 border-border-default border-t-brand-blue animate-spin" />
      </div>
    ),
  }
);
