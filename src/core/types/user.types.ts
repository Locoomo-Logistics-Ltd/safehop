/**
 * Core User domain types.
 * These represent the canonical shape of a user across the platform,
 * regardless of role. Role-specific profile data extends this base.
 */

/** Matches the real backend's role enum exactly — see docs/API.md's `POST /auth/register`. */
export type UserRole = "consumer" | "node_operator" | "rider" | "admin";

export interface User {

  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  status?: string;
  emailVerifiedAt?: string | null;
  createdAt: string;
  avatarUrl?: string;

}

export interface AuthSession {
  user: User;
}
export interface PasswordResetRequestPayload {
    email: string;
}

export interface PasswordResetConfirmPayload {
    token: string;
    password: string;
    passwordConfirmation: string;
}

export interface VerifyEmailPayload {
    token: string;
}

export interface InviteConfirmPayload {
    token: string;
    password: string;
    passwordConfirmation: string;
    consentAccepted: boolean;
}

/**
 * Shared self-registration payload for `POST /auth/register` — one
 * endpoint for Consumer, Rider, and NodeOperator per docs/API.md,
 * differing only in `role` (optional, defaults to `consumer`).
 */
export interface RegisterConsumerPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirmation: string;
  consentAccepted: boolean;
  role?: Extract<UserRole, "consumer" | "node_operator" | "rider">;
}

export interface LoginConsumerPayload {
 email: string;
  password: string;
}

// Rider and NodeOperator self-registration now go through the same
// RegisterConsumerPayload/POST /auth/register above (with
// `role: "rider"` / `role: "node_operator"`) and the same
// LoginConsumerPayload/POST /auth/login below — see docs/API.md.
// Post-login onboarding is handled separately: riders.onboarding
// (core/types/rider.types.ts) and node-operators.onboarding
// (core/types/node.types.ts).

// ── Real API-aligned Admin auth flow ─────────────────────────────
// Admin accounts are backend-provisioned (POST /users/invite by an
// existing Admin, not self-registered) and log in via the same
// generic POST /auth/login every other role uses — see
// `authService.loginAdmin`.

export interface LoginAdminPayload {
  email: string;
  password: string;
}
