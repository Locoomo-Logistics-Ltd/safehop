"use client";

import Link from "next/link";
import { TopBar } from "@/components/layout";
import { Card } from "@/components/ui";
import { BriefcaseIcon } from "@/components/icons";
import { ROUTES } from "@/core/config/constants";
import { useCurrentUser } from "@/store/auth.store";
import { useRiderAvailability } from "@/modules/rider/hooks/use-rider-availability";
import { OnlineToggle } from "./OnlineToggle";
import { EarningsStatCards } from "./EarningsStatCards";
import { SurgeAlertBanner } from "./SurgeAlertBanner";

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

  return (
    <div className="min-h-screen bg-bg-canvas">
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
            href={ROUTES.riderJobOffer}
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
