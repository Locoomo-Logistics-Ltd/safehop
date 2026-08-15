"use client";

import { useState } from "react";
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
import { ROUTES } from "@/core/config/constants";
import { HANDOFF_CODE_LENGTH } from "@/core/types";
import { useAwaitingCollectionParcel } from "@/modules/vendor/hooks/use-awaiting-collection";
import { useCollectParcel } from "@/modules/vendor/hooks/use-collect-parcel";

/**
 * Receiver collection — the last step in a parcel's life.
 *
 * Three things shape this screen, all of them from docs/API.md rather
 * than preference:
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

  const { parcel, isHydrated } = useAwaitingCollectionParcel(params.orderId);
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

  const [code, setCode] = useState("");
  const [identityConfirmed, setIdentityConfirmed] = useState<boolean | null>(null);

  if (!isHydrated) {
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
        <div className="flex flex-col gap-3 w-full max-w-[280px]">
          <Button
            size="lg"
            fullWidth
            onClick={() => router.push(ROUTES.vendorAwaitingCollection)}
          >
            Back to Counter
          </Button>
          <Button
            size="lg"
            fullWidth
            variant="outline"
            onClick={() => router.push(ROUTES.vendorHome)}
          >
            Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Hydrated and still missing means this parcel was confirmed on some
  // other device. There's no API path back to it — see the store header
  // — so say that plainly rather than showing a dead form.
  if (!parcel) {
    return (
      <div className="min-h-screen bg-bg-canvas">
        <TopBar title="Collect Parcel" showBack />
        <div className="px-6 pt-10 max-w-[480px] mx-auto">
          <EmptyState
            icon={<ArchiveIcon size={24} />}
            title="Not on this device"
            description="This parcel was checked in on a different device or browser, and it can only be collected from that one. Try the device you used when the rider dropped it off."
            action={
              <Button
                size="md"
                variant="ghost"
                onClick={() => router.push(ROUTES.vendorAwaitingCollection)}
              >
                ← Back to counter
              </Button>
            }
          />
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
        <Card padding="md" className="mb-6 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-text-muted">Tracking ID</p>
            <p className="text-[16px] font-bold text-text-primary font-mono truncate">
              {parcel.trackingCode}
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
