"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { vendorService } from "@/core/api/services";
import { QUERY_KEYS, ROUTES } from "@/core/config/constants";
import { useGeolocation } from "@/hooks/use-geolocation";
import { decodeQrPayload } from "@/core/types";

/**
 * Drives the QR Scanner → Scan Success flow. The real API checks a
 * parcel in atomically from the scanned QR (trackingCode + qrNonce)
 * plus the vendor's live GPS position — no separate lookup step, so
 * this decodes the scanned payload and checks in directly.
 */
export function useScanParcel() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { position } = useGeolocation();

  const mutation = useMutation({
    mutationFn: async (rawScannedValueOrCode: string) => {
      const decoded = decodeQrPayload(rawScannedValueOrCode);
      const trackingCode = decoded?.trackingCode ?? rawScannedValueOrCode; // mock/manual-entry: raw value IS the code
      const qrNonce = decoded?.qrNonce;
      return vendorService.checkIn(trackingCode, position ?? undefined, qrNonce);
    },
    onSuccess: (parcel) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vendorParcels });
      router.push(ROUTES.vendorScanSuccess(parcel.id));
    },
  });

  return {
    lookupAndCheckIn: mutation.mutate,
    isProcessing: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
