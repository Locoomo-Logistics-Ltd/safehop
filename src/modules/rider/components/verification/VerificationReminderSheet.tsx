"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import { ShieldCheckIcon } from "@/components/icons";
import { ROUTES } from "@/core/config/constants";

interface VerificationReminderSheetProps {
  onDismiss: () => void;
}

/**
 * Nudge shown on Rider Home for a not-yet-active Rider — Home, Earnings,
 * and Profile all stay freely browsable, this just reminds them
 * verification is required before they can accept jobs. Dismissible;
 * doesn't block anything itself (that's JobOfferScreen's job).
 */
export function VerificationReminderSheet({ onDismiss }: VerificationReminderSheetProps) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <button
        className="absolute inset-0 bg-black/50"
        aria-label="Dismiss"
        onClick={onDismiss}
      />
      <div className="relative bg-bg-card rounded-t-[24px] p-6 pb-8 max-w-[480px] w-full mx-auto">
        <div className="w-10 h-1 rounded-full bg-border-strong mx-auto mb-5" />

        <div className="w-12 h-12 rounded-full bg-status-warning-bg text-status-warning flex items-center justify-center mb-4">
          <ShieldCheckIcon size={22} />
        </div>

        <h2 className="font-display font-bold text-[17px] text-text-primary mb-1">
          Verify your rider account
        </h2>
        <p className="text-[13px] text-text-secondary mb-5">
          You&apos;ll need to complete verification before you can accept delivery jobs. It
          only takes a minute — upload a screenshot of your ratings and an admin will
          review it.
        </p>

        <div className="flex flex-col gap-2.5">
          <Link href={ROUTES.riderVerification} className="block">
            <Button fullWidth size="lg">
              Verify Now
            </Button>
          </Link>
          <Button fullWidth size="lg" variant="ghost" onClick={onDismiss}>
            Maybe Later
          </Button>
        </div>
      </div>
    </div>
  );
}
