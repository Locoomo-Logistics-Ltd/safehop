"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { ROUTES } from "@/core/config/constants";
import type { UserRole } from "@/core/types";

interface AuthGuardProps {
  children: React.ReactNode;
  /** Restrict this route group to specific roles. Omit to allow any authenticated session. */
  allowedRoles?: UserRole[];
}

/**
 * Gate for authenticated-only routes. Renders nothing while the
 * session is still being resolved (avoids a flash of redirect), then
 * either renders children or pushes to /login. When `allowedRoles` is
 * set, a session whose role isn't in the list is redirected to
 * /login the same way as no session at all — the API's own
 * enumeration-avoidance stance (don't reveal what's wrong) applies
 * here too.
 */
export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const role = session?.user.role;
  const roleAllowed = !allowedRoles || (!!role && allowedRoles.includes(role));

  useEffect(() => {
    if (isInitializing) return;
    if (!session || !roleAllowed) {
      router.replace(ROUTES.login);
    }
  }, [isInitializing, session, roleAllowed, router]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-canvas">
        <div className="w-8 h-8 rounded-full border-2 border-border-default border-t-brand-blue animate-spin" />
      </div>
    );
  }

  if (!session || !roleAllowed) return null;

  return <>{children}</>;
}
