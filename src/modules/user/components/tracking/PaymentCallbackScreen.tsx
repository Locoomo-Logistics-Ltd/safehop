"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui";
import { CheckCircleIcon } from "@/components/icons";
import { deliveryService } from "@/core/api/services";
import { ROUTES, STORAGE_KEYS } from "@/core/config/constants";
import { usePaymentIntentStatus } from "@/modules/user/hooks/use-payment-intent-status";

/**
 * Where Paystack redirects after checkout (`{FRONTEND_URL}/orders/payment-callback`,
 * per docs/API.md). The redirect itself is UI-only and doesn't mean
 * payment succeeded — only the server-to-server webhook confirms that
 * — so this screen polls `GET /payments/intents/:id` until `status`
 * leaves `"pending"`, then looks up the resulting Order (there's no
 * "get order by payment intent id" route, so it scans the Consumer's
 * own `GET /orders` for a matching `paymentIntentId`) and forwards to
 * the success screen.
 */
export function PaymentCallbackScreen() {
  const router = useRouter();
  const [intentId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(STORAGE_KEYS.pendingPaymentIntentId);
  });

  const { intent, isLoading, hasTimedOut } = usePaymentIntentStatus(intentId);

  const shouldLookUpOrder = intent?.status === "paid";
  const orderQuery = useQuery({
    queryKey: ["orders-for-intent", intentId],
    queryFn: () => deliveryService.list(),
    enabled: shouldLookUpOrder,
  });
  const matchedOrder = orderQuery.data?.find((o) => o.paymentIntentId === intentId);

  useEffect(() => {
    if (matchedOrder) {
      sessionStorage.removeItem(STORAGE_KEYS.pendingPaymentIntentId);
      router.replace(ROUTES.orderSuccess(matchedOrder.id));
    }
  }, [matchedOrder, router]);

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
        title="This checkout session expired"
        description="Your ~15 minute reservation lapsed before payment completed. Start again to reserve a fresh slot."
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
