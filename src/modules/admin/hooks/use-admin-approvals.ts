"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { useNotificationStore } from "@/store/notification.store";
import { getErrorMessage } from "@/core/api/errors";

/** GET /node-operators/pending + PATCH /node-operators/:id/approve — real, confirmed routes per docs/API.md. */
export function useNodeOperatorApprovals() {
  const queryClient = useQueryClient();
  const showNotification = useNotificationStore((s) => s.showNotification);

  const query = useQuery({
    queryKey: QUERY_KEYS.adminNodeOperatorsPending,
    queryFn: () => adminService.getPendingNodeOperators(),
    retry: false,
  });

  const approveMutation = useMutation({
    mutationFn: (profileId: string) => adminService.approveNodeOperator(profileId),
    onSuccess: (approved) => {
      showNotification({
        type: "success",
        title: "Node operator approved",
        message: `${approved.node.name} is now active.`,
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminNodeOperatorsPending });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminNodes });
    },
    onError: (error) => {
      showNotification({ type: "error", title: "Couldn't approve node operator", message: getErrorMessage(error) });
    },
  });

  return {
    pending: query.data ?? [],
    isLoading: query.isLoading,
    approve: approveMutation.mutate,
    isApproving: approveMutation.isPending,
    approvingProfileId: approveMutation.variables,
  };
}

/** GET /riders/pending + PATCH /riders/:id/approve — real, confirmed routes per docs/API.md. */
export function useRiderApprovals() {
  const queryClient = useQueryClient();
  const showNotification = useNotificationStore((s) => s.showNotification);

  const query = useQuery({
    queryKey: QUERY_KEYS.adminRidersPending,
    queryFn: () => adminService.getPendingRiders(),
    retry: false,
  });

  const approveMutation = useMutation({
    mutationFn: (profileId: string) => adminService.approveRider(profileId),
    onSuccess: () => {
      showNotification({ type: "success", title: "Rider approved", message: "The rider is now active on the job board." });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminRidersPending });
    },
    onError: (error) => {
      showNotification({ type: "error", title: "Couldn't approve rider", message: getErrorMessage(error) });
    },
  });

  return {
    pending: query.data ?? [],
    isLoading: query.isLoading,
    approve: approveMutation.mutate,
    isApproving: approveMutation.isPending,
    approvingProfileId: approveMutation.variables,
  };
}
