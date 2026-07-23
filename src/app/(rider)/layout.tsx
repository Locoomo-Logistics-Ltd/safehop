"use client";

import { AppShell, AuthGuard } from "@/components/layout";
import { RIDER_NAV_ITEMS } from "@/components/layout/nav-config";

/**
 * Layout for the (rider) route group — home, jobs, deliveries,
 * profile. Wraps every screen in this group with the auth gate and
 * the responsive AppShell using the Rider nav set
 * (Home / Jobs / Earnings / Profile).
 *
 * rider-login and rider-scan intentionally live outside this group —
 * no shell/nav during login, and the scanner is a full-screen camera
 * overlay — same pattern as the User and Vendor modules.
 */
export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell navItems={RIDER_NAV_ITEMS}>{children}</AppShell>
    </AuthGuard>
  );
}
