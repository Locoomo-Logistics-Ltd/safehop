"use client";

import { useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout";
import { Card } from "@/components/ui";
import { BriefcaseIcon } from "@/components/icons";
import { ROUTES } from "@/core/config/constants";
import { useCurrentUser } from "@/store/auth.store";
import { useRiderAvailability } from "@/modules/rider/hooks/use-rider-availability";
import { useRiderVerification } from "@/modules/rider/hooks/use-rider-verification";
import { VerificationReminderSheet } from "@/modules/rider/components/verification";
import { OnlineToggle } from "./OnlineToggle";
import { EarningsStatCards } from "./EarningsStatCards";
import { SurgeAlertBanner } from "./SurgeAlertBanner";

/** Sticks for the browser tab's session so "Maybe Later" doesn't nag on every visit to Home, but reappears on a fresh session. */
const VERIFICATION_REMINDER_DISMISSED_KEY = "locoomo_rider_verification_reminder_dismissed";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Rider Home — greeting, online/offline toggle, earnings stats,
 * surge alert, and a shortcut to active job if one exists. Matches
 * Figma "Html → Body (3)" rider dashboard frame.
 */
export function RiderHomeScreen() {
  const user = useCurrentUser();
  const { availability } = useRiderAvailability();
  const { profile: verification, isLoadingProfile: isLoadingVerification, notStarted } = useRiderVerification();
  const [reminderDismissed, setReminderDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.sessionStorage.getItem(VERIFICATION_REMINDER_DISMISSED_KEY) === "true";
  });

  // Only nudge when we positively know verification isn't done yet
  // (never started, or submitted and pending) — not on a real fetch
  // failure (network/auth/server error), where we simply don't know
  // the status and shouldn't tell a Rider to re-verify.
  const needsVerification = notStarted || verification?.status === "pending";
  const showReminder = !isLoadingVerification && needsVerification && !reminderDismissed;

  const dismissReminder = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(VERIFICATION_REMINDER_DISMISSED_KEY, "true");
    }
    setReminderDismissed(true);
  };

  return (
    <div className="min-h-screen bg-bg-canvas">
      {showReminder && <VerificationReminderSheet onDismiss={dismissReminder} />}
      <TopBar hideOnDesktop={false} />

      <div className="px-4 md:px-6 pt-2 md:pt-6 pb-8 max-w-[480px] mx-auto flex flex-col gap-5">
        {/* Greeting */}
        <div>
          <p className="text-[14px] text-text-secondary">{getGreeting()},</p>
          <p className="font-display text-[22px] font-bold text-text-primary">
            {user?.firstName ?? "Rider"}
          </p>
        </div>

        {/* Online/Offline toggle */}
        <OnlineToggle />

        {/* Earnings stats */}
        <EarningsStatCards />

        {/* Surge alert — visible only when online */}
        {availability === "online" && <SurgeAlertBanner />}

        {/* If offline, show a prompt to go online */}
        {availability === "offline" && (
          <Card padding="md" className="text-center py-6">
            <p className="text-[28px] mb-2" aria-hidden="true">🛵</p>
            <p className="font-semibold text-[14px] text-text-primary mb-1">
              You&apos;re offline
            </p>
            <p className="text-[13px] text-text-secondary">
              Switch online to start receiving delivery jobs.
            </p>
          </Card>
        )}

        {/* Quick link to the Jobs tab */}
        {availability === "online" && (
          <Link
            href={ROUTES.riderAvailableJobs}
            className="flex items-center justify-between gap-3 bg-brand-blue text-white rounded-[14px] px-5 py-4 transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3">
              <BriefcaseIcon size={20} />
              <div>
                <p className="font-semibold text-[14px]">View Job Offers</p>
                <p className="text-[12px] text-white/70">Check for available deliveries</p>
              </div>
            </div>
            <span className="text-white/60 text-[20px]">→</span>
          </Link>
        )}
      </div>
    </div>
  );
}
