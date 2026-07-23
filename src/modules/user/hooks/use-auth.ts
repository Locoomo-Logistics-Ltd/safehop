"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/core/api/services";
import { QUERY_KEYS, ROUTES } from "@/core/config/constants";
import { useAuthStore } from "@/store/auth.store";
import type { AuthSession, LoginConsumerPayload, OtpChannel, RegisterConsumerPayload, User } from "@/core/types";
import { useNotificationStore } from "@/store/notification.store";
import { getErrorMessage } from "@/core/api/errors";


/**
 * Auth flow for the User (Consumer) module — matches the real API's
 * multi-step shape: request-otp → register (verify code + name,
 * password optional) → dashboard. Login mirrors it: request-login-otp
 * → login (password or code).
 *
 * Replaces the old single-shot signup form — the real backend can't
 * create an account without OTP verification first.
 */
export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const [target, setTarget] = useState("");
  const showNotification = useNotificationStore(
  (state) => state.showNotification
);

  // ── Sign up ──────────────────────────────────────────────────
  const requestSignUpOtpMutation = useMutation({
    mutationFn: ({ target: t, channel }: { target: string; channel: OtpChannel }) => {
      setTarget(t);
      return authService.requestConsumerOtp({ target: t, channel });
    },
  });

  // const registerMutation = useMutation({
  //   mutationFn: (payload: { fullName: string; code: string; password?: string }) =>
  //     authService.registerConsumer({ target, ...payload }),
  //   onSuccess: (session) => {
  //     setSession(session);
  //     queryClient.setQueryData(QUERY_KEYS.session, session);
  //     router.push(ROUTES.dashboard);
  //   },
  // });
  const registerMutation = useMutation<AuthSession, Error, RegisterConsumerPayload>({
    mutationFn: (payload: RegisterConsumerPayload) =>
      authService.registerConsumer({  ...payload }),
    onSuccess: (session) => {
      setSession(session);
      queryClient.setQueryData(QUERY_KEYS.session, session);
      
 showNotification({
  type: "success",
  title: "Account created 🎉",
  message:
    "Your Locoomo account is ready. You can now log in and start sending parcels.",
});
      router.push(ROUTES.login);
    },
  });

  // ── Log in ───────────────────────────────────────────────────
  const requestLoginOtpMutation = useMutation({
    mutationFn: (t: string) => {
      setTarget(t);
      return authService.requestConsumerLoginOtp(t);
    },
  });

  const loginMutation = useMutation({
    mutationFn: (payload: LoginConsumerPayload) =>
      authService.loginConsumer({ ...payload }),
    onSuccess: (session) => {
      setSession(session);
      queryClient.setQueryData(QUERY_KEYS.session, session);
      showNotification({
  type: "success",
  title: `Welcome back, ${session.user.firstName}! 👋`,
  message:
    "You are successfully logged in. Let's get your delivery moving.",
});
      router.push(
 ROUTES.dashboard
);

    },
    onError: (error) => {
    showNotification({
      type: "error",
      title: "Login failed 🔐",
      message: getErrorMessage(error),
    });
  },
  });

  // ── Log out (shared) ─────────────────────────────────────────
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      setSession(null);
      queryClient.setQueryData(QUERY_KEYS.session, null);
      router.push(ROUTES.roleSelect);
    },
  });

  return {
    target,

    requestSignUpOtp: requestSignUpOtpMutation.mutate,
    isRequestingSignUpOtp: requestSignUpOtpMutation.isPending,
    requestSignUpOtpError: requestSignUpOtpMutation.error,
    signUpOtpSent: requestSignUpOtpMutation.isSuccess,

    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,

    requestLoginOtp: requestLoginOtpMutation.mutate,
    isRequestingLoginOtp: requestLoginOtpMutation.isPending,
    requestLoginOtpError: requestLoginOtpMutation.error,
    loginOtpSent: requestLoginOtpMutation.isSuccess,

    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,

    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
