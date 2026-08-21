
import { httpClient } from "@/core/api/client";
import { ENDPOINTS } from "@/core/api/endpoints";
import { ApiError } from "@/core/api/errors";
import { STORAGE_KEYS } from "@/core/config/constants";

import type {
  AuthSession,
  LoginAdminPayload,
  LoginConsumerPayload,
  RegisterConsumerPayload,
  User,
  PasswordResetRequestPayload,
  PasswordResetConfirmPayload,
  VerifyEmailPayload,
  InviteConfirmPayload,
} from "@/core/types";



// ── Shared response mapping (real API) ──────────────────────────

/** Adjust this mapping once you've confirmed the real response shape. */
function mapSessionResponse(raw: unknown): AuthSession {
  // const response = raw as {
  //   success?: boolean;
  //   data?: Partial<User>;
  // };



  // const user = response.data ?? (raw as Partial<User>);
  const user = raw as User;

  if (!user?.id) {
    throw new ApiError({
      message: "Unexpected response from server; missing user data.",
      code: "MALFORMED_RESPONSE",
    });
  }


  return {user
    // user: {
    //   id: user.id,
    //   firstName: user.firstName ?? "",
    //   lastName: user.lastName ?? "",
    //   email: user.email ?? "",
    //   phone: user.phone ?? "",
    //   role: user.role ?? "user",
    //   status: user.status,
    //   emailVerifiedAt: user.emailVerifiedAt,
    //   createdAt: user.createdAt ?? new Date().toISOString(),
    // },
  };
}

function persistSession(session: AuthSession) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    STORAGE_KEYS.session,
    JSON.stringify(session)
  );
}

function readPersistedSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEYS.session);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

function clearPersistedSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEYS.session);
}

// ── Real implementation ──────────────────────────────────────────

const realAuthService = {
  // These three stay for interface parity with the mock but aren't
  // the real flow — real signup is requestConsumerOtp → registerConsumer.
  async signUp(): Promise<AuthSession> {
    throw new ApiError({ message: "Use requestConsumerOtp + registerConsumer instead.", code: "NOT_IMPLEMENTED" });
  },
  async login(): Promise<AuthSession> {
    throw new ApiError({ message: "Use loginConsumer instead.", code: "NOT_IMPLEMENTED" });
  },
  async loginWithGoogle(): Promise<AuthSession> {
    throw new ApiError({ message: "Use the NextAuth Google sign-in flow.", code: "NOT_IMPLEMENTED" });
  },

  /**
   * Self-registration for Consumer, Rider, or NodeOperator — one
   * shared route (`POST /auth/register`), differing only in
   * `payload.role`. Per docs/API.md, this does **not** log the user
   * in (no session cookies are set) — callers must send the user to
   * login next.
   */
  async registerConsumer(
  payload: RegisterConsumerPayload
): Promise<User> {
  return httpClient.post<User>(
    ENDPOINTS.auth.consumerRegister,
    payload,
    { skipAuth: true }
  );
},

 /**
  * Shared login for Consumer/Rider/NodeOperator via the one public
  * `/login` screen. Admin has its own separate, URL-only entry point
  * (`/admin-login` → `loginAdmin` below) — since `POST /auth/login` is
  * role-agnostic per docs/API.md, an Admin account's real credentials
  * would otherwise succeed here too, land a session cookie, and then
  * get silently bounced by `(user)/layout.tsx`'s `AuthGuard`
  * (`allowedRoles={["consumer"]}`) straight back to `/login` — a
  * confusing "it said successful but nothing happened" loop. Mirrors
  * `loginAdmin`'s own reverse check: wrong role → revoke the
  * cookies this call just issued and throw the same generic
  * `INVALID_CREDENTIALS` every other wrong-login reason already uses,
  * rather than a distinct message that would leak "this email belongs
  * to an admin account."
  */
 async loginConsumer(payload: LoginConsumerPayload): Promise<AuthSession> {
  const raw = await httpClient.post<User>(
    ENDPOINTS.auth.consumerLogin,
    payload,
    {
      skipAuth: true,
      credentials: "include",
    }
  );

  if (raw?.role === "admin") {
    await httpClient
      .post(ENDPOINTS.auth.sessionLogout, undefined, { credentials: "include" })
      .catch(() => {});
    throw new ApiError({
      message: "The email or password doesn't match our records.",
      code: "INVALID_CREDENTIALS",
    });
  }

  const session = mapSessionResponse(raw);
  persistSession(session);

  return session;
},

async requestPasswordReset(
  payload: PasswordResetRequestPayload
): Promise<void> {
  await httpClient.post(
    ENDPOINTS.auth.passwordResetRequest,
    payload,
    {
      skipAuth: true,
    }
  );
},

async confirmPasswordReset(
  payload: PasswordResetConfirmPayload
): Promise<void> {
  await httpClient.post(
    ENDPOINTS.auth.passwordResetConfirm,
    payload,
    {
      skipAuth: true,
    }
  );
},

async verifyEmail(
  payload: VerifyEmailPayload
): Promise<void> {
  await httpClient.post(
    ENDPOINTS.auth.verifyEmail,
    payload,
    {
      skipAuth: true,
    }
  );
},

async confirmInvite(
  payload: InviteConfirmPayload
): Promise<void> {
  await httpClient.post(
    ENDPOINTS.auth.inviteConfirm,
    payload,
    {
      skipAuth: true,
    }
  );
},

  // Rider and NodeOperator registration/login previously
  // called undocumented routes (/auth/rider/register,
  // /auth/rider/login, /auth/node-staff/login,
  // /auth/node-staff/first-login-reset) — removed. Both roles now
  // share `registerConsumer` (role: "rider" / "node_operator") and
  // `loginConsumer` above, matching docs/API.md's single, role-agnostic
  // /auth/register and /auth/login.

  /**
   * Admin has no dedicated backend login route — per docs/API.md,
   * POST /auth/login is role-agnostic and returns whatever role the
   * account has, so this reuses the same endpoint as `loginConsumer`.
   * Since the admin login screen is a separate, URL-only entry point
   * (not reachable via role-select), a non-admin account succeeding
   * here would otherwise get real session cookies without ever
   * landing in `useAuthStore` correctly scoped — so the role is
   * checked client-side and the session is revoked server-side if it
   * doesn't match, rather than silently persisting a mismatched role.
   */
  async loginAdmin(payload: LoginAdminPayload): Promise<AuthSession> {
    const raw = await httpClient.post<User>(
      ENDPOINTS.auth.consumerLogin,
      payload,
      { skipAuth: true, credentials: "include" }
    );

    if (raw?.role !== "admin") {
      await httpClient
        .post(ENDPOINTS.auth.sessionLogout, undefined, { credentials: "include" })
        .catch(() => {});
      throw new ApiError({
        message: "This account doesn't have admin access.",
        code: "INVALID_CREDENTIALS",
      });
    }

    const session = mapSessionResponse(raw);
    persistSession(session);
    return session;
  },

async refreshSession(): Promise<AuthSession> {
  const raw = await httpClient.post<User>(
    ENDPOINTS.auth.sessionRefresh,
    undefined,
    {
      credentials: "include",
    }
  );

  const session = mapSessionResponse(raw);

  persistSession(session);

  return session;
},

  async getSession(): Promise<AuthSession | null> {
    // The real API has no session-validation endpoint (no /auth/me) —
    // sessions are trusted from local storage until a call 401s, at
    // which point refreshSession() (or a redirect to login) kicks in.
    return readPersistedSession();
  },

 async logout(): Promise<void> {
 await httpClient.post(
    ENDPOINTS.auth.sessionLogout,
    undefined,
    {
        credentials: "include",
    }
);
  clearPersistedSession();
}
};

export const authService = realAuthService;
