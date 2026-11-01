"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui";
import { CheckCircleIcon } from "@/components/icons";
import { deliveryService } from "@/core/api/services";
import { ROUTES, STORAGE_KEYS } from "@/core/config/constants";
import { usePaymentIntentStatus } from "@/modules/user/hooks/use-payment-intent-status";
import { useDeliveryDraftStore } from "@/store/delivery-draft.store";

/**
 * Where Paystack redirects after checkout
 * (`{FRONTEND_URL}/orders/payment-callback?reference=<intentId>`, per
 * docs/LOGISTICS_API.md §4.1 — `trxref` carries the same value). The
 * intent id comes from `reference`; the sessionStorage copy `useCheckout`
 * leaves is only a fallback for a URL that lost its query. The redirect itself is UI-only and doesn't mean
 * payment succeeded — only the server-to-server webhook confirms that
 * — so this screen polls `GET /payments/intents/:id` until `status`
 * leaves `"pending"`, then looks up the resulting Order (there's no
 * "get order by payment intent id" route, so it scans the Consumer's
 * own `GET /orders` for a matching `paymentIntentId`) and forwards to
 * the success screen.
 *
 * **Two flows land here** (2026-09-03). A Node dispatch
 * (`POST /node-operators/nodes/:nodeId/dispatch`) redirects to the same
 * Paystack checkout and back to this same URL — but neither endpoint
 * above admits a NodeOperator/NodeStaff session, so the polling path is
 * skipped entirely for it. That's a real backend gap, not a shortcut:
 * there is no operator-side way to watch an intent settle. The dispatch
 * branch says where the parcel will show up instead (`GET
 * /handoffs/my-node/orders` does admit them, and the dashboard's
 * "Expected" tab reads it), which the operator can go and verify.
 */
export function PaymentCallbackScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetDraft = useDeliveryDraftStore((s) => s.reset);
  const referenceParam = searchParams.get("reference") ?? searchParams.get("trxref");
  const [intentId] = useState<string | null>(() => {
    if (referenceParam) return referenceParam;
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(STORAGE_KEYS.pendingPaymentIntentId);
  });

  // Was this checkout a Node dispatch rather than a Consumer booking?
  // Read once on mount, before the cleanup below can clear it.
  const [isDispatch] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(STORAGE_KEYS.pendingDispatch) === "1";
  });

  // A dispatching operator can poll nothing here: both `GET
  // /payments/intents/:id` and `GET /orders` are Consumer-only per
  // docs/API.md, so this screen would just collect 403s on their
  // session. Disable the poll entirely for that case and tell them
  // where the parcel will actually appear — which is true and
  // checkable — rather than spinning on a request that can't succeed.
  const { intent, isLoading, hasTimedOut } = usePaymentIntentStatus(
    isDispatch ? null : intentId
  );

  useEffect(() => {
    if (!isDispatch) return;
    sessionStorage.removeItem(STORAGE_KEYS.pendingPaymentIntentId);
    sessionStorage.removeItem(STORAGE_KEYS.pendingDispatch);
  }, [isDispatch]);

  // The intent doesn't carry the order id, and the order can land a beat
  // after the intent flips to `paid` — so keep looking for a short while
  // instead of showing "Finalizing…" forever.
  const shouldLookUpOrder = intent?.status === "paid";
  const [orderLookupTimedOut, setOrderLookupTimedOut] = useState(false);
  useEffect(() => {
    if (!shouldLookUpOrder) return;
    const timer = setTimeout(() => setOrderLookupTimedOut(true), 30_000);
    return () => clearTimeout(timer);
  }, [shouldLookUpOrder]);

  const orderQuery = useQuery({
    queryKey: ["orders-for-intent", intentId],
    queryFn: () => deliveryService.findOrderByPaymentIntent(intentId!),
    enabled: shouldLookUpOrder,
    refetchInterval: (q) => (q.state.data || orderLookupTimedOut ? false : 2000),
  });
  const matchedOrder = orderQuery.data;

  useEffect(() => {
    if (matchedOrder) {
      sessionStorage.removeItem(STORAGE_KEYS.pendingPaymentIntentId);
      // The sender has paid; the draft must not leak into the next delivery.
      resetDraft();
      router.replace(ROUTES.orderSuccess(matchedOrder.id));
    }
  }, [matchedOrder, router, resetDraft]);

  if (isDispatch) {
    return (
      <CenteredMessage
        title="Payment submitted"
        description="Once it clears, your parcel appears under To receive on your dashboard — confirm the drop-off there to release it to a courier. It usually takes a few seconds."
        action={
          <Link href={ROUTES.nodeHome}>
            <Button size="lg">Go to Dashboard</Button>
          </Link>
        }
      />
    );
  }

  if (intentId === null) {
    return (
      <CenteredMessage
        title="We couldn't find your payment"
        description="This link didn't come from a Locoomo checkout, or your browser cleared it. Check Track to see if your order went through."
        action={
          <Link href={ROUTES.trackList}>
            <Button size="lg">Go to Track</Button>
          </Link>
        }
      />
    );
  }

  if (isLoading || (!intent && !hasTimedOut)) {
    return <CenteredSpinner label="Confirming your payment…" />;
  }

  if (intent?.status === "paid") {
    if (!matchedOrder && orderLookupTimedOut) {
      return (
        <CenteredMessage
          title="Payment received"
          description="Your order is still being set up. It will appear under Track in a moment."
          action={
            <Link href={ROUTES.trackList}>
              <Button size="lg">Go to Track</Button>
            </Link>
          }
        />
      );
    }
    return <CenteredSpinner label={orderQuery.isLoading ? "Finding your order…" : "Finalizing your order…"} />;
  }

  if (intent?.status === "failed") {
    return (
      <CenteredMessage
        title="Payment didn't go through"
        description="No charge was made. You can try again with the same details."
        action={
          <Link href={ROUTES.checkout}>
            <Button size="lg">Try Again</Button>
          </Link>
        }
      />
    );
  }

  if (intent?.status === "expired") {
    return (
      <CenteredMessage
        title="Your checkout timed out"
        description="Your ~15 minute hold on the drop-off station lapsed before payment completed. Start again to get a fresh slot."
        action={
          <Link href={ROUTES.checkout}>
            <Button size="lg">Start Again</Button>
          </Link>
        }
      />
    );
  }

  // hasTimedOut, still "pending" after the poll window
  return (
    <CenteredMessage
      title="Still processing"
      description="This is taking longer than usual. Check Track in a few minutes — your payment may still be confirming."
      action={
        <Link href={ROUTES.trackList}>
          <Button size="lg">Go to Track</Button>
        </Link>
      }
    />
  );
}

function CenteredSpinner({ label }: { label?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-canvas gap-4">
      <div className="w-8 h-8 rounded-full border-2 border-border-default border-t-brand-blue animate-spin" />
      {label && <p className="text-[13px] text-text-secondary">{label}</p>}
    </div>
  );
}

function CenteredMessage({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-canvas px-6 text-center gap-5">
      <div className="w-16 h-16 rounded-full bg-status-info-bg text-brand-blue flex items-center justify-center">
        <CheckCircleIcon size={28} />
      </div>
      <div>
        <h1 className="font-display text-[18px] font-bold text-text-primary mb-1.5">{title}</h1>
        <p className="text-[13px] text-text-secondary max-w-[320px] leading-[1.6]">{description}</p>
      </div>
      {action}
    </div>
  );
}
