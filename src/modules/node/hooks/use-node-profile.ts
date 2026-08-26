"use client";

import { useQuery } from "@tanstack/react-query";
import { nodeService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { isApiError } from "@/core/api/errors";

/**
 * Fetches the operator's managed Node — name, address, capacity,
 * approval status — via `GET /node-operators/me` (real, confirmed per
 * docs/API.md). Same route and query key as `useNodeSetup`, so
 * TanStack Query dedupes the two call sites.
 *
 * `404 NOT_FOUND` here is expected (the operator hasn't completed Node
 * setup yet), surfaced separately as `notOnboarded` rather than folded
 * into `isError` — same pattern as `useNodeSetup`.
 */
export function useNodeProfile() {
  const query = useQuery({
    queryKey: QUERY_KEYS.nodeOperatorProfile,
    queryFn: () => nodeService.getMyNodeOperatorProfile(),
    retry: false,
  });

  const notOnboarded = isApiError(query.error) && query.error.code === "NOT_FOUND";

  return {
    node: query.data?.node,
    payoutAccountConfigured: query.data?.payoutAccountConfigured,
    isLoading: query.isLoading,
    notOnboarded,
    error: notOnboarded ? null : query.error,
    isError: query.isError && !notOnboarded,
  };
}
