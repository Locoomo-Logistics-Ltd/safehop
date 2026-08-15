"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { useNodeParcelsStore } from "@/store/node-parcels.store";

/**
 * `POST /handoffs/orders/:id/intake` — the operator confirming a parcel
 * a rider just handed over is physically on their counter.
 *
 * Two things about this step aren't obvious from the endpoint name:
 *
 * 1. **It's what emails the receiver.** The server mints the 6-digit
 *    collection code here and sends it. Until intake runs, the receiver
 *    has been told nothing and `resend` has nothing to resend
 *    (`409 ORDER_NOT_READY_FOR_COLLECTION`). So this isn't bookkeeping
 *    that can be deferred to end of shift — deferring it strands the
 *    receiver.
 * 2. **The operator never sees the code**, then or later. It exists only
 *    in the receiver's inbox.
 *
 * Idempotent server-side, so a double-tap is safe.
 */
export function useParcelIntake() {
  const queryClient = useQueryClient();
  const markIntakeDone = useNodeParcelsStore((s) => s.markIntakeDone);

  const mutation = useMutation({
    mutationFn: (orderId: string) => vendorService.confirmIntake(orderId),
    onSuccess: (summary) => {
      markIntakeDone(summary.id);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vendorParcels });
    },
  });

  return {
    confirmIntake: mutation.mutate,
    isConfirmingIntake: mutation.isPending,
    intakeError: mutation.error,
    intakeResult: mutation.data,
    isIntakeDone: mutation.isSuccess,
    resetIntake: mutation.reset,
  };
}
