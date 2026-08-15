"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { env } from "@/core/config/env";
import type { GeoPoint } from "@/core/types";

/**
 * The one place map rendering happens.
 *
 * Leaflet + Geoapify raster tiles. Geoapify publishes tiles and
 * geocoding but no map SDK of its own, so a renderer is required either
 * way; Leaflet is ~40KB gzipped against MapLibre's ~200KB, which is the
 * right trade for a mobile PWA, and its `divIcon` lets markers stay
 * plain HTML styled with the app's own Tailwind tokens rather than
 * provider-specific pin objects.
 *
 * Leaflet is imperative and touches `window` at module scope, so this
 * component owns a ref-held map instance and must only ever render on
 * the client — every consumer loads it through `next/dynamic` with
 * `ssr: false` (see `MapViewDynamic.tsx`).
 *
 * Swapping to Google later means rewriting this file's body and
 * `geocoding.service.ts`; the `MapMarker[]` contract below is
 * deliberately provider-neutral so no screen has to change.
 */

export interface MapMarker {
  id: string;
  position: GeoPoint;
  title: string;
  /** Marker fill. Callers pass a resolved hex — Leaflet renders outside React, so Tailwind classes on these wouldn't be seen by the JIT compiler. */
  color: string;
  isSelected?: boolean;
  /** Rendered in a popup on click. Plain text, escaped before insertion. */
  subtitle?: string;
}

export interface MapViewProps {
  markers: MapMarker[];
  center: GeoPoint;
  zoom?: number;
  /** Drawn as a distinct pulsing dot rather than a pin — it isn't a place, it's the viewer. */
  userPosition?: GeoPoint | null;
  onMarkerClick?: (id: string) => void;
  className?: string;
}

const MARKER_SIZE = 26;
const SELECTED_MARKER_SIZE = 34;

/** Leaflet injects this as HTML, and marker text is server data — escape it. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildMarkerIcon(marker: MapMarker): L.DivIcon {
  const size = marker.isSelected ? SELECTED_MARKER_SIZE : MARKER_SIZE;
  return L.divIcon({
    className: "locoomo-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<span style="
      display:block;width:${size}px;height:${size}px;border-radius:9999px;
      background:${marker.color};border:3px solid #fff;
      box-shadow:0 2px 6px rgba(11,21,48,.35);
    "></span>`,
  });
}

function buildUserIcon(): L.DivIcon {
  return L.divIcon({
    className: "locoomo-user-marker",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: `<span style="
      display:block;width:14px;height:14px;border-radius:9999px;
      background:#006CDF;border:2px solid #fff;
      box-shadow:0 0 0 6px rgba(0,108,223,.22);
    "></span>`,
  });
}

export function MapView({
  markers,
  center,
  zoom = 13,
  userPosition,
  onMarkerClick,
  className,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Kept in a ref so marker click handlers always call the latest
  // callback without having to tear down and rebuild every marker each
  // time the parent re-renders with a new closure.
  const onMarkerClickRef = useRef(onMarkerClick);
  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  // Create once. `center`/`zoom` are intentionally absent from the deps:
  // they seed the initial view, and re-centering on every prop change
  // would yank the map back mid-pan while the user is looking around.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer(
      `https://maps.geoapify.com/v1/tile/${env.geoapifyMapStyle}/{z}/{x}/{y}.png?apiKey=${env.geoapifyApiKey}`,
      {
        maxZoom: 20,
        // Both attributions are required by Geoapify's terms and ODbL —
        // don't strip them to tidy the corner.
        attribution:
          '© <a href="https://www.geoapify.com/">Geoapify</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ).addTo(map);

    markerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
      userMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Markers are cleared and rebuilt wholesale. The lists here are Nodes
  // at a city scale — tens, not thousands — so diffing would cost more
  // in complexity than it saves in work.
  useEffect(() => {
    const layer = markerLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    markers.forEach((marker) => {
      const leafletMarker = L.marker([marker.position.lat, marker.position.lng], {
        icon: buildMarkerIcon(marker),
        title: marker.title,
        zIndexOffset: marker.isSelected ? 1000 : 0,
      });

      if (marker.subtitle) {
        leafletMarker.bindPopup(
          `<p style="margin:0;font-size:13px;font-weight:600;color:#0B1530">${escapeHtml(marker.title)}</p>
           <p style="margin:2px 0 0;font-size:11px;color:#4A5C7D">${escapeHtml(marker.subtitle)}</p>`
        );
      }

      leafletMarker.on("click", () => onMarkerClickRef.current?.(marker.id));
      leafletMarker.addTo(layer);
    });
  }, [markers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!userPosition) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      return;
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userPosition.lat, userPosition.lng]);
    } else {
      userMarkerRef.current = L.marker([userPosition.lat, userPosition.lng], {
        icon: buildUserIcon(),
        title: "Your location",
        zIndexOffset: 500,
      }).addTo(map);
    }
  }, [userPosition]);

  // Leaflet measures its container on creation. Inside a tab, accordion
  // or freshly-mounted card the container is often 0px at that moment,
  // leaving grey tiles until something forces a resize — this observer
  // is what stops that.
  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => mapRef.current?.invalidateSize());
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return <div ref={containerRef} className={className} style={{ width: "100%", height: "100%" }} />;
}

export default MapView;
