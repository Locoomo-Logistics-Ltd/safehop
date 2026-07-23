"use client";

import { useSessionBootstrap } from "@/modules/user/hooks/use-session-bootstrap";

/**
 * Bootstraps the auth session on app load. Must render inside
 * QueryProvider. Renders children immediately — screens that need to
 * gate on auth read `isInitializing` from useAuthStore themselves.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useSessionBootstrap();
  return <>{children}</>;
}
