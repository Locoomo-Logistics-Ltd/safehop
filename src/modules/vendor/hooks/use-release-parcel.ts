"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { useGeolocation } from "@/hooks/use-geolocation";

const MAX_ATTEMPTS = 3;

/**
 * Drives the "Release Parcel" (OTP verification) screen: sending the
 * code to the recipient, then verifying + releasing, with a 3-attempt
 * limit matching the Figma "Attempt 1 of 3" indicator.
 *
 * The real API's release call also needs the vendor's live GPS
 * position and the parcel's qrNonce (issued when the order was
 * booked) — pass the loaded parcel's `qrNonce` field in here.
 */
export function useReleaseParcel(parcelId: string, qrNonce?: string) {
  const queryClient = useQueryClient();
  const { position } = useGeolocation();
  const [attemptsUsed, setAttemptsUsed] = useState(0);

  const sendOtpMutation = useMutation({
    mutationFn: () => vendorService.sendReleaseOtp(parcelId),
  });

  const releaseMutation = useMutation({
    mutationFn: (otpCode: string) =>
      vendorService.releaseParcel(parcelId, otpCode, position ?? undefined, qrNonce),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vendorParcels });
    },
    onError: () => {
      setAttemptsUsed((n) => n + 1);
    },
  });

  const attemptsRemaining = Math.max(0, MAX_ATTEMPTS - attemptsUsed);
  const isLocked = attemptsRemaining === 0 && releaseMutation.isError;

  return {
    sendOtp: sendOtpMutation.mutate,
    isSendingOtp: sendOtpMutation.isPending,
    otpSent: sendOtpMutation.isSuccess,

    verifyAndRelease: releaseMutation.mutate,
    isReleasing: releaseMutation.isPending,
    releaseError: releaseMutation.error,
    isReleased: releaseMutation.isSuccess,

    attemptsRemaining,
    isLocked,
  };
}
