"use client"
import { RootTopBar } from "@/components/layout";
import { ROUTES } from "@/core/config/constants";
import { DashboardHeader } from "./DashboardHeader";
import { ActiveDeliveriesSection } from "./ActiveDeliveriesSection";
import { PastDeliveriesSection } from "./PastDeliveriesSection";

/**
 * User Dashboard — the home screen after login.
 * Thin composition only; each section owns its own data fetching.
 */
export function DashboardScreen() {
  return (
    <div className="pb-6">
      <RootTopBar profileHref={ROUTES.profile} />
      <DashboardHeader />
      <ActiveDeliveriesSection />
      <PastDeliveriesSection />
    </div>
  );
}
