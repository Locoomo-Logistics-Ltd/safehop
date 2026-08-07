
import { httpClient } from "@/core/api/client";
import { ENDPOINTS } from "@/core/api/endpoints";
import { ApiError } from "@/core/api/errors";

import type {
  AuthSession,
  ConsumerOnboardingPayload,
  FirstLoginResetPayload,
  LoginAdminPayload,
  LoginNodeStaffPayload,
 LoginConsumerPayload,
  LoginRiderPayload,
  RegisterConsumerPayload,
  RegisterRiderPayload,
  RequestOtpPayload,
  RiderOnboardingPayload,
 
  User,
  PasswordResetRequestPayload,
  PasswordResetConfirmPayload,
  VerifyEmailPayload,
  InviteConfirmPayload,
} from "@/core/types";



const SESSION_STORAGE_KEY = "locoomo_session";

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
    SESSION_STORAGE_KEY,
    JSON.stringify(session)
  );
}

function readPersistedSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

function clearPersistedSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

// ── Mock implementation (unchanged public shape, local-only) ────




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

  async requestConsumerOtp(payload: RequestOtpPayload): Promise<{ sent: true }> {
    await httpClient.post(ENDPOINTS.auth.consumerRequestOtp, payload, { skipAuth: true });
    return { sent: true };
  },


  async registerConsumer(
  payload: RegisterConsumerPayload
): Promise<User> {
  return httpClient.post<User>(
    ENDPOINTS.auth.consumerRegister,
    payload,
    { skipAuth: true }
  );
},

  async requestConsumerLoginOtp(target: string): Promise<{ sent: true }> {
    await httpClient.post(ENDPOINTS.auth.consumerRequestLoginOtp, { target }, { skipAuth: true });
    return { sent: true };
  },



 async loginConsumer(payload: LoginConsumerPayload): Promise<AuthSession> {
  const raw = await httpClient.post<User>(
    ENDPOINTS.auth.consumerLogin,
    payload,
    {
      skipAuth: true,
      credentials: "include",
    }
  );
// console.log("LOGIN RAW RESPONSE:", raw);
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

  async submitConsumerOnboarding(userId: string, payload: ConsumerOnboardingPayload): Promise<User> {
    return httpClient.post<User>(ENDPOINTS.identity.consumerOnboarding(userId), payload);
  },

  async registerRider(payload: RegisterRiderPayload): Promise<AuthSession> {
    const raw = await httpClient.post(ENDPOINTS.auth.riderRegister, payload, { skipAuth: true });
    const session = mapSessionResponse(raw);
    persistSession(session);
    return session;
  },

  async loginRider(payload: LoginRiderPayload): Promise<AuthSession> {
    const raw = await httpClient.post(ENDPOINTS.auth.riderLogin, payload, { skipAuth: true });
    const session = mapSessionResponse(raw);
    persistSession(session);
    return session;
  },

  async submitRiderOnboarding(userId: string, payload: RiderOnboardingPayload): Promise<User> {
    return httpClient.post<User>(ENDPOINTS.identity.riderOnboarding(userId), payload);
  },

  async loginNodeStaff(payload: LoginNodeStaffPayload): Promise<AuthSession> {
    const raw = await httpClient.post(ENDPOINTS.auth.nodeStaffLogin, payload, { skipAuth: true });
    const session = mapSessionResponse(raw);
    persistSession(session);
    return session;
  },

  async firstLoginReset(payload: FirstLoginResetPayload): Promise<AuthSession> {
    const raw = await httpClient.post(ENDPOINTS.auth.nodeStaffFirstLoginReset, payload, { skipAuth: true });
    const session = mapSessionResponse(raw);
    persistSession(session);
    return session;
  },

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
