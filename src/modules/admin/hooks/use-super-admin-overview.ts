"use client";

import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";

/** No super admin overview endpoint exists yet — see `admin.service.ts`. */
export function useSuperAdminOverview() {
  const query = useQuery({
    queryKey: QUERY_KEYS.adminSuperAdminOverview,
    queryFn: () => adminService.getSuperAdminOverview(),
    retry: false,
  });

  return {
    overview: query.data,
    isLoading: query.isLoading,
  };
}
