"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { useNotificationStore } from "@/store/notification.store";
import { getErrorMessage } from "@/core/api/errors";
import type { UpdateNodePayload } from "@/core/types";

/** PATCH /nodes/:id — a real, confirmed route per docs/API.md (Admin-only). */
export function useManageNode() {
  const queryClient = useQueryClient();
  const showNotification = useNotificationStore((s) => s.showNotification);

  const mutation = useMutation({
    mutationFn: ({ nodeId, payload }: { nodeId: string; payload: UpdateNodePayload }) =>
      adminService.updateNode(nodeId, payload),
    onSuccess: (updated) => {
      showNotification({ type: "success", title: "Node updated", message: `${updated.name} is now ${updated.status}.` });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminNodes });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminNodeDetail(updated.id) });
    },
    onError: (error) => {
      showNotification({ type: "error", title: "Couldn't update node", message: getErrorMessage(error) });
    },
  });

  return {
    updateNode: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}
