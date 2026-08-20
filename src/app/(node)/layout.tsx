"use client";

import { AppShell, AuthGuard } from "@/components/layout";
import { NODE_NAV_ITEMS } from "@/components/layout/nav-config";

/**
 * Layout for the (node) route group — home, scan, activity, profile,
 * setup. Wraps every screen in this group with the auth gate
 * (restricted to the "node_operator" role — a mismatched or missing
 * session redirects to /login, same pattern as (admin)/layout.tsx) and
 * the responsive AppShell using the Node Operator nav set (Home / Scan
 * / Activity / Profile).
 */
export default function NodeLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["node_operator"]}>
      <AppShell navItems={NODE_NAV_ITEMS}>{children}</AppShell>
    </AuthGuard>
  );
}
