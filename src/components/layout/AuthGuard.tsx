"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { ROUTES } from "@/core/config/constants";

/**
 * Gate for authenticated-only routes. Renders nothing while the
 * session is still being resolved (avoids a flash of redirect), then
 * either renders children or pushes to /login.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const isInitializing = useAuthStore((s) => s.isInitializing);

  useEffect(() => {
    if (!isInitializing && !session) {
      router.replace(ROUTES.login);
    }
  }, [isInitializing, session, router]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-canvas">
        <div className="w-8 h-8 rounded-full border-2 border-border-default border-t-brand-blue animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return <>{children}</>;
}
