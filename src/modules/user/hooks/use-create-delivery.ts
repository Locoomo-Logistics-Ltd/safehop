"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { deliveryService } from "@/core/api/services";
import { QUERY_KEYS, ROUTES } from "@/core/config/constants";
import { useDeliveryDraftStore } from "@/store/delivery-draft.store";
import type { CreateDeliveryDraft, PaymentMethod } from "@/core/types";

/**
 * Drives the final two steps of the New Delivery flow: creating the
 * draft delivery (on entering Checkout) and paying for it (on
 * confirming payment) — then routes to the success screen.
 */
export function useCreateDelivery() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const resetDraft = useDeliveryDraftStore((s) => s.reset);

  const createMutation = useMutation({
    mutationFn: (draft: CreateDeliveryDraft) => deliveryService.create(draft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.deliveries });
    },
  });

  const payMutation = useMutation({
    mutationFn: ({ id, method }: { id: string; method: PaymentMethod }) =>
      deliveryService.pay(id, method),
    onSuccess: (delivery) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.deliveries });
      resetDraft();
      router.push(ROUTES.orderSuccess(delivery.id));
    },
  });

  return {
    createDelivery: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    pay: payMutation.mutate,
    isPaying: payMutation.isPending,
    payError: payMutation.error,
  };
}
