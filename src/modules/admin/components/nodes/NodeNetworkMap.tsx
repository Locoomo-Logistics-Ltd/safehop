"use client";

import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { env } from "@/core/config/env";
import { MapPinIcon } from "@/components/icons";
import type { AdminNodeStatus, GeoPoint, NodeLifecycleStatus } from "@/core/types";

interface NodeNetworkMapProps {
  nodes: AdminNodeStatus[];
}

const LAGOS_CENTER: GeoPoint = { lat: 6.5244, lng: 3.3792 };

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
 * Network map for "Node Network" — real Google Map (same library as
 * `GoogleMapView`) with markers colored by the Node's lifecycle
 * status. Renders the same graceful no-API-key fallback the User
 * module already uses. Markers only appear once
 * `adminService.getNodeStatuses()` returns real coordinates — there's
 * no fake data plotted here.
 */
export function NodeNetworkMap({ nodes }: NodeNetworkMapProps) {
  if (!env.googleMapsApiKey) {
    return <MapUnavailableFallback />;
  }

  return (
    <div className="relative w-full h-[420px] rounded-[16px] overflow-hidden border border-border-default">
      <APIProvider apiKey={env.googleMapsApiKey}>
        <Map
          mapId={env.googleMapsMapId || undefined}
          defaultCenter={LAGOS_CENTER}
          defaultZoom={11}
          gestureHandling="greedy"
          disableDefaultUI
          zoomControl
          style={{ width: "100%", height: "100%" }}
        >
          {nodes.map((node) => (
            <AdvancedMarker key={node.id} position={node.location} title={node.name}>
              <span
                className="block w-3.5 h-3.5 rounded-full border-2 border-white shadow-md"
                style={{ background: STATUS_COLOR[node.status] }}
              />
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>

      <Legend />
    </div>
  );
}

function Legend() {
  return (
    <div className="absolute bottom-3 left-3 bg-bg-card rounded-[10px] border border-border-default shadow-[var(--shadow-card)] px-3 py-2 flex flex-col gap-1">
      {LEGEND.map((item) => (
        <span key={item.status} className="flex items-center gap-1.5 text-[11px] text-text-secondary">
          <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLOR[item.status] }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function MapUnavailableFallback() {
  return (
    <div className="relative w-full h-[420px] rounded-[16px] bg-bg-subtle border border-border-default flex flex-col items-center justify-center gap-2 text-text-muted">
      <MapPinIcon size={22} />
      <p className="text-[13px] px-6 text-center leading-[1.5]">
        Map unavailable — set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable it.
      </p>
      <Legend />
    </div>
  );
}
