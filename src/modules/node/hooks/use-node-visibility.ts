"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { nodeService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { getErrorMessage } from "@/core/api/errors";
import { useNotificationStore } from "@/store/notification.store";

/**
 * `PATCH /node-operators/nodes/:nodeId/visibility` — real, confirmed
 * route per docs/API.md (2026-09-03). Owner-only; the Node must
 * already be `active` (`403 NODE_NOT_ACTIVE`).
 *
 * **What this actually switches, because the name oversells it:**
 * turning public drop-offs off hides the station from `GET /nodes` and
 * `GET /nodes/nearby` for non-Admins, and makes a Consumer-initiated
 * `POST /payments/intents` naming it — as origin *or* destination —
 * answer `404`. It does **not** stop handoffs, earnings, staff, or
 * parcels another operator dispatches to it, and it is not the
 * Admin-only `status: inactive`. The toasts below say so explicitly:
 * an operator switching this off needs to know parcels already in
 * flight still arrive, or they'll think the station is closed and stop
 * checking the counter.
 *
 * No optimistic update — this is a state an operator will read back
 * off the screen to decide whether their station is taking walk-ins,
 * so it's worth the round trip to show only what the server confirmed.
 */
export function useNodeVisibility(nodeId: string) {
  const queryClient = useQueryClient();
  const showNotification = useNotificationStore((s) => s.showNotification);

  const mutation = useMutation({
    mutationFn: (isPubliclyVisible: boolean) =>
      nodeService.setNodeVisibility(nodeId, isPubliclyVisible),
    onSuccess: (membership) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nodeOperatorNodes });
      const isVisible = membership.node.isPubliclyVisible !== false;
      showNotification({
        type: "success",
        title: isVisible ? "Public drop-offs are on" : "Public drop-offs are off",
        message: isVisible
          ? `${membership.node.name} is listed again and customers can send parcels to it.`
          : `${membership.node.name} is hidden from customers. Parcels already on their way still arrive, and you can still send your own.`,
      });
    },
    onError: (error) => {
      showNotification({
        type: "error",
        title: "Couldn't change that",
        message: getErrorMessage(error),
      });
    },
  });

  return {
    setVisibility: mutation.mutate,
    isSaving: mutation.isPending,
    error: mutation.error,
  };
}
