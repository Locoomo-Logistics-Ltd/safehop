"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { nodeService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { getErrorMessage, isApiError } from "@/core/api/errors";
import { useNotificationStore } from "@/store/notification.store";
import type { NodeOperatorOnboardingPayload, PayoutAccountPayload } from "@/core/types";

/**
 * Drives the Node Operator's self-onboarding step:
 * `GET /node-operators/me` to check whether setup + approval is done,
 * `POST /node-operators/onboarding` to submit it. Real, confirmed
 * routes per docs/API.md — distinct from `useNodeProfile`, which reads
 * an already-approved Node's live dashboard/inventory data.
 *
 * `GET /node-operators/me` returns `404 NOT_FOUND` when onboarding
 * hasn't happened yet — that's an expected state, not a fetch
 * failure, so it's surfaced separately as `notOnboarded` rather than
 * folded into `profileError`.
 */
export function useNodeSetup() {
  const queryClient = useQueryClient();
  const showNotification = useNotificationStore((s) => s.showNotification);

  const profileQuery = useQuery({
    queryKey: QUERY_KEYS.nodeOperatorProfile,
    queryFn: () => nodeService.getMyNodeOperatorProfile(),
    retry: false,
  });

  const notOnboarded = isApiError(profileQuery.error) && profileQuery.error.code === "NOT_FOUND";

  const onboardMutation = useMutation({
    mutationFn: (payload: NodeOperatorOnboardingPayload) => nodeService.onboardNode(payload),
    onSuccess: (profile) => {
      queryClient.setQueryData(QUERY_KEYS.nodeOperatorProfile, profile);
    },
  });

  const banksQuery = useQuery({
    queryKey: QUERY_KEYS.payoutBanks,
    queryFn: () => nodeService.getPayoutBanks(),
    staleTime: Infinity,
  });

  const payoutAccountMutation = useMutation({
    mutationFn: (payload: PayoutAccountPayload) => nodeService.setPayoutAccount(payload),
    onSuccess: (profile) => {
      queryClient.setQueryData(QUERY_KEYS.nodeOperatorProfile, profile);
      // The account holder name is only ever known once Paystack has
      // resolved it as part of this same save — there's no separate
      // preview/verify route per docs/API.md, so this toast is the
      // first moment the operator actually sees the resolved name.
      showNotification({
        type: "success",
        title: "Payout account saved",
        message: profile.payoutAccountName
          ? `Verified as ${profile.payoutAccountName}.`
          : "Your payout account is on file.",
      });
    },
    onError: (error) => {
      showNotification({
        type: "error",
        title: "Couldn't save payout account",
        message: getErrorMessage(error),
      });
    },
  });

  return {
    profile: profileQuery.data,
    isLoadingProfile: profileQuery.isLoading,
    notOnboarded,
    profileError: notOnboarded ? null : profileQuery.error,

    onboard: onboardMutation.mutate,
    isOnboarding: onboardMutation.isPending,
    onboardError: onboardMutation.error,

    banks: banksQuery.data ?? [],
    isLoadingBanks: banksQuery.isLoading,

    setPayoutAccount: payoutAccountMutation.mutate,
    isSettingPayoutAccount: payoutAccountMutation.isPending,
    payoutAccountError: payoutAccountMutation.error,
    payoutAccountSaved: payoutAccountMutation.isSuccess,
  };
}
