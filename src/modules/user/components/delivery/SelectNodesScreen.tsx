"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, ProgressSteps } from "@/components/ui";
import { TopBar } from "@/components/layout";
import { SearchIcon } from "@/components/icons";
import { useNodes } from "@/modules/user/hooks/use-nodes";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useDeliveryDraftStore } from "@/store/delivery-draft.store";
import { ROUTES } from "@/core/config/constants";
import { distanceKm } from "@/lib/geo";
import { GoogleMapView } from "./GoogleMapView";
import { NodeListItem } from "./NodeListItem";
import { DestinationAddressInput } from "./DestinationAddressInput";

/**
 * Step 2 of the New Delivery flow: pick the origin Pickup Station
 * (where the sender drops the parcel off) from the live network map,
 * and enter a destination address.
 *
 * The real API resolves/geocodes a free-text destination address
 * server-side rather than requiring a destination Node — see
 * core/types/delivery.types.ts's comment on `destinationAddress`.
 *
 * Requests the user's real location on mount (useGeolocation) to
 * center the map and compute live "X km away" distances — falls back
 * to a Lagos-centered default if permission is denied.
 */
export function SelectNodesScreen() {
  const router = useRouter();
  const { nodes, isLoading } = useNodes();
  const { position: userPosition, permissionGranted } = useGeolocation();
  const setOriginNode = useDeliveryDraftStore((s) => s.setOriginNode);
  const setDestinationAddress = useDeliveryDraftStore((s) => s.setDestinationAddress);
  const originNodeId = useDeliveryDraftStore((s) => s.originNodeId);
  const destinationAddress = useDeliveryDraftStore((s) => s.destinationAddress);

  const [selectedId, setSelectedId] = useState<string | null>(originNodeId);
  const [address, setAddress] = useState(destinationAddress ?? "");
  const [search, setSearch] = useState("");

  // Recompute live distance from the user's real position, then sort
  // nearest-first — replaces the static mock distanceKm values.
  const nodesWithLiveDistance = useMemo(() => {
    if (!userPosition) return nodes;
    return nodes
      .map((node) => ({ ...node, distanceKm: distanceKm(userPosition, node.location) }))
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }, [nodes, userPosition]);

  const filteredNodes = useMemo(() => {
    if (!search.trim()) return nodesWithLiveDistance;
    const q = search.toLowerCase();
    return nodesWithLiveDistance.filter(
      (n) => n.name.toLowerCase().includes(q) || n.area.toLowerCase().includes(q)
    );
  }, [nodesWithLiveDistance, search]);

  const canProceed = !!selectedId && address.trim().length > 4;

  const handleNext = () => {
    if (!canProceed) return;
    setOriginNode(selectedId);
    setDestinationAddress(address.trim());
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
            Choose a drop-off Pickup Station and where it&apos;s headed
          </p>
        </div>

        <ProgressSteps total={4} current={2} className="mb-5" />

        <GoogleMapView
          nodes={nodesWithLiveDistance}
          selectedNodeId={selectedId}
          onSelectNode={setSelectedId}
          userPosition={userPosition}
        />

        {permissionGranted === false && (
          <p className="text-[11px] text-text-muted mt-2">
            📍 Location access denied — showing Lagos by default. Distances may be approximate.
          </p>
        )}

        <div className="mt-5">
          <p className="text-[13px] font-medium text-text-secondary mb-2">
            Select Pickup Station
          </p>
          <Input
            placeholder="Search nearby stations or from your history"
            leftElement={<SearchIcon size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2.5 mt-4">
          {isLoading ? (
            <p className="text-[13px] text-text-muted text-center py-6">Loading nodes…</p>
          ) : filteredNodes.length === 0 ? (
            <p className="text-[13px] text-text-muted text-center py-6">
              No stations match &ldquo;{search}&rdquo;
            </p>
          ) : (
            filteredNodes.map((node) => (
              <NodeListItem
                key={node.id}
                node={node}
                isSelected={selectedId === node.id}
                onSelect={setSelectedId}
              />
            ))
          )}
        </div>

        <div className="mt-6">
          <DestinationAddressInput value={address} onChange={setAddress} />
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
