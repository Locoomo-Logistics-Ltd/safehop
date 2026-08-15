"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, OtpInputBoxes, PinPad } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { TopBar } from "@/components/layout";
import {
  CheckCircleIcon,
  TruckIcon,
  PackageIcon,
  MailIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";
import { getFriendlyError } from "@/core/api/errors";
import { ROUTES } from "@/core/config/constants";
import { HANDOFF_CODE_LENGTH } from "@/core/types";
import type { HandoffType } from "@/core/types";
import { useConfirmHandoff } from "@/modules/vendor/hooks/use-confirm-handoff";
import { useParcelIntake } from "@/modules/vendor/hooks/use-parcel-intake";
import { HandoffStatusPill } from "./HandoffStatusPill";

/**
 * Rider handoff at the counter — the operator types the 6-digit code
 * the rider states, and custody moves.
 *
 * Two things drive the shape of this screen:
 *
 * 1. **The pickup/arrival choice is not inferable.** The same Node can
 *    be the origin of one parcel and the destination of another, and
 *    sending the wrong `type` is a `404` that looks identical to "wrong
 *    code." So the choice is an explicit first step, framed by what is
 *    physically happening rather than by API vocabulary.
 * 2. **Everything after that step is identical.** Both directions post
 *    to the same endpoint and differ only by `type`, so the operator
 *    gets one form: find the parcel by tracking code, type the rider's
 *    code, confirm. The lookup is attempted in both directions.
 * 3. **The arrival lookup may not be permitted.** docs/API.md scopes
 *    by-tracking-code to the *origin* Node, so a destination operator's
 *    lookup can 404 by design. That's handled where it happens — a
 *    fallback order-ID field appears only after the lookup has actually
 *    failed, rather than making every arrival start from a uuid. See
 *    use-confirm-handoff.ts's header.
 */

const HANDOFF_OPTIONS: Array<{
  type: HandoffType;
  title: string;
  detail: string;
  outcome: string;
}> = [
  {
    type: "rider_pickup",
    title: "Rider is collecting",
    detail: "You're handing a parcel to a rider who's taking it away.",
    outcome: "in transit",
  },
  {
    type: "rider_arrival",
    title: "Rider is delivering",
    detail: "A rider has arrived and is handing a parcel to you.",
    outcome: "arrived",
  },
];

export function RiderHandoffScreen() {
  const router = useRouter();
  const {
    handoffType,
    selectHandoffType,
    resolveByTrackingCode,
    resolvedOrder,
    isResolving,
    lookupNotFound,
    lookupError,
    confirmHandoff,
    isConfirming,
    confirmError,
    confirmedOrder,
    isConfirmed,
    shouldRequestFreshCode,
    reset,
  } = useConfirmHandoff();
  const {
    confirmIntake,
    isConfirmingIntake,
    intakeError,
    isIntakeDone,
    resetIntake,
  } = useParcelIntake();

  const [trackingCode, setTrackingCode] = useState("");
  const [code, setCode] = useState("");

  const isPickup = handoffType === "rider_pickup";

  // Both directions run exactly one path: tracking code → lookup →
  // confirm with the resolved uuid. Only `type` differs.
  //
  // `confirm-handoff` takes the order's uuid, never a tracking code — a
  // brief attempt at passing the code through when the lookup failed
  // produced `NOT_FOUND: Order with id LCM-…` against the live backend,
  // so that's settled. If the lookup can't resolve an order, there is
  // no confirm to make, and the button stays disabled rather than
  // firing a request that is known to fail.
  const orderId = resolvedOrder?.id;
  const canConfirm = !!orderId && code.length === HANDOFF_CODE_LENGTH;

  const handleSelectType = (type: HandoffType) => {
    if (type === handoffType) return;
    selectHandoffType(type);
    setTrackingCode("");
    setCode("");
  };

  const handleDigit = (digit: string) => {
    if (code.length >= HANDOFF_CODE_LENGTH || isConfirming) return;
    setCode(code + digit);
  };

  const handleStartOver = () => {
    reset();
    resetIntake();
    setTrackingCode("");
    setCode("");
  };

  if (isConfirmed && confirmedOrder) {
    const intakeFailure = intakeError ? getFriendlyError(intakeError) : null;

    return (
      <div className="min-h-screen bg-bg-canvas flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-status-success-bg text-status-success flex items-center justify-center mb-5">
          <CheckCircleIcon size={32} />
        </div>
        <h1 className="font-display text-[19px] font-bold text-text-primary mb-1.5">
          {isIntakeDone ? "Receiver Notified" : "Handoff Confirmed"}
        </h1>
        <p className="text-[14px] text-text-secondary mb-4 max-w-[320px]">
          {isPickup
            ? `${confirmedOrder.trackingCode} is now in transit with the rider.`
            : isIntakeDone
              ? `${confirmedOrder.trackingCode} is checked in. The receiver has been emailed a collection code.`
              : `${confirmedOrder.trackingCode} has arrived at your Node.`}
        </p>
        <HandoffStatusPill
          status={isIntakeDone ? "ready_for_collection" : confirmedOrder.status}
          className="mb-7"
        />

        {/*
          Intake is chained here rather than left for later because this
          is the same physical moment — the parcel is on the counter and
          the operator is already looking at the screen. It's also what
          emails the receiver their code, so deferring it leaves them
          uninformed with no way to ask.
        */}
        {!isPickup && !isIntakeDone && (
          <div className="w-full max-w-[320px] mb-4">
            {intakeFailure && (
              <div className="mb-3 text-left">
                <ErrorAlert
                  title={intakeFailure.title}
                  message={intakeFailure.message}
                  action={intakeFailure.action}
                />
              </div>
            )}
            <Button
              size="lg"
              fullWidth
              isLoading={isConfirmingIntake}
              leftIcon={<MailIcon size={16} />}
              onClick={() => confirmIntake(confirmedOrder.id)}
            >
              Check In &amp; Email Receiver
            </Button>
            <p className="text-[12px] text-text-muted mt-2">
              Sends the receiver the code they&apos;ll need to collect it.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 w-full max-w-[280px]">
          <Button
            size="lg"
            fullWidth
            variant={!isPickup && !isIntakeDone ? "outline" : "primary"}
            onClick={handleStartOver}
          >
            Confirm Another Handoff
          </Button>
          <Button
            size="lg"
            fullWidth
            variant="outline"
            onClick={() =>
              router.push(isPickup ? ROUTES.vendorHome : ROUTES.vendorAwaitingCollection)
            }
          >
            {isPickup ? "Back to Dashboard" : "Back to Counter"}
          </Button>
        </div>
      </div>
    );
  }

  const lookupFailure = lookupError ? getFriendlyError(lookupError) : null;
  const confirmFailure = confirmError ? getFriendlyError(confirmError) : null;

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="Rider Handoff" showBack />

      <div className="px-4 md:px-6 pt-2 md:pt-6 pb-8 max-w-[480px] mx-auto">
        {/* Step 1 — which direction */}
        <h2 className="font-semibold text-[14px] text-text-primary mb-1">
          What&apos;s happening at the counter?
        </h2>
        <p className="text-[12px] text-text-muted mb-3">
          Picking the wrong one won&apos;t find the parcel.
        </p>

        <div className="flex flex-col gap-2.5 mb-6">
          {HANDOFF_OPTIONS.map((option) => {
            const isSelected = option.type === handoffType;
            return (
              <button
                key={option.type}
                onClick={() => handleSelectType(option.type)}
                aria-pressed={isSelected}
                className={cn(
                  "w-full text-left rounded-[14px] border-2 p-4 transition-colors duration-150",
                  isSelected
                    ? "border-brand-blue bg-status-info-bg"
                    : "border-border-default bg-bg-card"
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0",
                      isSelected
                        ? "bg-brand-blue text-white"
                        : "bg-bg-subtle text-text-muted"
                    )}
                  >
                    {option.type === "rider_pickup" ? (
                      <TruckIcon size={16} />
                    ) : (
                      <PackageIcon size={16} />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-text-primary">
                      {option.title}
                    </p>
                    <p className="text-[12px] text-text-secondary leading-[1.5]">
                      {option.detail}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Step 2 — which parcel. Identical for both directions: the
            two differ only by the `type` field on one shared endpoint,
            so the operator meets one form either way. The parcel is
            always found by tracking code — never by raw order id. */}
        <h2 className="font-semibold text-[14px] text-text-primary mb-3">
          Which parcel?
        </h2>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              label="Tracking code"
              placeholder="e.g. LCM-4F2K-9XPT"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
              hint={
                isPickup
                  ? "Printed on the parcel label."
                  : "Printed on the parcel label, or read it off the rider's screen."
              }
            />
          </div>
          <Button
            size="lg"
            variant="outline"
            className="mb-[26px]"
            disabled={!trackingCode.trim()}
            isLoading={isResolving}
            onClick={() => resolveByTrackingCode(trackingCode)}
          >
            Find
          </Button>
        </div>

        {/*
          The same 404 has different likely causes per direction, and
          naming the wrong one sends the operator hunting in the wrong
          place. On pickup it's usually the direction toggle. On
          arrival, `by-tracking-code` is scoped to the *origin* Node
          (docs/API.md), so the common cause is that this account
          doesn't operate the Node the parcel is addressed to.
        */}
        {lookupNotFound && (
          <div className="text-[12px] text-status-danger bg-status-danger-bg rounded-[10px] py-2.5 px-3 mt-3 leading-[1.5]">
            {isPickup ? (
              <p>
                No parcel with that code is going out from your Node. If the rider is
                delivering to you, switch to “Rider is delivering” above.
              </p>
            ) : (
              <>
                <p className="font-semibold mb-1">Couldn&apos;t find that parcel.</p>
                <p>
                  Arrivals can only be confirmed by the operator of the Node the parcel is
                  addressed to. Check you&apos;re signed in as that Node&apos;s account, and
                  that the code matches the rider&apos;s screen.
                </p>
              </>
            )}
          </div>
        )}

        {lookupFailure && (
          <div className="mt-3">
            <ErrorAlert
              title={lookupFailure.title}
              message={lookupFailure.message}
              action={lookupFailure.action}
            />
          </div>
        )}

        {resolvedOrder && (
          <Card padding="md" className="mt-3 border-l-[3px] border-l-status-success">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-text-primary font-mono truncate">
                  {resolvedOrder.trackingCode}
                </p>
                <p className="text-[12px] text-text-muted truncate">
                  {resolvedOrder.parcelDescription} → {resolvedOrder.destinationNodeName}
                </p>
              </div>
              <HandoffStatusPill status={resolvedOrder.status} />
            </div>
          </Card>
        )}

        {/* Step 3 — the code */}
        <h2 className="font-semibold text-[14px] text-text-primary mt-7 mb-1">
          Rider&apos;s code
        </h2>
        <p className="text-[12px] text-text-muted mb-4">
          Ask the rider to read out the {HANDOFF_CODE_LENGTH} digits on their screen.
        </p>

        <OtpInputBoxes
          length={HANDOFF_CODE_LENGTH}
          value={code}
          hasError={!!confirmError}
        />

        {confirmFailure && (
          <ErrorAlert
            title={confirmFailure.title}
            message={confirmFailure.message}
            action={confirmFailure.action}
          />
        )}

        {shouldRequestFreshCode && (
          <Card padding="md" className="mt-3 border-l-[3px] border-l-status-danger">
            <p className="text-[13px] font-semibold text-status-danger mb-1">
              This code is spent
            </p>
            <p className="text-[12px] text-text-secondary">
              Too many wrong attempts. Ask the rider to request a new code in their app —
              they aren&apos;t blocked, only this code is.
            </p>
          </Card>
        )}

        <div className="mt-6">
          <PinPad
            onDigit={handleDigit}
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
          onClick={() => orderId && confirmHandoff({ orderId, code })}
        >
          {isPickup ? "Confirm Rider Pickup" : "Confirm Rider Arrival"}
        </Button>

        {!orderId && code.length === HANDOFF_CODE_LENGTH && (
          <p className="text-[12px] text-text-muted text-center mt-3">
            Find the parcel by tracking code first — the confirm needs the order it
            resolves to.
          </p>
        )}
      </div>
    </div>
  );
}
