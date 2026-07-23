"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, PinPad, Card } from "@/components/ui";
import { TopBar } from "@/components/layout";
import { CheckCircleIcon } from "@/components/icons";
import { getErrorMessage } from "@/core/api/errors";
import { useNodeParcel } from "@/modules/vendor/hooks/use-parcel-detail";
import { useReleaseParcel } from "@/modules/vendor/hooks/use-release-parcel";
import { ROUTES } from "@/core/config/constants";
import { RecipientVerifyCard } from "./RecipientVerifyCard";
import { OtpInputBoxes } from "./OtpInputBoxes";

const OTP_LENGTH = 6;

/**
 * "Release Parcel" — recipient identity confirmation + 6-digit OTP
 * verification, matching Figma "6. OTP Verification". Auto-sends the
 * OTP on mount (simulating an SMS/notification to the recipient).
 */
export function ReleaseParcelScreen() {
  const params = useParams<{ parcelId: string }>();
  const router = useRouter();
  const { parcel, isLoading } = useNodeParcel(params.parcelId);
  const {
    sendOtp,
    verifyAndRelease,
    isReleasing,
    releaseError,
    isReleased,
    attemptsRemaining,
    isLocked,
  } = useReleaseParcel(params.parcelId, parcel?.qrNonce);

  const [otp, setOtp] = useState("");

  useEffect(() => {
    sendOtp();
    // Intentionally fire once on mount — sendOtp is a stable mutate fn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading || !parcel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-canvas">
        <div className="w-8 h-8 rounded-full border-2 border-border-default border-t-brand-blue animate-spin" />
      </div>
    );
  }

  const handleDigit = (digit: string) => {
    if (otp.length >= OTP_LENGTH || isReleasing || isLocked) return;
    const next = otp + digit;
    setOtp(next);
    if (next.length === OTP_LENGTH) {
      verifyAndRelease(next);
    }
  };

  const handleBackspace = () => setOtp(otp.slice(0, -1));

  const handleResend = () => {
    setOtp("");
    sendOtp();
  };

  if (isReleased) {
    return (
      <div className="min-h-screen bg-bg-canvas flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-status-success-bg text-status-success flex items-center justify-center mb-5">
          <CheckCircleIcon size={32} />
        </div>
        <h1 className="font-display text-[19px] font-bold text-text-primary mb-1.5">
          Parcel Released
        </h1>
        <p className="text-[14px] text-text-secondary mb-7 max-w-[280px]">
          {parcel.trackingCode} has been handed to {parcel.receiver.name}.
        </p>
        <Button size="lg" onClick={() => router.push(ROUTES.vendorHome)}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="Release Parcel" showBack />

      <div className="px-4 md:px-6 pt-2 md:pt-6 pb-8 max-w-[420px] mx-auto">
        <RecipientVerifyCard receiverName={parcel.receiver.name} trackingCode={parcel.trackingCode} />

        <p className="text-center text-[13px] font-medium text-text-secondary mt-7 mb-5">
          Ask the receiver for their 6-digit code
        </p>

        <OtpInputBoxes length={OTP_LENGTH} value={otp} hasError={!!releaseError} />

        <p className="text-center text-[12px] text-text-muted mt-3">
          Attempt {3 - attemptsRemaining + 1} of 3
        </p>

        {releaseError && !isLocked && (
          <p className="text-center text-[12px] text-status-danger bg-status-danger-bg rounded-[10px] py-2 px-3 mt-3">
            {getErrorMessage(releaseError)}
          </p>
        )}

        {isLocked && (
          <Card padding="md" className="mt-4 border-l-[3px] border-l-status-danger">
            <p className="text-[13px] font-semibold text-status-danger mb-1">Too many attempts</p>
            <p className="text-[12px] text-text-secondary">
              For security, this parcel is locked. Ask the recipient to contact support or try
              again later.
            </p>
          </Card>
        )}

        <div className="mt-8">
          <PinPad
            onDigit={handleDigit}
            onBackspace={handleBackspace}
            disabled={isReleasing || isLocked}
            secondaryAction={{ label: "Resend", onClick: handleResend, disabled: isReleasing }}
          />
        </div>

        <Button
          fullWidth
          size="lg"
          className="mt-6"
          disabled={otp.length !== OTP_LENGTH || isLocked}
          isLoading={isReleasing}
          onClick={() => verifyAndRelease(otp)}
        >
          Verify & Release Parcel
        </Button>
      </div>
    </div>
  );
}
