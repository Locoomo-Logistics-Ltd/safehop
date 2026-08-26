"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService, nodeService } from "@/core/api/services";
import { QUERY_KEYS, ROUTES } from "@/core/config/constants";
import { useAuthStore } from "@/store/auth.store";
import type { InviteConfirmPayload, LoginConsumerPayload, PasswordResetConfirmPayload, PasswordResetRequestPayload, RegisterConsumerPayload, User, VerifyEmailPayload} from "@/core/types";
import { useNotificationStore } from "@/store/notification.store";
import { getErrorMessage } from "@/core/api/errors";



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
      // role to its own post-login destination. Rider lands on Home
      // (not forced into verification) — RiderHomeScreen nudges an
      // unverified Rider with a dismissible reminder instead, and
      // AvailableJobsScreen blocks the one feature that actually
      // requires approval.
      //
      // NodeOperator is the one role whose destination depends on a
      // second fetch: an approved (`status: "active"`) Node lands
      // straight on its real dashboard (`nodeHome`) instead of being
      // routed through Setup every time, per explicit product
      // direction 2026-08-21 — a Node that's already up and running
      // shouldn't see its onboarding screen first on every login. Not
      // yet approved (`pending`) or not onboarded at all (`GET
      // /node-operators/me` 404s) still lands on `nodeSetup`, which
      // already renders the correct state (onboarding form or
      // "waiting for approval") either way.
      if (session.user.role === "node_operator") {
        try {
          const { node } = await nodeService.getMyNodeOperatorProfile();
          router.push(node.status === "active" ? ROUTES.nodeHome : ROUTES.nodeSetup);
        } catch {
          router.push(ROUTES.nodeSetup);
        }
        return;
      }

      // `admin` isn't a real key here — authService.loginConsumer()
      // now rejects an Admin account's credentials outright (see its
      // own header comment) rather than ever resolving with that role,
      // so `UserRole` still includes it structurally but this branch
      // can't actually be reached. `Partial` (not `Record`) reflects
      // that honestly instead of listing a redirect that would never
      // fire.
      const roleRedirect: Partial<Record<typeof session.user.role, string>> = {
        consumer: ROUTES.dashboard,
        rider: ROUTES.riderHome,
      };
      router.push(roleRedirect[session.user.role] ?? ROUTES.dashboard);
    },
    onError: (error) => {
    showNotification({
      type: "error",
      title: "Login failed",
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
