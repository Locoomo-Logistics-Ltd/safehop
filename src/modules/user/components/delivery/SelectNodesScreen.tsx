"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ProgressSteps } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { TopBar } from "@/components/layout";
import { MapPinIcon } from "@/components/icons";
import { useNodes } from "@/modules/user/hooks/use-nodes";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useDeliveryDraftStore } from "@/store/delivery-draft.store";
import { ROUTES } from "@/core/config/constants";
import { getErrorMessage, getFriendlyError } from "@/core/api/errors";
import { geocodingService } from "@/core/api/services/geocoding.service";
import { distanceKm } from "@/lib/geo";
import { NodeMapView } from "./NodeMapView";
import { NodePickerField } from "./NodePickerField";
import { NodePickerSheet } from "./NodePickerSheet";
import type { GeoPoint, PickupNode } from "@/core/types";

type ActiveSheet = "origin" | "destination" | null;

/** Per-picker address search state — origin and destination can each search a different address independently. */
interface AddressSearchState {
  point: GeoPoint | null;
  label: string | null;
  isSearching: boolean;
  error: string | null;
}

const EMPTY_SEARCH: AddressSearchState = { point: null, label: null, isSearching: false, error: null };

/**
 * Step 2 of the New Delivery flow: pick the origin Pickup Station
 * (where the sender drops the parcel off) and the destination Pickup
 * Station (where the receiver collects it).
 *
 * Rebuilt 2026-08-21 — with enough Nodes in the network, the previous
 * design (both pickers' full lists always rendered inline, one below
 * the other) turned this screen into an endless scroll. Both pickers
 * are now a collapsed `NodePickerField` that opens a `NodePickerSheet`
 * — the full list only exists while that sheet is open. Each sheet's
 * search box also does double duty: type a station/city name for an
 * instant local filter (unchanged from before), or type any address and
 * tap the pin button to geocode it (`geocodingService`, already used
 * elsewhere for Node onboarding) and re-sort every node by distance to
 * *that* address instead of the sender's own location — picking a
 * station near the receiver's address, not just near yourself.
 *
 * Previously rebuilt 2026-08-12 — `POST /payments/intents` requires a
 * real `destinationNodeId` per docs/API.md, not a free-text address.
 * The map stays focused on origin selection (its primary, highest-
 * frequency use, unchanged by this session); tapping a marker still
 * selects the origin directly, same as before.
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
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);

  const [originSearch, setOriginSearch] = useState("");
  const [destinationSearch, setDestinationSearch] = useState("");
  const [originAddressSearch, setOriginAddressSearch] = useState<AddressSearchState>(EMPTY_SEARCH);
  const [destinationAddressSearch, setDestinationAddressSearch] =
    useState<AddressSearchState>(EMPTY_SEARCH);

  const addressSearchAvailable = geocodingService.isConfigured();

  // Recompute live distance from the user's real position, then sort
  // nearest-first — feeds the map only. Each picker's own sheet list
  // (below) sorts independently, since an address search there can use
  // a different reference point entirely.
  const nodesWithLiveDistance = useMemo(() => {
    if (!userPosition) return nodes;
    return nodes
      .map((node) => ({ ...node, distanceKm: distanceKm(userPosition, node.location) }))
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }, [nodes, userPosition]);

  const selectedOriginNode = useMemo(
    () => nodesWithLiveDistance.find((n) => n.id === selectedOriginId) ?? null,
    [nodesWithLiveDistance, selectedOriginId]
  );
  const selectedDestinationNode = useMemo(
    () => nodesWithLiveDistance.find((n) => n.id === selectedDestinationId) ?? null,
    [nodesWithLiveDistance, selectedDestinationId]
  );

  const originNodesForSheet = useNodesForPicker({
    nodes,
    userPosition,
    excludeNodeId: null,
    search: originSearch,
    addressSearch: originAddressSearch,
  });
  const destinationNodesForSheet = useNodesForPicker({
    nodes,
    userPosition,
    excludeNodeId: selectedOriginId,
    search: destinationSearch,
    addressSearch: destinationAddressSearch,
  });

  const canProceed = !!selectedOriginId && !!selectedDestinationId && selectedOriginId !== selectedDestinationId;

  const handleSelectOrigin = (nodeId: string) => {
    setSelectedOriginId(nodeId);
    if (selectedDestinationId === nodeId) setSelectedDestinationId(null);
  };

  const handleNext = () => {
    if (!canProceed) return;
    setOriginNode(selectedOriginId);
    setDestinationNode(selectedDestinationId);
    router.push(ROUTES.deliveryMethod);
  };

  const searchAddress = async (
    query: string,
    setState: React.Dispatch<React.SetStateAction<AddressSearchState>>
  ) => {
    if (!query.trim()) return;
    setState((s) => ({ ...s, isSearching: true, error: null }));
    try {
      const result = await geocodingService.geocodeAddress({ address: query, city: "", state: "" });
      setState({ point: { lat: result.lat, lng: result.lng }, label: result.formatted, isSearching: false, error: null });
    } catch (err) {
      setState((s) => ({ ...s, isSearching: false, error: getErrorMessage(err) }));
    }
  };

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="Pickup & Destination" showBack />

      <div className="px-4 md:px-6 pt-2 md:pt-6 pb-28 max-w-[560px] mx-auto">
        <div className="hidden md:block mb-6">
          <h1 className="font-display text-[22px] font-bold text-text-primary">
            Select Pickup Station
          </h1>
          <p className="text-[14px] text-text-secondary mt-1">
            Choose a drop-off Station and a destination Station
          </p>
        </div>

        <ProgressSteps total={4} current={2} className="mb-5" />

        <NodeMapView
          nodes={nodesWithLiveDistance}
          selectedNodeId={selectedOriginId}
          onSelectNode={handleSelectOrigin}
          userPosition={userPosition}
        />

        {permissionGranted === false && (
          <p className="flex items-start gap-1 text-[11px] text-text-muted mt-2">
            <MapPinIcon size={12} className="shrink-0 mt-0.5" />
            Location access denied; showing Lagos by default. Distances may be approximate.
          </p>
        )}

        {isError && <ErrorAlert {...getFriendlyError(error)} />}

        <div className="mt-5 flex flex-col gap-3">
          <NodePickerField
            label="Dropoff Station"
            placeholder="Choose a dropoff station"
            node={selectedOriginNode}
            onClick={() => setActiveSheet("origin")}
          />
          <NodePickerField
            label="Destination Station"
            placeholder="Choose a destination station"
            node={selectedDestinationNode}
            onClick={() => setActiveSheet("destination")}
          />
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

      {activeSheet === "origin" && (
        <NodePickerSheet
          title="Select Pickup Station"
          nodes={originNodesForSheet}
          isLoading={isLoading}
          selectedNodeId={selectedOriginId}
          onSelect={handleSelectOrigin}
          onClose={() => setActiveSheet(null)}
          searchValue={originSearch}
          onSearchChange={setOriginSearch}
          addressSearchAvailable={addressSearchAvailable}
          onSearchAddress={() => searchAddress(originSearch, setOriginAddressSearch)}
          isSearchingAddress={originAddressSearch.isSearching}
          searchAddressError={originAddressSearch.error}
          searchedAddressLabel={originAddressSearch.label}
          onClearAddressSearch={() => setOriginAddressSearch(EMPTY_SEARCH)}
        />
      )}

      {activeSheet === "destination" && (
        <NodePickerSheet
          title="Select Destination Station"
          nodes={destinationNodesForSheet}
          isLoading={isLoading}
          selectedNodeId={selectedDestinationId}
          onSelect={setSelectedDestinationId}
          onClose={() => setActiveSheet(null)}
          searchValue={destinationSearch}
          onSearchChange={setDestinationSearch}
          addressSearchAvailable={addressSearchAvailable}
          onSearchAddress={() => searchAddress(destinationSearch, setDestinationAddressSearch)}
          isSearchingAddress={destinationAddressSearch.isSearching}
          searchAddressError={destinationAddressSearch.error}
          searchedAddressLabel={destinationAddressSearch.label}
          onClearAddressSearch={() => setDestinationAddressSearch(EMPTY_SEARCH)}
        />
      )}
    </div>
  );
}

/**
 * One picker's node list: sorted by distance to whatever reference
 * point currently applies (a searched address takes priority over the
 * user's own live position), then either text-filtered by name/city
 * (normal mode) or left unfiltered (address-search mode — the whole
 * point is showing every node near an address that won't itself match
 * as a text query).
 */
function useNodesForPicker({
  nodes,
  userPosition,
  excludeNodeId,
  search,
  addressSearch,
}: {
  nodes: PickupNode[];
  userPosition: GeoPoint | null;
  excludeNodeId: string | null;
  search: string;
  addressSearch: AddressSearchState;
}): PickupNode[] {
  return useMemo(() => {
    const candidates = excludeNodeId ? nodes.filter((n) => n.id !== excludeNodeId) : nodes;
    const referencePoint = addressSearch.point ?? userPosition;

    const sorted = referencePoint
      ? candidates
          .map((node) => ({ ...node, distanceKm: distanceKm(referencePoint, node.location) }))
          .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
      : candidates;

    if (addressSearch.point) return sorted; // address-search mode — show every node near it, no text filter
    if (!search.trim()) return sorted;

    const q = search.toLowerCase();
    return sorted.filter((n) => n.name.toLowerCase().includes(q) || n.city.toLowerCase().includes(q));
  }, [nodes, userPosition, excludeNodeId, search, addressSearch.point]);
}
