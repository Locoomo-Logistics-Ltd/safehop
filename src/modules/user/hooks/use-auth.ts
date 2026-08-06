"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/core/api/services";
import { QUERY_KEYS, ROUTES } from "@/core/config/constants";
import { useAuthStore } from "@/store/auth.store";
import type { AuthSession, LoginConsumerPayload, OtpChannel, PasswordResetConfirmPayload, PasswordResetRequestPayload, RegisterConsumerPayload, VerifyEmailPayload} from "@/core/types";
import { useNotificationStore } from "@/store/notification.store";
import { getErrorMessage } from "@/core/api/errors";



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


  const registerMutation = useMutation<AuthSession, Error, RegisterConsumerPayload>({
    mutationFn: async (payload: RegisterConsumerPayload) => {
      const user = await authService.registerConsumer({ ...payload });
      return { user } as AuthSession;
    },
    onSuccess: (session) => {
      setSession(session);
      queryClient.setQueryData(QUERY_KEYS.session, session);
      
  showNotification({
    type: "success",
    title: "Account created 🎉",
    message: "Your Locoomo account is ready. Please log in.",
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

const requestPasswordResetMutation = useMutation({
  mutationFn: (payload: PasswordResetRequestPayload) =>
    authService.requestPasswordReset(payload),
});

const confirmPasswordResetMutation = useMutation({
  mutationFn: (payload: PasswordResetConfirmPayload 
  ) => authService.confirmPasswordReset(payload),
});

const verifyEmailMutation = useMutation({
  mutationFn: (payload: VerifyEmailPayload) =>
    authService.verifyEmail(payload),
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

    requestPasswordReset:requestPasswordResetMutation.mutate,
    isRequestingReset:requestPasswordResetMutation.isPending,
    requestResetError:requestPasswordResetMutation.error,isResetRequestSuccessful:requestPasswordResetMutation.isSuccess,

    confirmPasswordReset:confirmPasswordResetMutation.mutate,
    isConfirmingReset:confirmPasswordResetMutation.isPending,
    confirmResetError:confirmPasswordResetMutation.error,
    isResetSuccessful:confirmPasswordResetMutation.isSuccess,
    
    verifyEmail:verifyEmailMutation.mutate,
    isVerifyingEmail:verifyEmailMutation.isPending,

  };
}
