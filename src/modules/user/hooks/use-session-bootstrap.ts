"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { authService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { useAuthStore } from "@/store/auth.store";

/**
 * Fetches the current session on mount and syncs it into useAuthStore.
 * Call this once near the root (see AuthProvider) — feature components
 * should read state via useAuthStore / useCurrentUser, not this hook.
 */
export function useSessionBootstrap() {
  const setSession = useAuthStore((s) => s.setSession);
  const setInitializing = useAuthStore((s) => s.setInitializing);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.session,
    queryFn: () => authService.getSession(),
  });

  useEffect(() => {
    if (!isLoading) {
      setSession(data ?? null);
      setInitializing(false);
    }
  }, [data, isLoading, setSession, setInitializing]);
}
