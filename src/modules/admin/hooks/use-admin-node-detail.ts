"use client";

import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";

/** GET /nodes/:id — only fetched once a node's "View Details" is expanded. */
export function useAdminNodeDetail(nodeId: string, enabled: boolean) {
  const query = useQuery({
    queryKey: QUERY_KEYS.adminNodeDetail(nodeId),
    queryFn: () => adminService.getNodeDetail(nodeId),
    enabled,
  });

  return {
    node: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
