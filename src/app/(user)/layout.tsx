"use client";

import { AppShell, AuthGuard } from "@/components/layout";
import { USER_NAV_ITEMS } from "@/components/layout/nav-config";
import { PlusIcon } from "@/components/icons";
import { ROUTES } from "@/core/config/constants";

/**
 * Layout for the (user) route group — dashboard, track, profile.
 * Wraps every screen in this group with the auth gate and the
 * responsive AppShell (Sidebar on desktop, BottomNav on mobile).
 */
export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
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
