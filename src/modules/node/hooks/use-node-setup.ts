"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { nodeService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { getErrorMessage } from "@/core/api/errors";
import { useNotificationStore } from "@/store/notification.store";
import { useMyNodes } from "./use-my-nodes";
import type { NodeOperatorOnboardingPayload, PayoutAccountPayload } from "@/core/types";

/**
 * Drives the "My Nodes" screen: the list itself (via `useMyNodes`),
 * creating a Node, and setting one Node's payout account. Real,
 * confirmed routes per docs/API.md —
 * `GET /node-operators/me/nodes`, `POST /node-operators/onboarding`,
 * `POST /node-operators/nodes`, and
 * `PATCH /node-operators/nodes/:nodeId/payout-account`.
 *
 * **`createNode` picks its own endpoint.** The API has two create
 * routes that take an identical body and refuse each other's case:
 * `onboarding` works only for the first Node (`409
 * NODE_OPERATOR_ALREADY_ONBOARDED` after), `nodes` only once a first
 * one exists (`400 NODE_OPERATOR_NOT_ONBOARDED` before). Making the
 * caller choose would push a server-side rule into every form, so the
 * branch lives here, on whether the fetched list is empty. If the list
 * is stale the API rejects it with one of those two codes, both of
 * which `getFriendlyError` maps to copy that points at the other path.
 *
 * Payout accounts are **per-Node** and owner-only, so
 * `setPayoutAccount` takes the `nodeId` it applies to — there's no
 * account-wide payout account any more.
 */
export function useNodeSetup() {
  const queryClient = useQueryClient();
  const showNotification = useNotificationStore((s) => s.showNotification);
  const { nodes, ownedNodes, notOnboarded, hasNoStationsYet, isLoading, error, isStaff } =
    useMyNodes();

  const createNodeMutation = useMutation({
    mutationFn: (payload: NodeOperatorOnboardingPayload) =>
      nodes.length === 0 ? nodeService.onboardNode(payload) : nodeService.addNode(payload),
    onSuccess: (membership) => {
      // Refetch rather than splice the new membership into the cached
      // array: this is a list now, and the server is the authority on
      // its order and on any membership the client doesn't know about.
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nodeOperatorNodes });
      showNotification({
        type: "success",
        title: "Pickup station submitted",
        message: `${membership.node.name} is now waiting for admin approval.`,
      });
    },
  });

  const banksQuery = useQuery({
    queryKey: QUERY_KEYS.payoutBanks,
    queryFn: () => nodeService.getPayoutBanks(),
    staleTime: Infinity,
  });

  const payoutAccountMutation = useMutation({
    mutationFn: ({ nodeId, payload }: { nodeId: string; payload: PayoutAccountPayload }) =>
      nodeService.setPayoutAccount(nodeId, payload),
    onSuccess: (membership) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nodeOperatorNodes });
      // The account holder name is only ever known once Paystack has
      // resolved it as part of this same save — there's no separate
      // preview/verify route per docs/API.md, so this toast is the
      // first moment the operator actually sees the resolved name.
      showNotification({
        type: "success",
        title: "Payout account saved",
        message: membership.payoutAccountName
          ? `Verified as ${membership.payoutAccountName}, for ${membership.node.name}.`
          : `${membership.node.name}'s payout account is on file.`,
      });
    },
    onError: (mutationError) => {
      showNotification({
        type: "error",
        title: "Couldn't save payout account",
        message: getErrorMessage(mutationError),
      });
    },
  });

  return {
    nodes,
    ownedNodes,
    isLoadingNodes: isLoading,
    notOnboarded,
    hasNoStationsYet,
    nodesError: error,
    isStaff,

    /** Creates a Node — the first one or another, resolved from the list. See the header note. */
    createNode: createNodeMutation.mutate,
    isCreatingNode: createNodeMutation.isPending,
    createNodeError: createNodeMutation.error,
    createdNode: createNodeMutation.data,
    isNodeCreated: createNodeMutation.isSuccess,

    banks: banksQuery.data ?? [],
    isLoadingBanks: banksQuery.isLoading,

    setPayoutAccount: payoutAccountMutation.mutate,
    isSettingPayoutAccount: payoutAccountMutation.isPending,
    payoutAccountError: payoutAccountMutation.error,
    /** The Node id of the in-flight/last payout save, so a multi-Node list can show the state on the right card only. */
    payoutAccountNodeId: payoutAccountMutation.variables?.nodeId,
    payoutAccountSaved: payoutAccountMutation.isSuccess,
  };
}
