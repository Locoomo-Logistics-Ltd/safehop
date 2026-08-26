"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { riderService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { getErrorMessage, isApiError } from "@/core/api/errors";
import { useNotificationStore } from "@/store/notification.store";
import type { PayoutAccountPayload, RiderVerificationDocumentType } from "@/core/types";

interface SubmitVerificationArgs {
  currentEmployer: string;
  /** Self-reported, 1-50 chars — added to docs/API.md 2026-08-17, no document check against it. */
  licenseNumber: string;
  documentType: RiderVerificationDocumentType;
  file: File;
}

/**
 * Drives the Rider's KYC verification step: `GET /riders/me` to check
 * whether verification has been started/approved,
 * `GET /riders/verification/upload-signature` +
 * `POST /riders/onboarding` to submit it. Real, confirmed routes per
 * docs/API.md — distinct from `riderOps.*`, which is the
 * already-approved Rider's live job-board/manifest data.
 *
 * `GET /riders/me` returns `404 NOT_FOUND` when verification hasn't
 * been started yet — that's an expected state, not a fetch failure,
 * so it's surfaced separately as `notStarted` rather than folded into
 * `profileError` (same pattern as `useNodeSetup`).
 */
export function useRiderVerification() {
  const queryClient = useQueryClient();
  const showNotification = useNotificationStore((s) => s.showNotification);

  const profileQuery = useQuery({
    queryKey: QUERY_KEYS.riderVerification,
    queryFn: () => riderService.getVerificationProfile(),
    retry: false,
  });

  const notStarted = isApiError(profileQuery.error) && profileQuery.error.code === "NOT_FOUND";

  const submitMutation = useMutation({
    mutationFn: async ({
      currentEmployer,
      licenseNumber,
      documentType,
      file,
    }: SubmitVerificationArgs) => {
      const uploadSignature = await riderService.getVerificationUploadSignature(documentType);
      const cloudinaryPublicId = await riderService.uploadVerificationDocument(
        uploadSignature,
        file
      );
      return riderService.submitVerification({
        currentEmployer,
        licenseNumber,
        documentType,
        cloudinaryPublicId,
      });
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(QUERY_KEYS.riderVerification, profile);
    },
  });

  const banksQuery = useQuery({
    queryKey: QUERY_KEYS.payoutBanks,
    queryFn: () => riderService.getPayoutBanks(),
    staleTime: Infinity,
  });

  const payoutAccountMutation = useMutation({
    mutationFn: (payload: PayoutAccountPayload) => riderService.setPayoutAccount(payload),
    onSuccess: (profile) => {
      queryClient.setQueryData(QUERY_KEYS.riderVerification, profile);
      // The account holder name is only ever known once Paystack has
      // resolved it as part of this same save — there's no separate
      // preview/verify route per docs/API.md, so this toast is the
      // first moment the rider actually sees the resolved name.
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
    notStarted,
    profileError: notStarted ? null : profileQuery.error,

    submitVerification: submitMutation.mutate,
    isSubmitting: submitMutation.isPending,
    submitError: submitMutation.error,

    banks: banksQuery.data ?? [],
    isLoadingBanks: banksQuery.isLoading,

    setPayoutAccount: payoutAccountMutation.mutate,
    isSettingPayoutAccount: payoutAccountMutation.isPending,
    payoutAccountError: payoutAccountMutation.error,
    payoutAccountSaved: payoutAccountMutation.isSuccess,
  };
}
