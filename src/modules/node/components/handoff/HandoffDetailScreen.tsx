"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, EmptyState, OtpInputBoxes, PinPad } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { TopBar } from "@/components/layout";
import { CheckCircleIcon, ArchiveIcon, MapPinIcon, AlertTriangleIcon } from "@/components/icons";
import { getFriendlyError } from "@/core/api/errors";
import { ROUTES } from "@/core/config/constants";
import { formatDate } from "@/lib/format";
import { HANDOFF_CODE_LENGTH, HANDOFF_STATUS } from "@/core/types";
import { useNodeOrder, isAwaitingPickup, isAwaitingArrival } from "@/modules/node/hooks/use-my-node-orders";
import { useConfirmHandoff } from "@/modules/node/hooks/use-confirm-handoff";
import { HandoffStatusPill } from "./HandoffStatusPill";

/**
 * Details page for one Awaiting Pickup / Awaiting Arrival order —
 * reached by tapping a row on Home. Shows every field
 * `GET /handoffs/my-node/orders` returns for this order (tracking
 * code, status, parcel description/size, origin/destination Node
 * names, `myRole`, placement date), plus the rider's 6-digit code
 * entry, reusing `useConfirmHandoff` — the exact same hook and
 * `POST /handoffs/orders/:id/confirm-handoff` call the old Inventory
 * screen's Pickup/Incoming tabs used, just surfaced per-order instead
 * of as an inline expand on a list row.
 *
 * The code panel only renders while the order is actually in a state
 * `confirm-handoff` accepts (`isAwaitingPickup`/`isAwaitingArrival`) —
 * per docs/API.md the endpoint 404s/409s otherwise, so an order that's
 * already moved on (confirmed from another device, or this operator's
 * own confirm already landed) falls back to a read-only view instead
 * of offering an action the server would reject.
 *
 * No rider identity (name, phone) is shown, and none is invented: no
 * endpoint in the Node Operator's API surface returns it — the 6-digit
 * code the rider reads aloud is the entire handoff protocol per
 * docs/API.md.
 */
export function HandoffDetailScreen() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const orderId = params.orderId;

  const { order, isLoading } = useNodeOrder(orderId);

  const isPickup = order ? isAwaitingPickup(order) : false;
  const isArrival = order ? isAwaitingArrival(order) : false;
  const isActionable = isPickup || isArrival;

  const {
    selectHandoffType,
    selectedOrderId,
    selectOrder,
    confirmHandoff,
    isConfirming,
    confirmError,
    confirmedOrder,
    isConfirmed,
    shouldRequestFreshCode,
    reset: resetConfirm,
  } = useConfirmHandoff();

  const [code, setCode] = useState("");

  // Targets this one order at the right `confirm-handoff` `type` as
  // soon as it's loaded — the hook is list-shaped (built for
  // Inventory's pick-lists), but a detail page only ever has one order
  // to select.
  useEffect(() => {
    if (!order || !isActionable) return;
    selectHandoffType(isPickup ? "rider_pickup" : "rider_arrival");
    selectOrder(order.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id, isActionable]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-canvas">
        <div className="w-8 h-8 rounded-full border-2 border-border-default border-t-brand-blue animate-spin" />
      </div>
    );
  }

  if (isConfirmed && confirmedOrder) {
    const wasPickup = confirmedOrder.status === HANDOFF_STATUS.inTransit;
    return (
      <div className="min-h-screen bg-bg-canvas flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-status-success-bg text-status-success flex items-center justify-center mb-5">
          <CheckCircleIcon size={32} />
        </div>
        <h1 className="font-display text-[19px] font-bold text-text-primary mb-1.5">
          {wasPickup ? "Pickup Confirmed" : "Arrival Confirmed"}
        </h1>
        <p className="text-[14px] text-text-secondary mb-7 max-w-[300px]">
          {wasPickup
            ? `${confirmedOrder.trackingCode} is now in transit with the rider.`
            : `${confirmedOrder.trackingCode} has arrived at your Node. Check it in from Ready for Collection to notify the receiver.`}
        </p>
        <Button size="lg" fullWidth className="max-w-[280px]" onClick={() => router.push(ROUTES.nodeHome)}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-bg-canvas">
        <TopBar title="Order Details" showBack />
        <div className="px-6 pt-10 max-w-[480px] mx-auto">
          <EmptyState
            icon={<ArchiveIcon size={24} />}
            title="Order not available"
            description="This order isn't in your Node's list — it may have already moved past this step, or the link is stale."
            action={
              <Button size="md" variant="ghost" onClick={() => router.push(ROUTES.nodeHome)}>
                ← Back to dashboard
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const confirmFailure = confirmError ? getFriendlyError(confirmError) : null;
  const canConfirm = code.length === HANDOFF_CODE_LENGTH && selectedOrderId === order.id;
  const title = isPickup ? "Confirm Pickup" : isArrival ? "Confirm Arrival" : "Order Details";

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title={title} showBack />

      <div className="px-4 md:px-6 pt-2 md:pt-6 pb-10 max-w-[480px] mx-auto">
        <Card padding="md" className="mb-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] text-text-muted">Tracking Code</p>
              <p className="text-[15px] font-bold text-text-primary font-mono truncate">
                {order.trackingCode}
              </p>
            </div>
            <HandoffStatusPill status={order.status} />
          </div>

          <div className="h-px bg-border-default" />

          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Parcel</p>
            <p className="text-[13px] font-medium text-text-primary">{order.parcelDescription}</p>
            <p className="text-[12px] text-text-muted capitalize">
              {order.parcelSize.replace("_", " ")} · Placed {formatDate(order.createdAt)}
            </p>
          </div>

          <div className="h-px bg-border-default" />

          <div className="flex items-start gap-2.5">
            <span className="w-8 h-8 rounded-[9px] bg-bg-subtle text-text-muted flex items-center justify-center shrink-0 mt-0.5">
              <MapPinIcon size={14} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-text-muted uppercase tracking-wide">Route</p>
              <p className="text-[13px] font-medium text-text-primary">
                {order.originNodeName} → {order.destinationNodeName}
              </p>
              <p className="text-[12px] text-text-muted">
                {order.myRole === "origin" ? "Origin — your Node" : "Destination — your Node"}
              </p>
            </div>
          </div>
        </Card>

        {isActionable ? (
          <>
            <h2 className="font-semibold text-[14px] text-text-primary mb-1">
              {isPickup ? "Rider pickup code" : "Rider arrival code"}
            </h2>
            <p className="text-[12px] text-text-muted mb-4">
              Ask the rider to read out the {HANDOFF_CODE_LENGTH} digits on their screen.
              That&apos;s the only thing they need to give you.
            </p>

            <OtpInputBoxes length={HANDOFF_CODE_LENGTH} value={code} hasError={!!confirmError} />

            {confirmFailure && (
              <div className="mt-3">
                <ErrorAlert
                  title={confirmFailure.title}
                  message={confirmFailure.message}
                  action={confirmFailure.action}
                />
              </div>
            )}

            {shouldRequestFreshCode && !confirmFailure && (
              <Card padding="md" className="mt-3 border-l-[3px] border-l-status-danger">
                <div className="flex items-start gap-2.5">
                  <span className="text-status-danger shrink-0 mt-0.5">
                    <AlertTriangleIcon size={16} />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-status-danger mb-1">
                      This code is spent
                    </p>
                    <p className="text-[12px] text-text-secondary">
                      Too many wrong attempts. Ask the rider to request a new code in their
                      app — they aren&apos;t blocked, only this code is.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <div className="mt-6">
              <PinPad
                onDigit={(digit) => {
                  if (code.length >= HANDOFF_CODE_LENGTH || isConfirming) return;
                  setCode(code + digit);
                }}
                onBackspace={() => setCode(code.slice(0, -1))}
                disabled={isConfirming}
                secondaryAction={{
                  label: "Clear",
                  onClick: () => setCode(""),
                  disabled: isConfirming || !code,
                }}
              />
            </div>

            <Button
              fullWidth
              size="lg"
              className="mt-6"
              disabled={!canConfirm}
              isLoading={isConfirming}
              onClick={() => confirmHandoff(code)}
            >
              {isPickup ? "Confirm Rider Pickup" : "Confirm Rider Arrival"}
            </Button>
          </>
        ) : (
          <Card padding="md">
            <p className="text-[13px] font-semibold text-text-primary mb-1">
              No action needed right now
            </p>
            <p className="text-[12px] text-text-secondary">
              This order has moved past the pickup/arrival step — check Ready for
              Collection or Activity for its current status.
            </p>
          </Card>
        )}

        <Button
          fullWidth
          size="md"
          variant="ghost"
          className="mt-6"
          onClick={() => {
            resetConfirm();
            router.push(ROUTES.nodeHome);
          }}
        >
          ← Back to dashboard
        </Button>
      </div>
    </div>
  );
}
