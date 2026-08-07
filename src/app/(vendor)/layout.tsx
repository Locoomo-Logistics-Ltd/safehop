"use client";

import { AppShell, AuthGuard } from "@/components/layout";
import { VENDOR_NAV_ITEMS } from "@/components/layout/nav-config";

/**
 * Layout for the (vendor) route group — home, scan, activity,
 * parcels, profile, node-setup. Wraps every screen in this group with
 * the auth gate (restricted to the "node_operator" role — a
 * mismatched or missing session redirects to /login, same pattern as
 * (admin)/layout.tsx) and the responsive AppShell using the Vendor
 * nav set (Home / Scan / Activity / Profile).
 */
export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["node_operator"]}>
      <AppShell navItems={VENDOR_NAV_ITEMS}>{children}</AppShell>
    </AuthGuard>
  );
}
