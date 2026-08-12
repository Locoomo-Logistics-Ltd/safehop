"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { deliveryService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";

const POLL_INTERVAL_MS = 2500;
const MAX_POLL_ATTEMPTS = 36; // ~90s — comfortably past normal card/webhook latency without polling forever

/**
 * Polls `GET /payments/intents/:id` after the Paystack redirect lands
 * on `/orders/payment-callback`, until `status` leaves `"pending"`
 * (or the poll window times out). No client-side "confirm payment"
 * call exists per docs/API.md — only the server-to-server webhook
 * actually flips the intent's status.
 */
export function usePaymentIntentStatus(intentId: string | null) {
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const attemptsRef = useRef(0);

  const query = useQuery({
    queryKey: intentId ? QUERY_KEYS.paymentIntent(intentId) : ["payment-intent", "none"],
    queryFn: () => deliveryService.getPaymentIntent(intentId!),
    enabled: !!intentId,
    refetchInterval: (q) => {
      const data = q.state.data;
      if (!data || data.status !== "pending") return false;
      attemptsRef.current += 1;
      if (attemptsRef.current >= MAX_POLL_ATTEMPTS) {
        setHasTimedOut(true);
        return false;
      }
      return POLL_INTERVAL_MS;
    },
  });

  return {
    intent: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    hasTimedOut,
  };
}
