"use client";

import { useMemo } from "react";
import { MapViewDynamic } from "@/components/maps/MapViewDynamic";
import { MapUnavailable } from "@/components/maps/MapUnavailable";
import type { MapMarker } from "@/components/maps/MapView";
import { env } from "@/core/config/env";
import type { AdminNodeStatus, GeoPoint, NodeLifecycleStatus } from "@/core/types";

interface NodeNetworkMapProps {
  nodes: AdminNodeStatus[];
}

const LAGOS_CENTER: GeoPoint = { lat: 6.5244, lng: 3.3792 };

/** Resolved hex, not Tailwind classes — Leaflet renders markers outside React. */
const STATUS_COLOR: Record<NodeLifecycleStatus, string> = {
  active: "#16A34A",
  pending: "#D97706",
  inactive: "#6B7A99",
  suspended: "#DC2626",
};

const LEGEND: Array<{ status: NodeLifecycleStatus; label: string }> = [
  { status: "active", label: "Active" },
  { status: "pending", label: "Pending approval" },
  { status: "inactive", label: "Inactive" },
  { status: "suspended", label: "Suspended" },
];

/**
 * Network map for "Node Network" — markers coloured by each Node's
 * lifecycle status. Markers only appear once
 * `adminService.getNodeStatuses()` returns real coordinates; there's no
 * fake data plotted here.
 *
 * Uses the shared `MapView` (Leaflet + Geoapify) as of 2026-08-15,
 * previously Google Maps.
 */
export function NodeNetworkMap({ nodes }: NodeNetworkMapProps) {
  const markers = useMemo<MapMarker[]>(
    () =>
      nodes.map((node) => ({
        id: node.id,
        position: node.location,
        title: node.name,
        color: STATUS_COLOR[node.status],
        subtitle: LEGEND.find((entry) => entry.status === node.status)?.label ?? node.status,
      })),
    [nodes]
  );

  if (!env.geoapifyApiKey) {
    return (
      <div className="w-full h-[420px]">
        <MapUnavailable className="w-full h-full rounded-[16px] border border-dashed border-border-strong bg-bg-subtle flex flex-col items-center justify-center px-6 text-center gap-2" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-[420px] rounded-[16px] overflow-hidden border border-border-default">
      <MapViewDynamic markers={markers} center={LAGOS_CENTER} zoom={11} />
      <Legend />
    </div>
  );
}

function Legend() {
  return (
    <div className="absolute bottom-3 left-3 z-[500] bg-bg-card/95 backdrop-blur-sm rounded-[10px] border border-border-default px-3 py-2.5 shadow-[var(--shadow-raised)]">
      <div className="flex flex-col gap-1.5">
        {LEGEND.map((entry) => (
          <div key={entry.status} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: STATUS_COLOR[entry.status] }}
            />
            <span className="text-[11px] text-text-secondary whitespace-nowrap">
              {entry.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
