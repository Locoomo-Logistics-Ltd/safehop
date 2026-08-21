"use client";

import { AppShell, AuthGuard } from "@/components/layout";
import { RIDER_NAV_ITEMS } from "@/components/layout/nav-config";

/**
 * Layout for the (rider) route group — home, jobs, deliveries,
 * profile, verification. Wraps every screen in this group with the
 * auth gate (restricted to the "rider" role — a mismatched or missing
 * session redirects to /login, same pattern as (admin)/layout.tsx)
 * and the responsive AppShell using the Rider nav set
 * (Home / Jobs / Earnings / Profile).
 *
 * rider-scan intentionally lives outside this group — full-screen
 * camera overlay, same pattern as the Vendor module's scan screen.
 */
export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["rider"]}>
      <AppShell navItems={RIDER_NAV_ITEMS}>{children}</AppShell>
    </AuthGuard>
  );
}
