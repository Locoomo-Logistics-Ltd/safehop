"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ProgressSteps } from "@/components/ui";
import { TopBar } from "@/components/layout";
import { useDeliveryDraftStore } from "@/store/delivery-draft.store";
import { useNodes } from "@/modules/user/hooks/use-nodes";
import { useCreateDelivery } from "@/modules/user/hooks/use-create-delivery";
import { useFareQuote } from "@/modules/user/hooks/use-fare-quote";
import { getErrorMessage } from "@/core/api/errors";
import { ROUTES } from "@/core/config/constants";
import type { PaymentMethod } from "@/core/types";
import { OrderSummaryCard } from "./OrderSummaryCard";
import { PaymentMethodSelector } from "./PaymentMethodSelector";

const METHOD_LABELS: Record<string, string> = {
  drop_and_pick: "Drop & Pick",
  express: "Express Delivery",
};

/**
 * Step 4 of the New Delivery flow: review a real, server-calculated
 * fare, choose a payment method, then create + pay for the delivery.
 * On success, routes to the order success screen.
 */
export function CheckoutScreen() {
  const router = useRouter();
  const draft = useDeliveryDraftStore();
  const { nodes } = useNodes();
  const { createDelivery, isCreating, pay, isPaying, payError } = useCreateDelivery();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("alat_pay");
  const [pendingDeliveryId, setPendingDeliveryId] = useState<string | null>(null);

  const isDraftComplete =
    !!draft.receiver && !!draft.parcel && !!draft.destinationAddress && !!draft.originNodeId && !!draft.method;

  // Redirect back if the draft is incomplete (e.g. direct navigation or refresh).
  useEffect(() => {
    if (!isDraftComplete) {
      router.replace(ROUTES.newDelivery);
    }
  }, [isDraftComplete, router]);

  const { quote, isLoading: isQuoteLoading, isError: isQuoteError } = useFareQuote({
    originNodeId: draft.originNodeId,
    destinationAddress: draft.destinationAddress,
    parcel: draft.parcel,
    method: draft.method,
  });

  if (!isDraftComplete) {
    return null;
  }

  const originNode = nodes.find((n) => n.id === draft.originNodeId);

  const handleConfirmAndPay = async () => {
    if (!quote) return;
    let deliveryId = pendingDeliveryId;

    if (!deliveryId) {
      const created = await createDelivery({
        receiver: draft.receiver!,
        parcel: draft.parcel!,
        destinationAddress: draft.destinationAddress!,
        originNodeId: draft.originNodeId!,
        method: draft.method!,
      });
      deliveryId = created.id;
      setPendingDeliveryId(created.id);
    }

    pay({ id: deliveryId, method: paymentMethod });
  };

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
          {isQuoteLoading ? (
            <div className="rounded-[16px] border border-border-default bg-bg-card p-6 text-center">
              <p className="text-[13px] text-text-muted">Calculating your delivery fee…</p>
            </div>
          ) : isQuoteError || !quote ? (
            <div className="rounded-[16px] border border-status-danger bg-status-danger-bg p-4 text-center">
              <p className="text-[13px] font-medium text-status-danger">
                Couldn&apos;t calculate the delivery fee. Please go back and try again.
              </p>
            </div>
          ) : (
            <OrderSummaryCard
              originLabel={originNode?.name ?? "Pickup Station"}
              destinationLabel={draft.destinationAddress!}
              itemDescription={draft.parcel!.description}
              deliveryTypeLabel={METHOD_LABELS[draft.method!] ?? draft.method!}
              quote={quote}
            />
          )}

          <div>
            <p className="font-semibold text-[15px] text-text-primary mb-3">
              Choose payment method
            </p>
            <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
          </div>

          {payError && (
            <p className="text-[13px] text-status-danger" role="alert">
              {getErrorMessage(payError)}
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
            disabled={!quote || isQuoteLoading}
            isLoading={isCreating || isPaying}
            onClick={handleConfirmAndPay}
          >
            {quote ? `Confirm & Pay ${formatTotal(quote.total)}` : "Confirm & Pay"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatTotal(total: number): string {
  return `₦${total.toLocaleString("en-NG")}`;
}
