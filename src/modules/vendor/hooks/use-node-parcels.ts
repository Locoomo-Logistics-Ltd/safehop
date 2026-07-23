"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { vendorService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import type { ParcelNodeStatus } from "@/core/types";

export type ParcelFilterTab = "awaiting_pickup" | "ready_for_collection" | "all";

const FILTER_STATUS_MAP: Record<ParcelFilterTab, ParcelNodeStatus[] | null> = {
  awaiting_pickup: ["awaiting_pickup", "awaiting_rider", "delayed", "checked_in"],
  ready_for_collection: ["ready_for_collection"],
  all: null,
};

/**
 * Fetches the vendor's node parcel list and exposes the filter-tab
 * state shown on the Node Dashboard ("Awaiting Pickup" / "Ready for
 * Collection").
 */
export function useNodeParcels() {
  const [activeTab, setActiveTab] = useState<ParcelFilterTab>("awaiting_pickup");

  const query = useQuery({
    queryKey: QUERY_KEYS.vendorParcels,
    queryFn: () => vendorService.listParcels(),
  });

  const parcels = useMemo(() => query.data ?? [], [query.data]);

  const filteredParcels = useMemo(() => {
    const allowedStatuses = FILTER_STATUS_MAP[activeTab];
    if (!allowedStatuses) return parcels;
    return parcels.filter((p) => allowedStatuses.includes(p.status));
  }, [parcels, activeTab]);

  return {
    parcels,
    filteredParcels,
    activeTab,
    setActiveTab,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
