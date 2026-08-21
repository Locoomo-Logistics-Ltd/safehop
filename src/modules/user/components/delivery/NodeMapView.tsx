"use client";

import { useMemo } from "react";
import { MapViewDynamic } from "@/components/maps/MapViewDynamic";
import { MapUnavailable } from "@/components/maps/MapUnavailable";
import type { MapMarker } from "@/components/maps/MapView";
import { env } from "@/core/config/env";
import type { GeoPoint, PickupNode } from "@/core/types";

interface NodeMapViewProps {
  nodes: PickupNode[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  /** User's live position — centers the map and shows a "you are here" dot. */
  userPosition: GeoPoint | null;
}

const LAGOS_CENTER: GeoPoint = { lat: 6.5244, lng: 3.3792 };

/** Resolved hex rather than Tailwind classes — Leaflet renders these outside React, where the JIT compiler never sees them. */
const NODE_COLOR = "#3D93E0";
const SELECTED_NODE_COLOR = "#006CDF";

/**
 * The pickup-station map on "Select Nodes".
 *
 * Was `GoogleMapView` until 2026-08-15; renamed because it no longer
 * has anything to do with Google. Same props, so `SelectNodesScreen`
 * only changed its import.
 */
export function NodeMapView({
  nodes,
  selectedNodeId,
  onSelectNode,
  userPosition,
}: NodeMapViewProps) {
  const markers = useMemo<MapMarker[]>(
    () =>
      nodes.map((node) => ({
        id: node.id,
        position: node.location,
        title: node.name,
        color: selectedNodeId === node.id ? SELECTED_NODE_COLOR : NODE_COLOR,
        isSelected: selectedNodeId === node.id,
        subtitle: [
          node.distanceKm !== undefined ? `${node.distanceKm.toFixed(1)}km away` : null,
          `${node.city}, ${node.state}`,
        ]
          .filter(Boolean)
          .join(" · "),
      })),
    [nodes, selectedNodeId]
  );

  if (!env.geoapifyApiKey) {
    return (
      <div className="w-full h-[280px]">
        <MapUnavailable>
          {/* Keeps selection reachable by keyboard and screen reader with no visual map. */}
          <div className="sr-only">
            {nodes.map((node) => (
              <button
                key={node.id}
                onClick={() => onSelectNode(node.id)}
                aria-pressed={selectedNodeId === node.id}
              >
                {node.name}
              </button>
            ))}
          </div>
        </MapUnavailable>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[280px] rounded-[18px] overflow-hidden border border-border-default">
      <MapViewDynamic
        markers={markers}
        center={userPosition ?? LAGOS_CENTER}
        zoom={13}
        userPosition={userPosition}
        onMarkerClick={onSelectNode}
      />
    </div>
  );
}
