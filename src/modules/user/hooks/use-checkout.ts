"use client";

import { useMutation } from "@tanstack/react-query";
import { deliveryService } from "@/core/api/services";
import { STORAGE_KEYS } from "@/core/config/constants";
import type { CreatePaymentIntentPayload } from "@/core/types";

/**
 * Drives Checkout's single real step: `POST /payments/intents`. Unlike
 * the old calculate-then-book flow, there's no separate fare preview —
 * creating the intent atomically calculates the fee, reserves the
 * origin Node's capacity for ~15 minutes, and returns both the fee
 * breakdown and a Paystack `authorizationUrl` in one response. The
 * screen calls this once, shows the returned fee breakdown, and
 * "Confirm & Pay" redirects the browser to `authorizationUrl` — no
 * further API call happens client-side until the Paystack redirect
 * lands on `/orders/payment-callback`.
 */
export function useCheckout() {
  const mutation = useMutation({
    mutationFn: (payload: CreatePaymentIntentPayload) => deliveryService.createPaymentIntent(payload),
  });

  const redirectToPaystack = () => {
    const intent = mutation.data;
    if (!intent?.authorizationUrl) return;
    // The callback screen has no reliable way to recover the intent id
    // from Paystack's redirect query string (docs/API.md doesn't
    // document its shape) — stash it here instead.
    sessionStorage.setItem(STORAGE_KEYS.pendingPaymentIntentId, intent.id);
    window.location.href = intent.authorizationUrl;
  };

  return {
    createIntent: mutation.mutate,
    intent: mutation.data,
    isCreating: mutation.isPending,
    isIdle: mutation.isIdle,
    createError: mutation.error,
    redirectToPaystack,
  };
}
