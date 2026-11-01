"use client";

import { useMutation } from "@tanstack/react-query";
import { deliveryService } from "@/core/api/services";
import { STORAGE_KEYS } from "@/core/config/constants";
import { isSafePaymentUrl } from "@/lib/safe-url";
import type { CreatePaymentIntentPayload } from "@/core/types";

/**
 * "Pay" — `POST /payments/intents`, then straight to Paystack.
 *
 * Creating the intent is the step that reserves the origin Node's
 * capacity for ~15 minutes, so it only happens on the sender's tap, never
 * on screen load (the price comes from `useDeliveryQuote`, which reserves
 * nothing). Paystack sends the browser back to
 * `/orders/payment-callback?reference=<intentId>`; the id is also kept in
 * sessionStorage as a fallback for a callback URL that lost its query.
 */
export function useCheckout() {
  const mutation = useMutation({
    mutationFn: (payload: CreatePaymentIntentPayload) => deliveryService.createPaymentIntent(payload),
    onSuccess: (intent) => {
      // Never navigate to anything but Paystack's hosted checkout.
      if (!isSafePaymentUrl(intent.authorizationUrl)) {
        throw new Error("We couldn't open the payment page safely. Please try again.");
      }
      sessionStorage.setItem(STORAGE_KEYS.pendingPaymentIntentId, intent.id);
      window.location.href = intent.authorizationUrl;
    },
  });

  return {
    pay: mutation.mutate,
    // Stays true after success: the page is navigating away to Paystack,
    // and re-enabling the button in that gap invites a second intent.
    isPaying: mutation.isPending || mutation.isSuccess,
    payError: mutation.error,
    resetPayError: mutation.reset,
  };
}
