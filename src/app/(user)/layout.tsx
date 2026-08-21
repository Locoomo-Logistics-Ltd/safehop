"use client";

import { AppShell, AuthGuard } from "@/components/layout";
import { USER_NAV_ITEMS } from "@/components/layout/nav-config";
import { PlusIcon } from "@/components/icons";
import { ROUTES } from "@/core/config/constants";

/**
 * Layout for the (user) route group — dashboard, track, profile.
 * Wraps every screen in this group with the auth gate and the
 * responsive AppShell (Sidebar on desktop, BottomNav on mobile).
 *
 * `allowedRoles={["consumer"]}` added 2026-08-13 — this was previously
 * the one route group with no role gate at all (every other role's
 * layout already restricts by role), so an Admin/Rider/NodeOperator
 * session could reach Dashboard/Checkout/Track and fire Consumer-only
 * calls like `GET /orders`, which the backend correctly rejects for a
 * non-Consumer session — surfacing as a confusing error instead of
 * simply never letting the wrong role in.
 */
export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["consumer"]}>
      <AppShell
        navItems={USER_NAV_ITEMS}
        primaryAction={{
          label: "New Delivery",
          href: ROUTES.newDelivery,
          icon: <PlusIcon size={18} />,
        }}
      >
        {children}
      </AppShell>
    </AuthGuard>
  );
}
