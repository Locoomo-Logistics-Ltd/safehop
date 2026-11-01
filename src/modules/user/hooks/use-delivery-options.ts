"use client";

import { useQuery } from "@tanstack/react-query";
import { deliveryService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import type { DeliveryOptions } from "@/core/types";

/** Used until `GET /delivery-options` answers (or if it can't) — the documented API bounds, so the form is never blocked on it. */
export const FALLBACK_DELIVERY_OPTIONS: Pick<DeliveryOptions, "handlingFlags" | "limits"> = {
  handlingFlags: ["fragile", "keep_upright", "perishable", "liquid"],
  limits: {
    weightKg: { min: 0.1, max: 1000, decimals: 1 },
    dimensionCm: { min: 1, max: 500 },
  },
};

/** `GET /delivery-options` — values change only when an Admin edits vehicle rules, so cache for the session. */
export function useDeliveryOptions() {
  const query = useQuery({
    queryKey: QUERY_KEYS.deliveryOptions,
    queryFn: () => deliveryService.getDeliveryOptions(),
    staleTime: Infinity,
  });

  return {
    options: query.data,
    limits: query.data?.limits ?? FALLBACK_DELIVERY_OPTIONS.limits,
    handlingFlags: query.data?.handlingFlags ?? FALLBACK_DELIVERY_OPTIONS.handlingFlags,
    vehicles: query.data?.vehicles ?? [],
  };
}
