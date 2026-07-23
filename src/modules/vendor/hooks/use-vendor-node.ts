"use client";

import { useQuery } from "@tanstack/react-query";
import { vendorService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";

/** Fetches the vendor's managed node profile — capacity, name, address. */
export function useVendorNode() {
  const query = useQuery({
    queryKey: QUERY_KEYS.vendorNodeProfile,
    queryFn: () => vendorService.getNodeProfile(),
  });

  return {
    node: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
