"use client";

import { AppShell, AuthGuard } from "@/components/layout";
import { VENDOR_NAV_ITEMS } from "@/components/layout/nav-config";

/**
 * Layout for the (vendor) route group — home, scan, activity,
 * parcels, profile. Wraps every screen in this group with the auth
 * gate and the responsive AppShell using the Vendor nav set
 * (Home / Scan / Activity / Profile).
 *
 * vendor-setup (PIN creation) intentionally lives outside this group
 * — no shell/nav during onboarding, same pattern as role-select/login
 * for the User module.
 */
export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell navItems={VENDOR_NAV_ITEMS}>{children}</AppShell>
    </AuthGuard>
  );
}
