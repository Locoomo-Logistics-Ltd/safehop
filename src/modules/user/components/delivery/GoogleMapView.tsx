"use client";

import { useState } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import { env } from "@/core/config/env";
import type { GeoPoint, PickupNode } from "@/core/types";

interface GoogleMapViewProps {
  nodes: PickupNode[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  /** User's live position — centers the map and shows a "you are here" marker. */
  userPosition: GeoPoint | null;
}

const LAGOS_CENTER: GeoPoint = { lat: 6.5244, lng: 3.3792 };

/**
 * Live, interactive Google Map for the "Select Nodes" screen.
 *
 * Drop-in replacement for MockMapView — same `nodes` / `selectedNodeId`
 * / `onSelectNode` contract, plus `userPosition` for centering and a
 * live "you are here" marker. Renders a graceful fallback card if no
 * API key is configured yet, so the app runs fine before you add one.
 */
export function GoogleMapView({
  nodes,
  selectedNodeId,
  onSelectNode,
  userPosition,
}: GoogleMapViewProps) {
  if (!env.googleMapsApiKey) {
    return <MapUnavailableFallback nodes={nodes} selectedNodeId={selectedNodeId} onSelectNode={onSelectNode} />;
  }

  const center = userPosition ?? LAGOS_CENTER;

  return (
    <div className="relative w-full h-[280px] rounded-[18px] overflow-hidden border border-border-default">
      <APIProvider apiKey={env.googleMapsApiKey}>
        <Map
          mapId={env.googleMapsMapId || undefined}
          defaultCenter={center}
          defaultZoom={13}
          gestureHandling="greedy"
          disableDefaultUI
          zoomControl
          style={{ width: "100%", height: "100%" }}
        >
          {userPosition && <UserLocationMarker position={userPosition} />}

          {nodes.map((node) => (
            <NodeMarker
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              onSelect={onSelectNode}
            />
          ))}
        </Map>
      </APIProvider>
    </div>
  );
}

function UserLocationMarker({ position }: { position: GeoPoint }) {
  return (
    <AdvancedMarker position={position} title="Your location" zIndex={5}>
      <div className="relative flex items-center justify-center">
        <span className="absolute w-8 h-8 rounded-full bg-brand-blue/25 animate-ping" />
        <span className="w-3.5 h-3.5 rounded-full bg-brand-blue border-2 border-white shadow-md" />
      </div>
    </AdvancedMarker>
  );
}

function NodeMarker({
  node,
  isSelected,
  onSelect,
}: {
  node: PickupNode;
  isSelected: boolean;
  onSelect: (nodeId: string) => void;
}) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <AdvancedMarker
        position={node.location}
        title={node.name}
        zIndex={isSelected ? 10 : 1}
        onClick={() => {
          onSelect(node.id);
          setShowInfo(true);
        }}
      >
        <Pin
          background={isSelected ? "#006CDF" : "#3D93E0"}
          borderColor={isSelected ? "#005CBE" : "#3D93E0"}
          glyphColor="#FFFFFF"
          scale={isSelected ? 1.25 : 1}
        />
      </AdvancedMarker>

      {showInfo && (
        <InfoWindow
          position={node.location}
          onCloseClick={() => setShowInfo(false)}
          pixelOffset={[0, -36]}
        >
          <div className="px-1 py-0.5 min-w-[160px]">
            <p className="text-[13px] font-semibold text-[#0B1530] mb-0.5">{node.name}</p>
            <p className="text-[11px] text-[#4A5C7D]">
              {node.distanceKm !== undefined ? `${node.distanceKm.toFixed(1)}km away · ` : ""}
              {node.city}, {node.state}
            </p>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

/** Shown when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is empty — keeps node selection usable without a live map. */
function MapUnavailableFallback({
  nodes,
  selectedNodeId,
  onSelectNode,
}: {
  nodes: PickupNode[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}) {
  return (
    <div className="w-full h-[280px] rounded-[18px] border border-dashed border-border-strong bg-bg-subtle flex flex-col items-center justify-center px-6 text-center gap-2">
      <span className="text-[22px]" aria-hidden="true">🗺️</span>
      <p className="text-[13px] font-semibold text-text-secondary">Map unavailable</p>
      <p className="text-[12px] text-text-muted max-w-[260px] leading-[1.5]">
        Add a Google Maps API key to <code className="text-[11px] bg-bg-card px-1 py-0.5 rounded">.env.local</code> to
        see live node locations here. You can still select a node from the list below.
      </p>
      {/* Hidden buttons keep keyboard/list-based selection fully functional without the visual map */}
      <div className="sr-only">
        {nodes.map((node) => (
          <button key={node.id} onClick={() => onSelectNode(node.id)} aria-pressed={selectedNodeId === node.id}>
            {node.name}
          </button>
        ))}
      </div>
    </div>
  );
}
