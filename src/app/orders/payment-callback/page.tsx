"use client";

import { AuthGuard } from "@/components/layout";
import { PaymentCallbackScreen } from "@/modules/user/components/tracking";

/**
 * Where Paystack redirects after any checkout — `{FRONTEND_URL}/orders/
 * payment-callback`, a fixed URL the backend controls, so this route
 * has to accept whoever it lands on.
 *
 * **Deliberately outside the `(user)` route group** (2026-09-03). It
 * lived there until a Node dispatch started coming back through the
 * same URL: that group is gated `allowedRoles={["consumer"]}`, so an
 * operator returning from Paystack was bounced to `/login` before the
 * screen could tell them their payment went through. The URL is
 * unchanged — `(user)` was a route group, not a path segment.
 *
 * Keeps an `AuthGuard` with no role list: a session is still required
 * (both branches of the screen call authenticated endpoints, or name
 * screens behind their own guards), but which role it is no longer
 * decides admission — the screen itself branches. No `AppShell` either,
 * same reasoning as `/node-scan`: this is a terminal landing page that
 * routes onward, and role-specific nav chrome would be wrong for at
 * least one of the two flows arriving here.
 */
export default function PaymentCallbackPage() {
  return (
    <AuthGuard>
      <PaymentCallbackScreen />
    </AuthGuard>
  );
}
