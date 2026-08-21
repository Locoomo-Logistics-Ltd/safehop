"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { useNotificationStore } from "@/store/notification.store";
import { getErrorMessage } from "@/core/api/errors";
import type { OnboardNodePayload } from "@/core/types";

/** POST /nodes — a real, confirmed route per docs/API.md (Admin creates a Node, immediately active). */
export function useOnboardNode() {
  const queryClient = useQueryClient();
  const showNotification = useNotificationStore((s) => s.showNotification);

  const mutation = useMutation({
    mutationFn: (payload: OnboardNodePayload) => adminService.onboardPartnerNode(payload),
    onSuccess: () => {
      showNotification({ type: "success", title: "Node created", message: "The new node is now live on the network." });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminNodes });
    },
    onError: (error) => {
      showNotification({ type: "error", title: "Couldn't create node", message: getErrorMessage(error) });
    },
  });

  return {
    onboardNode: mutation.mutate,
    isSubmitting: mutation.isPending,
  };
}
