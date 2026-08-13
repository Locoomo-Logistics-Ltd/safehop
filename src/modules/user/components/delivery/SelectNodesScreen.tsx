"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, ProgressSteps } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { TopBar } from "@/components/layout";
import { SearchIcon } from "@/components/icons";
import { useNodes } from "@/modules/user/hooks/use-nodes";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useDeliveryDraftStore } from "@/store/delivery-draft.store";
import { ROUTES } from "@/core/config/constants";
import { getFriendlyError } from "@/core/api/errors";
import { distanceKm } from "@/lib/geo";
import { GoogleMapView } from "./GoogleMapView";
import { NodeListItem } from "./NodeListItem";

/**
 * Step 2 of the New Delivery flow: pick the origin Pickup Station
 * (where the sender drops the parcel off) and the destination Pickup
 * Station (where the receiver collects it).
 *
 * Rebuilt 2026-08-12 — `POST /payments/intents` requires a real
 * `destinationNodeId` per docs/API.md, not a free-text address (the
 * old `DestinationAddressInput` targeted the undocumented
 * `orders/book` route's `destinationAddress` field, which doesn't
 * exist in the real, documented order-placement contract). Both
 * pickers share the same nearby-Nodes list; the map stays focused on
 * origin selection (its primary, highest-frequency use), destination
 * is a second searchable list below it.
 *
 * Requests the user's real location on mount (useGeolocation) to
 * center the map and compute live "X km away" distances — falls back
 * to a Lagos-centered default if permission is denied.
 */
export function SelectNodesScreen() {
  const router = useRouter();
  const { nodes, isLoading, isError, error } = useNodes();
  const { position: userPosition, permissionGranted } = useGeolocation();
  const setOriginNode = useDeliveryDraftStore((s) => s.setOriginNode);
  const setDestinationNode = useDeliveryDraftStore((s) => s.setDestinationNode);
  const originNodeId = useDeliveryDraftStore((s) => s.originNodeId);
  const destinationNodeId = useDeliveryDraftStore((s) => s.destinationNodeId);

  const [selectedOriginId, setSelectedOriginId] = useState<string | null>(originNodeId);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(destinationNodeId);
  const [originSearch, setOriginSearch] = useState("");
  const [destinationSearch, setDestinationSearch] = useState("");

  // Recompute live distance from the user's real position, then sort
  // nearest-first — replaces the static mock distanceKm values.
  const nodesWithLiveDistance = useMemo(() => {
    if (!userPosition) return nodes;
    return nodes
      .map((node) => ({ ...node, distanceKm: distanceKm(userPosition, node.location) }))
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }, [nodes, userPosition]);

  const filteredOriginNodes = useMemo(() => {
    if (!originSearch.trim()) return nodesWithLiveDistance;
    const q = originSearch.toLowerCase();
    return nodesWithLiveDistance.filter((n) => n.name.toLowerCase().includes(q) || n.city.toLowerCase().includes(q));
  }, [nodesWithLiveDistance, originSearch]);

  const filteredDestinationNodes = useMemo(() => {
    const withoutOrigin = nodesWithLiveDistance.filter((n) => n.id !== selectedOriginId);
    if (!destinationSearch.trim()) return withoutOrigin;
    const q = destinationSearch.toLowerCase();
    return withoutOrigin.filter((n) => n.name.toLowerCase().includes(q) || n.city.toLowerCase().includes(q));
  }, [nodesWithLiveDistance, selectedOriginId, destinationSearch]);

  const canProceed = !!selectedOriginId && !!selectedDestinationId && selectedOriginId !== selectedDestinationId;

  const   handleSelectOrigin = (nodeId: string) => {
    setSelectedOriginId(nodeId);
    if (selectedDestinationId === nodeId) setSelectedDestinationId(null);
  };

  const handleNext = () => {
    if (!canProceed) return;
    setOriginNode(selectedOriginId);
    setDestinationNode(selectedDestinationId);
    router.push(ROUTES.deliveryMethod);
  };

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="Pickup & Destination" showBack />

      <div className="px-4 md:px-6 pt-2 md:pt-6 pb-28 max-w-[560px] mx-auto">
        <div className="hidden md:block mb-6">
          <h1 className="font-display text-[22px] font-bold text-text-primary">
            Pickup &amp; Destination
          </h1>
          <p className="text-[14px] text-text-secondary mt-1">
            Choose a drop-off Pickup Station and a destination Pickup Station
          </p>
        </div>

        <ProgressSteps total={4} current={2} className="mb-5" />

        <GoogleMapView
          nodes={nodesWithLiveDistance}
          selectedNodeId={selectedOriginId}
          onSelectNode={handleSelectOrigin}
          userPosition={userPosition}
        />

        {permissionGranted === false && (
          <p className="text-[11px] text-text-muted mt-2">
            📍 Location access denied — showing Lagos by default. Distances may be approximate.
          </p>
        )}

        {isError && <ErrorAlert {...getFriendlyError(error)} />}

        <div className="mt-5">
          <p className="text-[13px] font-medium text-text-secondary mb-2">
            Select Pickup Station
          </p>
          <Input
            placeholder="Search nearby stations or from your history"
            leftElement={<SearchIcon size={16} />}
            value={originSearch}
            onChange={(e) => setOriginSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2.5 mt-4">
          {isLoading ? (
            <p className="text-[13px] text-text-muted text-center py-6">Loading nodes…</p>
          ) : isError ? null : filteredOriginNodes.length === 0 ? (
            <p className="text-[13px] text-text-muted text-center py-6">
              No stations match &ldquo;{originSearch}&rdquo;
            </p>
          ) : (
            filteredOriginNodes.map((node) => (
              <NodeListItem
                key={node.id}
                node={node}
                isSelected={selectedOriginId === node.id}
                onSelect={handleSelectOrigin}
              />
            ))
          )}
        </div>

        <div className="mt-6">
          <p className="text-[13px] font-medium text-text-secondary mb-2">
            Select Destination Station
          </p>
          <Input
            placeholder="Search destination stations"
            leftElement={<SearchIcon size={16} />}
            value={destinationSearch}
            onChange={(e) => setDestinationSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2.5 mt-4">
          {isLoading ? (
            <p className="text-[13px] text-text-muted text-center py-6">Loading nodes…</p>
          ) : isError ? null : filteredDestinationNodes.length === 0 ? (
            <p className="text-[13px] text-text-muted text-center py-6">
              {selectedOriginId ? `No other stations match “${destinationSearch}”` : "Select a pickup station first"}
            </p>
          ) : (
            filteredDestinationNodes.map((node) => (
              <NodeListItem
                key={node.id}
                node={node}
                isSelected={selectedDestinationId === node.id}
                onSelect={setSelectedDestinationId}
              />
            ))
          )}
        </div>

        <p className="text-[11px] text-text-muted mt-4 leading-[1.6]">
          Parcel must be under ₦100,000 in value and 8kg in weight for drop &amp; pick.
        </p>
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-[var(--bottom-nav-height)] md:bottom-0 left-0 right-0 md:left-[260px] p-4 bg-bg-canvas border-t border-border-default">
        <div className="max-w-[560px] mx-auto">
          <Button fullWidth size="lg" disabled={!canProceed} onClick={handleNext}>
            Next step →
          </Button>
        </div>
      </div>
    </div>
  );
}
