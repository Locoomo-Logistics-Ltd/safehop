"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { riderService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { isApiError } from "@/core/api/errors";
import type { RiderVerificationDocumentType } from "@/core/types";

interface SubmitVerificationArgs {
  currentEmployer: string;
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
 * `profileError` (same pattern as `useVendorNodeSetup`).
 */
export function useRiderVerification() {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: QUERY_KEYS.riderVerification,
    queryFn: () => riderService.getVerificationProfile(),
    retry: false,
  });

  const notStarted = isApiError(profileQuery.error) && profileQuery.error.code === "NOT_FOUND";

  const submitMutation = useMutation({
    mutationFn: async ({ currentEmployer, documentType, file }: SubmitVerificationArgs) => {
      const uploadSignature = await riderService.getVerificationUploadSignature(documentType);
      const cloudinaryPublicId = await riderService.uploadVerificationDocument(
        uploadSignature,
        file
      );
      return riderService.submitVerification({
        currentEmployer,
        documentType,
        cloudinaryPublicId,
      });
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(QUERY_KEYS.riderVerification, profile);
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
  };
}
