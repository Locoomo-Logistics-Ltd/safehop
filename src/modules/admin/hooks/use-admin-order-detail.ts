"use client";

import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";

/** No admin order detail endpoint exists yet — see `admin.service.ts`. */
export function useAdminOrderDetail(orderId: string) {
  const query = useQuery({
    queryKey: QUERY_KEYS.adminOrderDetail(orderId),
    queryFn: () => adminService.getOrderDetail(orderId),
    retry: false,
  });

  return {
    order: query.data,
    isLoading: query.isLoading,
  };
}
