"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, EmptyState, OtpInputBoxes, PinPad } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { TopBar } from "@/components/layout";
import {
  CheckCircleIcon,
  ArchiveIcon,
  MailIcon,
  AlertTriangleIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";
import { getFriendlyError } from "@/core/api/errors";
import { formatDate } from "@/lib/format";
import { ROUTES } from "@/core/config/constants";
import { HANDOFF_CODE_LENGTH } from "@/core/types";
import { useNotificationStore } from "@/store/notification.store";
import { needsIntake } from "@/modules/node/hooks/use-my-node-orders";
import { useAwaitingCollectionParcel } from "@/modules/node/hooks/use-awaiting-collection";
import { useCollectParcel } from "@/modules/node/hooks/use-collect-parcel";
import { useParcelIntake } from "@/modules/node/hooks/use-parcel-intake";
import { HandoffStatusPill } from "@/modules/node/components/handoff/HandoffStatusPill";

/**
 * Ready for Collection's details page — the destination-side counter
 * flow from a rider's arrival through the receiver walking away with
 * the parcel. Reached from Home's Ready for Collection tab
 * (`CollectionSummaryList`), for either of that tab's two sub-states:
 *
 * 1. **Needs check-in** (`needsIntake`) — the parcel has arrived but the
 *    receiver hasn't been told. Shows the order's full details and the
 *    "Send"/check-in action (`POST .../intake`, `useParcelIntake`) —
 *    the same action Inventory's Collection tab used to expose inline.
 *    Once it succeeds, this screen falls through to state 2 below on
 *    its own: `useParcelIntake`'s success invalidates
 *    `GET /handoffs/my-node/orders`, the order's status flips server-
 *    side, and `useAwaitingCollectionParcel` re-derives from the
 *    refetched cache — no manual navigation needed.
 * 2. **Ready** (`isReadyForCollection`) — the receiver has a code. Code
 *    entry + identity attestation + resend, as before.
 *
 * Three things shape state 2, all of them from docs/API.md rather than
 * preference:
 *
 * 1. **The operator never sees the collection code.** It's emailed to
 *    the receiver at intake and exists nowhere else — not in the resend
 *    response, not on any GET. So there's nothing to display and nothing
 *    to check against: the operator types what the receiver reads out,
 *    and the server is the only thing that knows if it's right.
 * 2. **`identityConfirmed` is an audit trail, not a gate.** A `false`
 *    still completes the collection, because someone collecting on the
 *    named receiver's behalf is normal here. So it's asked as a plain
 *    question with no pre-selected answer — a default would record an
 *    attestation the operator never actually made, which is the one
 *    thing that would make the field worthless.
 * 3. **We can't show the expected receiver name.** No destination-side
 *    endpoint returns receiver PII, so the app cannot help the operator
 *    check the name — they're attesting to a conversation, not to a
 *    match against anything on screen. The wording says so rather than
 *    implying a verification the app didn't do.
 */
export function CollectParcelScreen() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const notify = useNotificationStore((s) => s.showNotification);

  const { parcel, isLoading } = useAwaitingCollectionParcel(params.orderId);
  const {
    collect,
    isCollecting,
    collectError,
    collectedOrder,
    isCollected,
    resendCode,
    isResending,
    resendError,
    didResend,
    shouldResendCode,
  } = useCollectParcel(params.orderId);
  const { confirmIntake, isConfirmingIntake, intakeError, isIntakeDone, intakeResult, resetIntake } =
    useParcelIntake();

  const [code, setCode] = useState("");
  const [identityConfirmed, setIdentityConfirmed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isIntakeDone || !intakeResult) return;
    notify({
      type: "success",
      title: "Receiver notified",
      message: `${intakeResult.trackingCode} is ready for collection — the receiver has been emailed a code.`,
    });
    resetIntake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIntakeDone, intakeResult]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-canvas">
        <div className="w-8 h-8 rounded-full border-2 border-border-default border-t-brand-blue animate-spin" />
      </div>
    );
  }

  if (isCollected && collectedOrder) {
    return (
      <div className="min-h-screen bg-bg-canvas flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-status-success-bg text-status-success flex items-center justify-center mb-5">
          <CheckCircleIcon size={32} />
        </div>
        <h1 className="font-display text-[19px] font-bold text-text-primary mb-1.5">
          Parcel Collected
        </h1>
        <p className="text-[14px] text-text-secondary mb-7 max-w-[300px]">
          {collectedOrder.trackingCode} is complete. Nothing further is owed on this
          delivery.
        </p>
        <Button
          size="lg"
          fullWidth
          className="max-w-[280px]"
          onClick={() => router.push(ROUTES.nodeHome)}
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  // Loaded and still missing means this order isn't sitting at this
  // Node's destination-side counter — either it hasn't arrived/been
  // checked in yet, or it's already been collected.
  if (!parcel) {
    return (
      <div className="min-h-screen bg-bg-canvas">
        <TopBar title="Collect Parcel" showBack />
        <div className="px-6 pt-10 max-w-[480px] mx-auto">
          <EmptyState
            icon={<ArchiveIcon size={24} />}
            title="Not ready for collection"
            description="This order isn't currently waiting to be collected at your counter — it may not have arrived yet, or it's already been handed over."
            action={
              <Button
                size="md"
                variant="ghost"
                onClick={() => router.push(ROUTES.nodeHome)}
              >
                ← Back to dashboard
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  if (needsIntake(parcel)) {
    const intakeFailure = intakeError ? getFriendlyError(intakeError) : null;
    return (
      <div className="min-h-screen bg-bg-canvas">
        <TopBar title="Ready for Collection" showBack />
        <div className="px-4 md:px-6 pt-2 md:pt-6 pb-8 max-w-[480px] mx-auto">
          <Card padding="md" className="mb-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] text-text-muted">Tracking ID</p>
                <p className="text-[15px] font-bold text-text-primary font-mono truncate">
                  {parcel.trackingCode}
                </p>
              </div>
              <HandoffStatusPill status={parcel.status} />
            </div>

            <div className="h-px bg-border-default" />

            <div>
              <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Parcel</p>
              <p className="text-[13px] font-medium text-text-primary">{parcel.parcelDescription}</p>
              <p className="text-[12px] text-text-muted capitalize">
                {parcel.parcelSize.replace("_", " ")} · Arrived from {parcel.originNodeName} ·
                Placed {formatDate(parcel.createdAt)}
              </p>
            </div>
          </Card>

          <Card padding="md" className="border-l-[3px] border-l-status-warning mb-6">
            <p className="text-[13px] font-semibold text-text-primary mb-1">Needs check-in</p>
            <p className="text-[12px] text-text-secondary">
              The receiver hasn&apos;t been told this arrived yet. Checking in mints a
              collection code and emails it to them — you won&apos;t see the code
              yourself, only they will.
            </p>
          </Card>

          {intakeFailure && (
            <div className="mb-4">
              <ErrorAlert
                title={intakeFailure.title}
                message={intakeFailure.message}
                action={intakeFailure.action}
              />
            </div>
          )}

          <Button
            fullWidth
            size="lg"
            isLoading={isConfirmingIntake}
            leftIcon={<MailIcon size={16} />}
            onClick={() => confirmIntake(parcel.id)}
          >
            Check In &amp; Email Receiver
          </Button>

          <Button
            fullWidth
            size="md"
            variant="ghost"
            className="mt-4"
            onClick={() => router.push(ROUTES.nodeHome)}
          >
            ← Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleDigit = (digit: string) => {
    if (code.length >= HANDOFF_CODE_LENGTH || isCollecting) return;
    setCode(code + digit);
  };

  const canCollect =
    code.length === HANDOFF_CODE_LENGTH && identityConfirmed !== null && !isCollecting;

  const collectFailure = collectError ? getFriendlyError(collectError) : null;
  const resendFailure = resendError ? getFriendlyError(resendError) : null;

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="Collect Parcel" showBack />

      <div className="px-4 md:px-6 pt-2 md:pt-6 pb-8 max-w-[480px] mx-auto">
        <Card padding="md" className="mb-6 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] text-text-muted">Tracking ID</p>
              <p className="text-[16px] font-bold text-text-primary font-mono truncate">
                {parcel.trackingCode}
              </p>
            </div>
            <HandoffStatusPill status={parcel.status} />
          </div>

          <div className="h-px bg-border-default" />

          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Parcel</p>
            <p className="text-[13px] font-medium text-text-primary">{parcel.parcelDescription}</p>
            <p className="text-[12px] text-text-muted capitalize">
              {parcel.parcelSize.replace("_", " ")} · Arrived from {parcel.originNodeName} ·
              Placed {formatDate(parcel.createdAt)}
            </p>
          </div>
        </Card>

        {/* Step 1 — the attestation, asked before the code so it isn't
            an afterthought tacked onto a completed form. */}
        <h2 className="font-semibold text-[14px] text-text-primary mb-1">
          Did you ask who&apos;s collecting?
        </h2>
        <p className="text-[12px] text-text-muted mb-3">
          Either answer completes the collection — someone picking up on the
          receiver&apos;s behalf is fine. This just records what happened.
        </p>

        <div className="flex flex-col gap-2.5 mb-7">
          <button
            onClick={() => setIdentityConfirmed(true)}
            aria-pressed={identityConfirmed === true}
            className={cn(
              "w-full text-left rounded-[14px] border-2 p-4 transition-colors duration-150",
              identityConfirmed === true
                ? "border-brand-blue bg-status-info-bg"
                : "border-border-default bg-bg-card"
            )}
          >
            <p className="text-[13px] font-semibold text-text-primary">
              Yes — the named receiver
            </p>
            <p className="text-[12px] text-text-muted mt-0.5">
              I asked for their name and it matched what they told me.
            </p>
          </button>

          <button
            onClick={() => setIdentityConfirmed(false)}
            aria-pressed={identityConfirmed === false}
            className={cn(
              "w-full text-left rounded-[14px] border-2 p-4 transition-colors duration-150",
              identityConfirmed === false
                ? "border-brand-blue bg-status-info-bg"
                : "border-border-default bg-bg-card"
            )}
          >
            <p className="text-[13px] font-semibold text-text-primary">
              No — someone else, or I didn&apos;t ask
            </p>
            <p className="text-[12px] text-text-muted mt-0.5">
              Collecting on the receiver&apos;s behalf, or I couldn&apos;t confirm.
            </p>
          </button>
        </div>

        {/* Step 2 — the code */}
        <h2 className="font-semibold text-[14px] text-text-primary mb-1">
          Collection code
        </h2>
        <p className="text-[12px] text-text-muted mb-4">
          Ask them to read out the {HANDOFF_CODE_LENGTH} digits from their email. You
          won&apos;t see it anywhere on your side.
        </p>

        <OtpInputBoxes
          length={HANDOFF_CODE_LENGTH}
          value={code}
          hasError={!!collectError}
        />

        {collectFailure && (
          <div className="mt-3">
            <ErrorAlert
              title={collectFailure.title}
              message={collectFailure.message}
              action={collectFailure.action}
            />
          </div>
        )}

        {shouldResendCode && !collectFailure && (
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
                  Too many wrong attempts. Send a fresh one to their email below.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="mt-6">
          <PinPad
            onDigit={handleDigit}
            onBackspace={() => setCode(code.slice(0, -1))}
            disabled={isCollecting}
            secondaryAction={{
              label: "Clear",
              onClick: () => setCode(""),
              disabled: isCollecting || !code,
            }}
          />
        </div>

        <Button
          fullWidth
          size="lg"
          className="mt-6"
          disabled={!canCollect}
          isLoading={isCollecting}
          onClick={() =>
            identityConfirmed !== null && collect({ code, identityConfirmed })
          }
        >
          Complete Collection
        </Button>

        {identityConfirmed === null && code.length === HANDOFF_CODE_LENGTH && (
          <p className="text-[12px] text-text-muted text-center mt-3">
            Answer the question above first.
          </p>
        )}

        {/* Recovery path — deliberately below the primary action, since
            it sends a real email and is rate-limited at 5/min. */}
        <div className="mt-8 pt-6 border-t border-border-default">
          <p className="text-[13px] font-semibold text-text-primary mb-1">
            Receiver didn&apos;t get the email?
          </p>
          <p className="text-[12px] text-text-muted mb-3">
            Sends a new code and cancels the old one. Codes expire an hour after they&apos;re
            sent.
          </p>

          {resendFailure && (
            <div className="mb-3">
              <ErrorAlert
                title={resendFailure.title}
                message={resendFailure.message}
                action={resendFailure.action}
              />
            </div>
          )}

          {didResend && !resendFailure && (
            <Card padding="md" className="mb-3 border-l-[3px] border-l-status-success">
              <p className="text-[13px] font-semibold text-status-success">
                New code sent
              </p>
              <p className="text-[12px] text-text-secondary mt-0.5">
                Ask them to check their email again — the previous code no longer works.
              </p>
            </Card>
          )}

          <Button
            fullWidth
            size="md"
            variant="outline"
            isLoading={isResending}
            leftIcon={<MailIcon size={16} />}
            onClick={() => {
              setCode("");
              resendCode();
            }}
          >
            Resend Collection Code
          </Button>
        </div>
      </div>
    </div>
  );
}
