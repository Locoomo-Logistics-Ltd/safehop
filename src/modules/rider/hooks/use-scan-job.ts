"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { riderService } from "@/core/api/services";
import { QUERY_KEYS, ROUTES } from "@/core/config/constants";
import { useGeolocation } from "@/hooks/use-geolocation";
import { decodeQrPayload } from "@/core/types";

/**
 * Drives the two QR-scan moments in a rider's job: scanning the
 * parcel at pickup (advances the stepper to "Transit") and scanning
 * at dropoff (completes the job, routes to the Delivery Complete
 * screen).
 *
 * The real API requires the rider's live GPS position on every scan,
 * plus a cryptographic qrNonce decoded from the scanned QR payload
 * (see core/types/delivery.types.ts's decodeQrPayload — confirm the
 * exact QR encoding convention with the backend team).
 */
export function useScanJob(jobId: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { position } = useGeolocation();

  const pickupMutation = useMutation({
    mutationFn: (rawScannedValue: string) => {
      const decoded = decodeQrPayload(rawScannedValue);
      const qrNonce = decoded?.qrNonce ?? rawScannedValue; // mock mode: raw value IS the code
      return riderService.scanPickup(jobId, qrNonce, position ?? undefined);
    },
    onSuccess: (job) => {
      queryClient.setQueryData(QUERY_KEYS.riderActiveJob, job);
    },
  });

  const dropoffMutation = useMutation({
    mutationFn: (rawScannedValue: string) => {
      const decoded = decodeQrPayload(rawScannedValue);
      const qrNonce = decoded?.qrNonce ?? rawScannedValue;
      return riderService.scanDropoff(jobId, qrNonce, position ?? undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.riderActiveJob });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.riderEarnings });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.riderJobHistory });
      router.push(ROUTES.riderDeliveryComplete(jobId));
    },
  });

  return {
    scanPickup: pickupMutation.mutate,
    isScanningPickup: pickupMutation.isPending,
    pickupError: pickupMutation.error,
    resetPickupError: pickupMutation.reset,

    scanDropoff: dropoffMutation.mutate,
    isScanningDropoff: dropoffMutation.isPending,
    dropoffError: dropoffMutation.error,
  };
}
