"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/core/api/services";
import { QUERY_KEYS, ROUTES } from "@/core/config/constants";
import { useAuthStore } from "@/store/auth.store";
import type { LoginAdminPayload } from "@/core/types";
import { useNotificationStore } from "@/store/notification.store";
import { getErrorMessage } from "@/core/api/errors";

/** Admin login only — admin accounts are backend-provisioned, there is no admin sign-up flow. */
export function useAdminAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const showNotification = useNotificationStore((s) => s.showNotification);

  const loginMutation = useMutation({
    mutationFn: (payload: LoginAdminPayload) => authService.loginAdmin(payload),
    onSuccess: (session) => {
      setSession(session);
      queryClient.setQueryData(QUERY_KEYS.session, session);
      showNotification({
        type: "success",
        title: `Welcome back, ${session.user.firstName} 👋`,
        message: "You're signed in to the admin console.",
      });
      router.push(ROUTES.adminDashboard);
    },
    onError: (error) => {
      showNotification({
        type: "error",
        title: "Login failed 🔐",
        message: getErrorMessage(error),
      });
    },
  });

  return {
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
  };
}
