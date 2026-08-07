"use client";

import { useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout";
import { Button, Card, Input, EmptyState } from "@/components/ui";
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
 * `RiderProfileScreen`. Modeled on `VendorNodeSetupScreen`, the
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
    documentType: "rating_screenshot";
    file: File;
  }) => void;
  isSubmitting: boolean;
  error: unknown;
}) {
  const [currentEmployer, setCurrentEmployer] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const isValid = currentEmployer.trim().length > 0 && !!file;

  const handleSubmit = () => {
    if (!file) return;
    onSubmit({ currentEmployer: currentEmployer.trim(), documentType: "rating_screenshot", file });
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

function VerificationStatusView({ profile }: { profile: RiderVerificationProfile }) {
  if (profile.status === "active") {
    return (
      <div className="min-h-screen bg-bg-canvas">
        <TopBar title="Rider Verification" showBack />
        <EmptyState
          icon={<CheckCircleIcon size={24} />}
          title="You're verified"
          description="Your rider account is fully approved. You're eligible for job offers."
          action={
            <Link href={ROUTES.riderHome}>
              <Button size="md">Go to Dashboard</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="Rider Verification" showBack />
      <EmptyState
        icon={<ClockIcon size={24} />}
        title="Verification under review"
        description="We've received your details and document. An admin will review them shortly — you'll be able to accept jobs as soon as you're approved."
      />
      <div className="px-4 md:px-6 max-w-[480px] mx-auto flex flex-col gap-3">
        <Card padding="md" className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-[10px] bg-bg-subtle text-text-muted flex items-center justify-center shrink-0">
            <ShieldCheckIcon size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] text-text-muted">Current Employer</p>
            <p className="text-[13px] font-medium text-text-primary truncate">
              {profile.currentEmployer}
            </p>
          </div>
        </Card>
        {profile.documents.map((doc) => (
          <a
            key={doc.documentType}
            href={doc.viewUrl}
            target="_blank"
            rel="noreferrer"
            className="block"
          >
            <Card padding="md" interactive className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-[10px] bg-bg-subtle text-text-muted flex items-center justify-center shrink-0">
                <CameraIcon size={16} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] text-text-muted">Rating Screenshot</p>
                <p className="text-[13px] font-medium text-brand-blue truncate">
                  View uploaded document
                </p>
              </div>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
