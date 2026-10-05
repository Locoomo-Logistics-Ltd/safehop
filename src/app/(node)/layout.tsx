"use client";

import { AppShell, AuthGuard } from "@/components/layout";
import { NODE_NAV_ITEMS, NODE_STAFF_NAV_ITEMS } from "@/components/layout/nav-config";
import { useCurrentUser } from "@/store/auth.store";

/**
 * Layout for the (node) route group — home, scan, activity, earnings,
 * My Nodes, profile. Wraps every screen in this group with the auth
 * gate and the responsive AppShell using the Node nav set.
 *
 * Two roles live here, not one (docs/API.md, 2026-09-02): the
 * `node_operator` who owns the Nodes, and the `node_staff` they invite
 * to work a counter. Every handoff endpoint these screens call admits
 * both, so they share the same shell — the difference is which nav
 * items render (Earnings is owner-only: `GET /earnings/my-node` answers
 * `403` for a staff session) and which owner-only surfaces each screen
 * shows, not what this guard lets through.
 */
export default function NodeLayout({ children }: { children: React.ReactNode }) {
  const user = useCurrentUser();
  const navItems = user?.role === "node_staff" ? NODE_STAFF_NAV_ITEMS : NODE_NAV_ITEMS;

  return (
    <AuthGuard allowedRoles={["node_operator", "node_staff"]}>
      <AppShell navItems={navItems}>{children}</AppShell>
    </AuthGuard>
  );
}
