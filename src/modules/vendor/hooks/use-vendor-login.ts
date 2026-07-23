"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/core/api/services";
import { QUERY_KEYS, ROUTES } from "@/core/config/constants";
import { useAuthStore } from "@/store/auth.store";
import { ApiError } from "@/core/api/errors";

/**
 * Drives Vendor (Node Staff) account setup/login.
 *
 * Real model: an admin provisions the account with a temporary
 * password (auth/node-staff/provision — not called from this app).
 * The vendor's very first login uses that temporary password; if the
 * backend flags it as temporary, this flow transitions into
 * first-login-reset instead of completing login — replacing the old
 * PIN-creation screen, which had no backend equivalent.
 *
 * NOTE: the real API doesn't document a response field that flags
 * "this is a temporary password" — `requiresReset` below is inferred
 * from a conventional 428/PASSWORD_RESET_REQUIRED-style error code.
 * Confirm the actual signal with the backend team and adjust
 * `isPasswordResetRequired()`.
 */
function isPasswordResetRequired(error: unknown): boolean {
  return error instanceof ApiError && (error.code === "PASSWORD_RESET_REQUIRED" || error.status === 428);
}

export function useVendorLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const [pendingReset, setPendingReset] = useState<{ email: string; temporaryPassword: string } | null>(null);

  const loginMutation = useMutation({
    mutationFn: (payload: { email: string; password: string }) => authService.loginNodeStaff(payload),
    onSuccess: (session) => {
      setSession(session);
      queryClient.setQueryData(QUERY_KEYS.session, session);
      router.push(ROUTES.vendorHome);
    },
    onError: (error, variables) => {
      if (isPasswordResetRequired(error)) {
        setPendingReset({ email: variables.email, temporaryPassword: variables.password });
      }
    },
  });

  const resetMutation = useMutation({
    mutationFn: (newPassword: string) =>
      authService.firstLoginReset({
        email: pendingReset!.email,
        temporaryPassword: pendingReset!.temporaryPassword,
        newPassword,
      }),
    onSuccess: (session) => {
      setSession(session);
      queryClient.setQueryData(QUERY_KEYS.session, session);
      router.push(ROUTES.vendorHome);
    },
  });

  return {
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: pendingReset ? null : loginMutation.error,

    requiresReset: !!pendingReset,
    resetPassword: resetMutation.mutate,
    isResetting: resetMutation.isPending,
    resetError: resetMutation.error,
  };
}
