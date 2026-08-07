"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { useNotificationStore } from "@/store/notification.store";
import { getErrorMessage } from "@/core/api/errors";

/** No dispute center endpoints exist yet — see `admin.service.ts`. */
export function useAdminDisputes() {
  const queryClient = useQueryClient();
  const showNotification = useNotificationStore((s) => s.showNotification);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const disputesQuery = useQuery({
    queryKey: QUERY_KEYS.adminDisputes,
    queryFn: () => adminService.getDisputes(),
    retry: false,
  });

  const metricsQuery = useQuery({
    queryKey: QUERY_KEYS.adminDisputeMetrics,
    queryFn: () => adminService.getDisputeMetrics(),
    retry: false,
  });

  const disputes = useMemo(() => disputesQuery.data ?? [], [disputesQuery.data]);
  const selectedDispute = disputes.find((d) => d.id === selectedId) ?? disputes[0] ?? null;

  const resolveMutation = useMutation({
    mutationFn: (disputeId: string) => adminService.resolveDispute(disputeId),
    onSuccess: () => {
      showNotification({ type: "success", title: "Dispute resolved", message: "The dispute was marked resolved." });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminDisputes });
    },
    onError: (error) => {
      showNotification({ type: "error", title: "Couldn't resolve dispute", message: getErrorMessage(error) });
    },
  });

  return {
    disputes,
    isLoading: disputesQuery.isLoading,
    metrics: metricsQuery.data,
    isMetricsLoading: metricsQuery.isLoading,
    selectedDispute,
    selectDispute: setSelectedId,
    resolveDispute: resolveMutation.mutate,
    isResolving: resolveMutation.isPending,
  };
}
