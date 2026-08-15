"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { isApiError } from "@/core/api/errors";
import { useNodeParcelsStore } from "@/store/node-parcels.store";

/** Per docs/API.md: 5 wrong guesses lock a collection code out permanently. */
const MAX_CODE_ATTEMPTS = 5;

/**
 * The final step — the receiver reads out the code from their email and
 * the operator completes the collection.
 *
 * Note this deliberately does **not** mirror the old `useReleaseParcel`,
 * which auto-sent an OTP on mount. Here the code is minted and emailed
 * once, by `intake`; `resend` is a separate, explicit operator action
 * rate-limited at 5/min precisely because each call sends real email.
 * Firing it automatically would spam the receiver and burn the limit
 * before anyone had a reason to use it.
 *
 * `identityConfirmed` is passed straight through from what the operator
 * actually answered. Per docs/API.md it's an audit trail, not a gate —
 * `false` still completes the collection, because proxy pickup is normal
 * in this business. Defaulting it to `true` would quietly falsify the
 * one record it exists to create, so the screen makes it an explicit
 * choice with no default.
 */
export function useCollectParcel(orderId: string) {
  const queryClient = useQueryClient();
  const removeParcel = useNodeParcelsStore((s) => s.removeParcel);

  const [failedCodeAttempts, setFailedCodeAttempts] = useState(0);

  const collectMutation = useMutation({
    mutationFn: ({ code, identityConfirmed }: { code: string; identityConfirmed: boolean }) =>
      vendorService.collectParcel(orderId, { code, identityConfirmed }),
    onSuccess: () => {
      setFailedCodeAttempts(0);
      // The parcel has left the building — drop it from the counter list.
      removeParcel(orderId);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vendorParcels });
    },
    onError: (error) => {
      // Counted only to decide when to suggest a resend. The server owns
      // the real lockout, and this counter never gates the request.
      if (isApiError(error) && error.code === "INVALID_HANDOFF_CODE") {
        setFailedCodeAttempts((n) => n + 1);
      }
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => vendorService.resendCollectionCode(orderId),
    onSuccess: () => {
      // A fresh code supersedes the old one, including its lockout — the
      // receiver gets a clean slate, so the attempt counter resets too.
      setFailedCodeAttempts(0);
      collectMutation.reset();
    },
  });

  return {
    collect: collectMutation.mutate,
    isCollecting: collectMutation.isPending,
    collectError: collectMutation.error,
    collectedOrder: collectMutation.data,
    isCollected: collectMutation.isSuccess,

    resendCode: resendMutation.mutate,
    isResending: resendMutation.isPending,
    resendError: resendMutation.error,
    /** New expiry for the re-emailed code. The code itself is never in the response — see the service method. */
    resentExpiresAt: resendMutation.data?.expiresAt,
    didResend: resendMutation.isSuccess,

    failedCodeAttempts,
    /**
     * Advisory only. Attempts from another device count server-side too,
     * so this is a floor on "you should probably resend," never a
     * ceiling on what's permitted.
     */
    shouldResendCode: failedCodeAttempts >= MAX_CODE_ATTEMPTS,
  };
}
