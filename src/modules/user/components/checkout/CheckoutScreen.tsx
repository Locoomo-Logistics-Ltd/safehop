"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button, ProgressSteps } from "@/components/ui";
import { TopBar } from "@/components/layout";
import { useDeliveryDraftStore } from "@/store/delivery-draft.store";
import { useNodes } from "@/modules/user/hooks/use-nodes";
import { useCheckout } from "@/modules/user/hooks/use-checkout";
import { getErrorMessage } from "@/core/api/errors";
import { formatCurrency } from "@/lib/format";
import { ROUTES } from "@/core/config/constants";
import { toOrderParcelSize } from "@/core/types";
import { OrderSummaryCard } from "./OrderSummaryCard";

const PARCEL_SIZE_LABELS: Record<string, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  xl: "XL",
};

/**
 * Step 4 of the New Delivery flow: create the real payment intent
 * (`POST /payments/intents` — fee calc + capacity reservation +
 * Paystack checkout URL, all in one call, per docs/API.md), review the
 * fee it returns, then redirect to Paystack to actually pay.
 *
 * Rebuilt 2026-08-12 — the previous version called an undocumented
 * calculate-then-book flow and never collected real payment
 * (`deliveryService.pay()` was a no-op). There is no in-app payment
 * method picker anymore — Paystack's own hosted checkout page presents
 * card/bank/USSD/transfer, the real API has no such field to send.
 */
export function CheckoutScreen() {
  const router = useRouter();
  const draft = useDeliveryDraftStore();
  const { nodes } = useNodes();
  const { createIntent, intent, isCreating, createError, redirectToPaystack } = useCheckout();
  const hasRequestedIntent = useRef(false);

  const isDraftComplete =
    !!draft.receiver && !!draft.parcel && !!draft.destinationNodeId && !!draft.originNodeId && !!draft.method;

  // Redirect back if the draft is incomplete (e.g. direct navigation or refresh).
  useEffect(() => {
    if (!isDraftComplete) {
      router.replace(ROUTES.newDelivery);
    }
  }, [isDraftComplete, router]);

  // Create the payment intent exactly once per Checkout visit — it
  // reserves the origin Node's capacity for ~15 minutes the instant it
  // succeeds, so this must not fire more than once (e.g. on re-render
  // or React Strict Mode's double-invoke).
  useEffect(() => {
    if (!isDraftComplete || hasRequestedIntent.current) return;
    hasRequestedIntent.current = true;
    createIntent({
      originNodeId: draft.originNodeId!,
      destinationNodeId: draft.destinationNodeId!,
      receiverFullName: draft.receiver!.fullName,
      receiverEmail: draft.receiver!.email,
      receiverPhone: draft.receiver!.phone,
      parcelDescription: draft.parcel!.description,
      parcelSize: toOrderParcelSize(draft.parcel!.size),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDraftComplete]);

  if (!isDraftComplete) {
    return null;
  }

  const originNode = nodes.find((n) => n.id === draft.originNodeId);
  const destinationNode = nodes.find((n) => n.id === draft.destinationNodeId);

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="Checkout" showBack />

      <div className="px-4 md:px-6 pt-2 md:pt-6 pb-28 max-w-130 mx-auto">
        <div className="hidden md:block mb-6">
          <h1 className="font-display text-[22px] font-bold text-text-primary">Checkout</h1>
          <p className="text-[14px] text-text-secondary mt-1">
            Think of Locoomo as Uber for logistics
          </p>
        </div>

        <ProgressSteps total={4} current={4} className="mb-6" />

        <div className="flex flex-col gap-5">
          {isCreating || (!intent && !createError) ? (
            <div className="rounded-[16px] border border-border-default bg-bg-card p-6 text-center">
              <p className="text-[13px] text-text-muted">Calculating your delivery fee…</p>
            </div>
          ) : createError || !intent ? (
            <div className="rounded-[16px] border border-status-danger bg-status-danger-bg p-4 text-center">
              <p className="text-[13px] font-medium text-status-danger">{getErrorMessage(createError)}</p>
            </div>
          ) : (
            <OrderSummaryCard
              originLabel={originNode?.name ?? "Pickup Station"}
              destinationLabel={destinationNode?.name ?? "Destination Station"}
              itemDescription={draft.parcel!.description}
              parcelSizeLabel={PARCEL_SIZE_LABELS[draft.parcel!.size] ?? draft.parcel!.size}
              feeBreakdown={intent.feeBreakdown}
              amountKobo={intent.amountKobo}
            />
          )}

          {intent && (
            <p className="text-[12px] text-text-muted text-center leading-[1.6]">
              You&apos;ll choose how to pay (card, bank transfer, or USSD) on the next screen, hosted securely by
              Paystack.
            </p>
          )}
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-[var(--bottom-nav-height)] md:bottom-0 left-0 right-0 md:left-[260px] p-4 bg-bg-canvas border-t border-border-default">
        <div className="max-w-[520px] mx-auto">
          <Button fullWidth size="lg" disabled={!intent} onClick={redirectToPaystack}>
            {intent ? `Confirm & Pay ${formatCurrency(intent.amountKobo / 100)}` : "Confirm & Pay"}
          </Button>
        </div>
      </div>
    </div>
  );
}
