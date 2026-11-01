"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ProgressSteps } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { TopBar } from "@/components/layout";
import { useDeliveryDraftStore } from "@/store/delivery-draft.store";
import { useNodes } from "@/modules/user/hooks/use-nodes";
import { useCheckout } from "@/modules/user/hooks/use-checkout";
import { useDeliveryQuote } from "@/modules/user/hooks/use-delivery-quote";
import { buildPaymentIntentPayload, buildQuoteRequest } from "@/modules/user/lib/delivery-payload";
import { getFriendlyError } from "@/core/api/errors";
import { formatCurrency } from "@/lib/format";
import { ROUTES } from "@/core/config/constants";
import { OrderSummaryCard } from "./OrderSummaryCard";

const PARCEL_SIZE_LABELS: Record<string, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  xl: "XL",
};

/**
 * Last step (3 of 3): review the price, then pay.
 *
 * The price comes from `POST /delivery-quotes`, which reserves nothing,
 * so opening this screen (or refreshing it) has no side effects. The
 * payment intent — which holds a slot at the origin Node for ~15 min —
 * is created only when the sender taps Pay (`useCheckout`), with the
 * same inputs, so the charge equals the quote. Paystack's hosted page
 * then collects card/transfer/USSD.
 */
export function CheckoutScreen() {
  const router = useRouter();
  const draft = useDeliveryDraftStore();
  const { nodes } = useNodes();
  const { pay, isPaying, payError, resetPayError } = useCheckout();

  const isDraftComplete =
    !!draft.receiver && !!draft.parcel && !!draft.destinationNodeId && !!draft.originNodeId;

  // Send them back if the draft is incomplete (direct navigation, refresh —
  // the draft lives in memory only).
  useEffect(() => {
    if (!isDraftComplete) router.replace(ROUTES.newDelivery);
  }, [isDraftComplete, router]);

  const quoteRequest = isDraftComplete
    ? buildQuoteRequest({
        originNodeId: draft.originNodeId!,
        destinationNodeId: draft.destinationNodeId!,
        parcel: draft.parcel!,
      })
    : null;
  const { quote, isLoading, isFetching, error: quoteError, isExpired, refetch } = useDeliveryQuote(quoteRequest);
  // Set when Pay found the price lapsed and fetched a fresh one instead.
  const [priceRefreshed, setPriceRefreshed] = useState(false);

  if (!isDraftComplete) return null;

  const originNode = nodes.find((n) => n.id === draft.originNodeId);
  const destinationNode = nodes.find((n) => n.id === draft.destinationNodeId);
  const { parcel } = draft;
  const hasDimensions = !!(parcel!.lengthCm && parcel!.widthCm && parcel!.heightCm);

  const handlePay = () => {
    // The price lapsed while the screen sat open — show the fresh one
    // first instead of charging something the sender hasn't seen.
    if (isExpired()) {
      setPriceRefreshed(true);
      void refetch();
      return;
    }
    setPriceRefreshed(false);
    resetPayError();
    pay(
      buildPaymentIntentPayload({
        originNodeId: draft.originNodeId!,
        destinationNodeId: draft.destinationNodeId!,
        receiver: draft.receiver!,
        parcel: parcel!,
      })
    );
  };

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="Checkout" showBack />

      <div className="px-4 md:px-6 pt-2 md:pt-6 pb-28 max-w-130 mx-auto">
        <div className="hidden md:block mb-6">
          <h1 className="font-display text-[22px] font-bold text-text-primary">Checkout</h1>
          <p className="text-[14px] text-text-secondary mt-1">Review your price, then pay securely</p>
        </div>

        <ProgressSteps total={3} current={3} className="mb-6" />

        <div className="flex flex-col gap-5">
          {isLoading ? (
            <div className="rounded-[16px] border border-border-default bg-bg-card p-6 text-center">
              <p className="text-[13px] text-text-muted">Calculating your delivery price…</p>
            </div>
          ) : quoteError || !quote ? (
            <div className="flex flex-col items-center gap-3">
              <ErrorAlert {...getFriendlyError(quoteError)} />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => router.push(ROUTES.newDelivery)}>
                  Change parcel details
                </Button>
                <Button variant="outline" size="sm" onClick={() => router.push(ROUTES.selectNodes)}>
                  Change stations
                </Button>
                <Button variant="outline" size="sm" onClick={() => void refetch()}>
                  Retry
                </Button>
              </div>
            </div>
          ) : (
            <OrderSummaryCard
              originLabel={originNode?.name ?? "Pickup Station"}
              destinationLabel={destinationNode?.name ?? "Destination Station"}
              itemDescription={parcel!.description}
              parcelSizeLabel={PARCEL_SIZE_LABELS[parcel!.size] ?? parcel!.size}
              weightKg={parcel!.weightKg}
              dimensionsLabel={
                hasDimensions ? `${parcel!.lengthCm} × ${parcel!.widthCm} × ${parcel!.heightCm} cm` : undefined
              }
              handling={parcel!.handling}
              vehicleClass={quote.vehicleClass}
              estimatedDeliveryMinutes={quote.estimatedDeliveryMinutes}
              feeBreakdown={quote.feeBreakdown}
              amountKobo={quote.amountKobo}
            />
          )}

          {quote && priceRefreshed && !isFetching && (
            <p className="text-[12.5px] text-status-warning text-center" role="status">
              Your price had expired, so we refreshed it. Check the total, then tap Pay.
            </p>
          )}

          {payError && <ErrorAlert {...getFriendlyError(payError)} />}

          {quote && !priceRefreshed && (
            <p className="text-[12px] text-text-muted text-center leading-[1.6]">
              You&apos;ll choose how to pay (card, bank transfer, or USSD) on the next screen, hosted securely by
              Paystack. Your slot at the drop-off station is held for about 15 minutes once you tap Pay.
            </p>
          )}
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-[var(--bottom-nav-height)] md:bottom-0 left-0 right-0 md:left-[260px] p-4 bg-bg-canvas border-t border-border-default">
        <div className="max-w-[520px] mx-auto">
          <Button
            fullWidth
            size="lg"
            disabled={!quote || isFetching}
            isLoading={isPaying}
            onClick={handlePay}
          >
            {quote ? `Confirm & Pay ${formatCurrency(quote.amountKobo / 100)}` : "Confirm & Pay"}
          </Button>
        </div>
      </div>
    </div>
  );
}
