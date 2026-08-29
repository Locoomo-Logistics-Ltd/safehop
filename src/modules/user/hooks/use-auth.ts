"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/core/api/services";
import { QUERY_KEYS, ROUTES } from "@/core/config/constants";
import { useAuthStore } from "@/store/auth.store";
import type { GoogleAuthPayload, InviteConfirmPayload, LoginConsumerPayload, PasswordResetConfirmPayload, PasswordResetRequestPayload, RegisterConsumerPayload, User, VerifyEmailPayload} from "@/core/types";
import { useNotificationStore } from "@/store/notification.store";
import { getErrorMessage } from "@/core/api/errors";
import { resolvePostAuthRoute } from "@/modules/user/lib/auth-routing";



export function useAuth() {
 
  const router = useRouter();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const showNotification = useNotificationStore(
  (state) => state.showNotification
);

  // ── Sign up ──────────────────────────────────────────────────
  // Per docs/API.md, registration does NOT log the user in — no
  // session cookies are set. Don't call setSession here; send the
  // user to login next.
  const registerMutation = useMutation<User, Error, RegisterConsumerPayload>({
    mutationFn: (payload: RegisterConsumerPayload) => authService.registerConsumer(payload),
    onSuccess: () => {
      showNotification({
        type: "success",
        title: "Account created",
        message: "Your Locoomo account is ready. Please log in.",
      });
      router.push(ROUTES.login);
    },
  });

  // ── Log in ───────────────────────────────────────────────────
  const loginMutation = useMutation({
    mutationFn: (payload: LoginConsumerPayload) =>
      authService.loginConsumer({ ...payload }),
    onSuccess: async (session) => {
      setSession(session);
      queryClient.setQueryData(QUERY_KEYS.session, session);
      showNotification({
  type: "success",
  title: `Welcome back, ${session.user.firstName}!`,
  message:
    "You are successfully logged in. Let's get your delivery moving.",
});
      // POST /auth/login is role-agnostic (docs/API.md) — route each
      // role to its own post-login destination via the shared
      // resolvePostAuthRoute (Rider lands on Home, not forced into
      // verification — RiderHomeScreen nudges an unverified Rider with
      // a dismissible reminder instead, and AvailableJobsScreen blocks
      // the one feature that actually requires approval; NodeOperator's
      // destination depends on a second fetch — see that helper's
      // header comment). Registration no longer collects `phone` at
      // all (docs/API.md) — any account still missing one is sent to
      // complete it first, same gate `loginWithGoogle` uses below.
      if (!session.user.phone) {
        router.push(ROUTES.completeProfile);
        return;
      }
      router.push(await resolvePostAuthRoute(session.user));
    },
    onError: (error) => {
    showNotification({
      type: "error",
      title: "Login failed",
      message: getErrorMessage(error),
    });
  },
  });

  // ── Log in / sign up with Google ──────────────────────────────
  // `POST /auth/google` (docs/API.md) — one endpoint for both signup
  // and login, distinguished server-side by whether the verified
  // Google account is already linked to a user. Unlike registerConsumer,
  // this logs the user in immediately (session cookies set even on a
  // brand-new account), so there's no separate "now go log in" step.
  const loginWithGoogleMutation = useMutation({
    mutationFn: (payload: GoogleAuthPayload) => authService.loginWithGoogle(payload),
    onSuccess: async (session) => {
      setSession(session);
      queryClient.setQueryData(QUERY_KEYS.session, session);
      showNotification({
        type: "success",
        title: `Welcome, ${session.user.firstName}!`,
        message: "You're signed in with Google.",
      });

      // Google never supplies a phone number — every fresh account
      // comes back `phone: null` (docs/API.md) — so this is the
      // expected path on first-ever Google signup, not just a gap.
      if (!session.user.phone) {
        router.push(ROUTES.completeProfile);
        return;
      }
      router.push(await resolvePostAuthRoute(session.user));
    },
    onError: (error) => {
      showNotification({
        type: "error",
        title: "Google sign-in failed",
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
      router.push(ROUTES.login);
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

const confirmInviteMutation = useMutation({
  mutationFn: (payload: InviteConfirmPayload) =>
    authService.confirmInvite(payload),
});

  return {
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,

    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,

    loginWithGoogle: loginWithGoogleMutation.mutate,
    isLoggingInWithGoogle: loginWithGoogleMutation.isPending,
    loginWithGoogleError: loginWithGoogleMutation.error,

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
    verifyEmailError:verifyEmailMutation.error,
    isEmailVerified:verifyEmailMutation.isSuccess,

    confirmInvite: confirmInviteMutation.mutate,
    isConfirmingInvite: confirmInviteMutation.isPending,
    confirmInviteError: confirmInviteMutation.error,
    isInviteConfirmed: confirmInviteMutation.isSuccess,

  };
}
