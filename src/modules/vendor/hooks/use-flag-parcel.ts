"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { vendorService } from "@/core/api/services";
import { QUERY_KEYS, ROUTES } from "@/core/config/constants";
import type { FlagParcelPayload } from "@/core/types";

/** Submits a flagged parcel issue to admin, then returns to the dashboard. */
export function useFlagParcel() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: FlagParcelPayload) => vendorService.flagParcel(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vendorActivity });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vendorParcels });
      router.push(ROUTES.vendorHome);
    },
  });

  return {
    submitFlag: mutation.mutate,
    isSubmitting: mutation.isPending,
    error: mutation.error,
  };
}
