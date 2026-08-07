"use client";

import { AdminShell, AuthGuard } from "@/components/layout";

/**
 * Layout for the (admin) route group — dashboard, orders, nodes,
 * team, disputes, analytics, settings. Wraps every screen with
 * `AuthGuard`, restricted to the "admin" role — a non-admin session
 * (or none at all) is redirected to /login rather than seeing this
 * shell. Reachable only by direct URL (/admin-login), never via
 * role-select — admin accounts are backend-provisioned.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <AdminShell>{children}</AdminShell>
    </AuthGuard>
  );
}
