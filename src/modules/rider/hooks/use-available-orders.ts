"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { riderService } from "@/core/api/services";
import { ApiError } from "@/core/api/errors";
import { QUERY_KEYS } from "@/core/config/constants";
import { useGeolocation } from "@/hooks/use-geolocation";

/** Matches the API's own default page size, per docs/API.md's Pagination section. */
const DEFAULT_LIMIT = 20;

/**
 * The real, documented job board — `GET /handoffs/available-orders`:
 * orders sitting unclaimed at their origin Node, sorted nearest-first
 * to the coordinates we send.
 *
 * About those coordinates: `useGeolocation` never stays `null`. If the
 * rider denies permission (or the device can't do geolocation), it
 * resolves to a Lagos-centre fallback with `permissionGranted: false`.
 * The request still succeeds in that case — but "nearest-first" is then
 * sorted against a point the rider isn't standing on, and every
 * `distanceMeters` is fiction. That's why `isSortTrustworthy` is
 * returned separately rather than folded into the loading state: the
 * board is still worth showing, it just must not be presented as
 * "jobs near you". See AvailableJobsScreen for how it's surfaced.
 */
export function useAvailableOrders(limit: number = DEFAULT_LIMIT) {
  const [page, setPage] = useState(1);
  const { position, isLoading: isLocating, permissionGranted } = useGeolocation();

  const latitude = position?.lat;
  const longitude = position?.lng;
  const hasPosition = latitude !== undefined && longitude !== undefined;

  const query = useQuery({
    queryKey: QUERY_KEYS.riderAvailableOrders(latitude ?? 0, longitude ?? 0, page),
    queryFn: () => {
      if (!hasPosition) {
        // `enabled` already prevents this; the guard exists because the
        // type system can't see that invariant.
        throw new ApiError({
          message: "We need your location to find jobs near you.",
          status: 400,
          code: "VALIDATION_FAILED",
        });
      }
      return riderService.listAvailableOrders({ latitude, longitude, page, limit });
    },
    enabled: hasPosition,
    // Keeps the previous page on screen while the next one loads —
    // paging a list that blanks out on every tap reads as a crash.
    placeholderData: (previous) => previous,
  });

  const total = query.data?.total ?? 0;
  const currentPage = query.data?.page ?? page;
  const currentLimit = query.data?.limit ?? limit;

  return {
    items: query.data?.items ?? [],
    page: currentPage,
    limit: currentLimit,
    total,
    hasNextPage: currentPage * currentLimit < total,
    hasPreviousPage: currentPage > 1,
    setPage,

    /** True only while we're still waiting on a first result — a page change keeps showing the old one. */
    isLoading: isLocating || (query.isLoading && hasPosition),
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,

    /** False when the sort ran against the fallback position rather than the rider's real one. */
    isSortTrustworthy: permissionGranted === true,
  };
}
