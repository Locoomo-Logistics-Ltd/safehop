"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/core/api/services";
import { QUERY_KEYS, ROUTES } from "@/core/config/constants";
import { useAuthStore } from "@/store/auth.store";

/** Logout for the Rider module — mirrors useVendorAuth's pattern. */
export function useRiderAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      setSession(null);
      queryClient.setQueryData(QUERY_KEYS.session, null);
      router.push(ROUTES.roleSelect);
    },
  });

  return {
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
