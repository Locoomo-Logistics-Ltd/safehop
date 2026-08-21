"use client";

import { useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout";
import { Button, Card, Input } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { CheckCircleIcon, ClockIcon, ShieldCheckIcon, CameraIcon } from "@/components/icons";
import { getFriendlyError } from "@/core/api/errors";
import { ROUTES } from "@/core/config/constants";
import { useRiderVerification } from "@/modules/rider/hooks/use-rider-verification";
import type { RiderVerificationProfile } from "@/core/types";

/**
 * Rider Verification — the self-service KYC step between "logged in"
 * and "eligible for the job board." Backed by three real, confirmed
 * routes per docs/API.md (`GET /riders/verification/upload-signature`,
 * `POST /riders/onboarding`, `GET /riders/me`), previously
 * unintegrated. Reachable from Rider Profile — see
 * `RiderProfileScreen`. Modeled on `NodeSetupScreen`, the
 * Node Operator module's equivalent self-onboarding-and-wait flow.
 */
export function RiderVerificationScreen() {
  const {
    profile,
    isLoadingProfile,
    notStarted,
    profileError,
    submitVerification,
    isSubmitting,
    submitError,
  } = useRiderVerification();

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-bg-canvas">
        <TopBar title="Rider Verification" showBack />
        <p className="text-[13px] text-text-muted text-center py-10">
          Checking your verification status…
        </p>
      </div>
    );
  }

  if (profileError) {
    const error = getFriendlyError(profileError);
    return (
      <div className="min-h-screen bg-bg-canvas">
        <TopBar title="Rider Verification" showBack />
        <div className="px-4 md:px-6 pt-4 max-w-[480px] mx-auto">
          <ErrorAlert title={error.title} message={error.message} action={error.action} />
        </div>
      </div>
    );
  }

  if (notStarted) {
    return (
      <VerificationForm
        onSubmit={submitVerification}
        isSubmitting={isSubmitting}
        error={submitError}
      />
    );
  }

  if (profile) {
    return <VerificationStatusView profile={profile} />;
  }

  return null;
}

function VerificationForm({
  onSubmit,
  isSubmitting,
  error,
}: {
  onSubmit: (args: {
    currentEmployer: string;
    licenseNumber: string;
    documentType: "rating_screenshot";
    file: File;
  }) => void;
  isSubmitting: boolean;
  error: unknown;
}) {
  const [currentEmployer, setCurrentEmployer] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const isValid = currentEmployer.trim().length > 0 && licenseNumber.trim().length > 0 && !!file;

  const handleSubmit = () => {
    if (!file) return;
    onSubmit({
      currentEmployer: currentEmployer.trim(),
      licenseNumber: licenseNumber.trim(),
      documentType: "rating_screenshot",
      file,
    });
  };

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="Rider Verification" showBack />
      <div className="px-4 md:px-6 pt-4 pb-10 max-w-[480px] mx-auto">
        <h1 className="font-display text-[18px] font-bold text-text-primary mb-1">
          Verify your rider account
        </h1>
        <p className="text-[13px] text-text-secondary mb-6">
          Tell us who you currently ride for and upload a screenshot of your ratings/reviews
          dashboard there. An admin reviews every submission before you can accept jobs.
        </p>

        <Card padding="md" className="flex flex-col gap-3">
          <Input
            placeholder="Current employer (e.g. Existing Delivery Co)"
            value={currentEmployer}
            onChange={(e) => setCurrentEmployer(e.target.value)}
          />
          <Input
            placeholder="Driver's license number"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            maxLength={50}
          />
          <label className="flex items-center gap-3 h-12 rounded-[12px] border border-border-default bg-bg-card px-4 cursor-pointer text-text-muted">
            <CameraIcon size={16} />
            <span className="text-[14px] truncate">
              {file ? file.name : "Choose a ratings screenshot…"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </Card>

        {error != null &&
          (() => {
            const friendly = getFriendlyError(error);
            return <ErrorAlert title={friendly.title} message={friendly.message} action={friendly.action} />;
          })()}

        <Button
          fullWidth
          size="lg"
          className="mt-6"
          disabled={!isValid}
          isLoading={isSubmitting}
          onClick={handleSubmit}
        >
          Submit for Review
        </Button>
      </div>
    </div>
  );
}

/**
 * Shared by both the "active" and "pending" states — same fields
 * either way (employer, license number, uploaded document), just a
 * different banner on top. Shows everything the rider actually
 * submitted, per the task's explicit ask: license, company name if
 * present, the uploaded image itself (not just a link to it), and a
 * small "Verified" tag once approved.
 */
function VerificationStatusView({ profile }: { profile: RiderVerificationProfile }) {
  const isActive = profile.status === "active";

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="Rider Verification" showBack />

      <div className="px-4 md:px-6 pt-6 pb-10 max-w-[480px] mx-auto flex flex-col gap-5">
        <div className="flex flex-col items-center text-center gap-3">
          <span
            className={
              "w-14 h-14 rounded-full flex items-center justify-center " +
              (isActive
                ? "bg-status-success-bg text-status-success"
                : "bg-status-warning-bg text-status-warning")
            }
          >
            {isActive ? <CheckCircleIcon size={26} /> : <ClockIcon size={26} />}
          </span>

          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="font-display text-[18px] font-bold text-text-primary">
                {isActive ? "You're verified" : "Verification under review"}
              </h1>
              {isActive && (
                <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-status-success bg-status-success-bg px-2 py-0.5 rounded-full shrink-0">
                  <ShieldCheckIcon size={10} />
                  Verified
                </span>
              )}
            </div>
            <p className="text-[13px] text-text-secondary mt-1">
              {isActive
                ? "Your rider account is fully approved. You're eligible for job offers."
                : "We've received your details and document. An admin will review them shortly — you'll be able to accept jobs as soon as you're approved."}
            </p>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2">
            Verification Details
          </p>
          <Card padding="none" className="overflow-hidden">
            <Row icon={<ShieldCheckIcon size={16} />} label="Current Employer" value={profile.currentEmployer} />
            {profile.licenseNumber && (
              <>
                <div className="h-px bg-border-default" />
                <Row icon={<ShieldCheckIcon size={16} />} label="License Number" value={profile.licenseNumber} />
              </>
            )}
          </Card>
        </div>

        {profile.documents.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2">
              Uploaded Document
            </p>
            <div className="flex flex-col gap-3">
              {profile.documents.map((doc) => (
                <a key={doc.documentType} href={doc.viewUrl} target="_blank" rel="noreferrer" className="block">
                  <Card padding="sm" interactive className="overflow-hidden">
                    <div className="flex items-center gap-2 px-1 pb-2">
                      <CameraIcon size={14} className="text-text-muted" />
                      <p className="text-[12px] font-medium text-text-secondary">Rating Screenshot</p>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element -- signed, short-lived Cloudinary URL; next/image needs a configured remote domain this project doesn't have */}
                    <img
                      src={doc.viewUrl}
                      alt="Uploaded rider verification document"
                      className="w-full max-h-[320px] object-cover rounded-[10px] bg-bg-subtle"
                    />
                  </Card>
                </a>
              ))}
            </div>
          </div>
        )}

        {isActive && (
          <Link href={ROUTES.riderHome} className="block">
            <Button fullWidth size="lg">
              Go to Dashboard
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <span className="w-9 h-9 rounded-[10px] bg-bg-subtle text-text-muted flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-text-muted">{label}</p>
        <p className="text-[13px] font-medium text-text-primary truncate">{value}</p>
      </div>
    </div>
  );
}
