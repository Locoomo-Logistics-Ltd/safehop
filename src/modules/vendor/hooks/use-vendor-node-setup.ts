"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vendorService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { isApiError } from "@/core/api/errors";
import type { NodeOperatorOnboardingPayload } from "@/core/types";

/**
 * Drives the Vendor's Node self-onboarding step:
 * `GET /node-operators/me` to check whether setup + approval is done,
 * `POST /node-operators/onboarding` to submit it. Real, confirmed
 * routes per docs/API.md — distinct from `useVendorNode`, which reads
 * an already-approved Node's live dashboard/inventory data.
 *
 * `GET /node-operators/me` returns `404 NOT_FOUND` when onboarding
 * hasn't happened yet — that's an expected state, not a fetch
 * failure, so it's surfaced separately as `notOnboarded` rather than
 * folded into `profileError`.
 */
export function useVendorNodeSetup() {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: QUERY_KEYS.vendorNodeOperatorProfile,
    queryFn: () => vendorService.getMyNodeOperatorProfile(),
    retry: false,
  });

  const notOnboarded = isApiError(profileQuery.error) && profileQuery.error.code === "NOT_FOUND";

  const onboardMutation = useMutation({
    mutationFn: (payload: NodeOperatorOnboardingPayload) => vendorService.onboardNode(payload),
    onSuccess: (profile) => {
      queryClient.setQueryData(QUERY_KEYS.vendorNodeOperatorProfile, profile);
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
  };
}
