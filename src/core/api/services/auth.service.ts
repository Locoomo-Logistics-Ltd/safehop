import { env } from "@/core/config/env";
import { httpClient } from "@/core/api/client";
import { ENDPOINTS } from "@/core/api/endpoints";
import { ApiError } from "@/core/api/errors";
import { mockDelay, generateId } from "@/core/mocks/mock-utils";
import type {
  AuthSession,
  ConsumerOnboardingPayload,
  FirstLoginResetPayload,
  LoginConsumerPayload,
  LoginNodeStaffPayload,
  LoginPayload,
  LoginRiderPayload,
  RegisterConsumerPayload,
  RegisterRiderPayload,
  RequestOtpPayload,
  RiderOnboardingPayload,
  SignUpPayload,
  User,
} from "@/core/types";

/**
 * Auth service — covers all three roles' real auth flows:
 *   Consumer (User): request-otp → register → (optional) onboarding
 *   Rider:           register (password, no OTP) → onboarding (KYC)
 *   Node Staff (Vendor): admin-provisioned → login → first-login-reset
 *
 * Every screen calls these functions, never the network directly. The
 * exported object switches its implementation based on env.useMockApi.
 *
 * NOTE ON RESPONSE SHAPES: the live spec at dev.locoomo.com/api/v1/docs
 * does not document response bodies (no @ApiOkResponse schema on most
 * routes). The real* functions below assume a conventional
 * `{ user, accessToken, refreshToken }` shape — confirm against an
 * actual response once you can call the live API, and adjust the
 * `mapSessionResponse()` helper below if the real shape differs. That
 * one function is the only place a mismatch needs fixing.
 */

const SESSION_STORAGE_KEY = "locoomo_session";

// ── Shared response mapping (real API) ──────────────────────────

/** Adjust this mapping once you've confirmed the real response shape. */
function mapSessionResponse(raw: unknown): AuthSession {
  const data = raw as {
    user?: Partial<User>;
    accessToken?: string;
    access_token?: string;
    refreshToken?: string;
    refresh_token?: string;
  };

  const user = data.user;
  if (!user) {
    throw new ApiError({
      message: "Unexpected response from server — missing user data.",
      code: "MALFORMED_RESPONSE",
    });
  }

  return {
    user: {
      id: user.id ?? "",
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      role: user.role ?? "user",
      createdAt: user.createdAt ?? new Date().toISOString(),
    },
    accessToken: data.accessToken ?? data.access_token ?? "",
    refreshToken: data.refreshToken ?? data.refresh_token,
    expiresAt: Date.now() + 1000 * 60 * 60 * 24, // real expiry should come from the JWT itself
  };
}

function persistSession(session: AuthSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
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

function buildMockUser(payload: Partial<SignUpPayload> & { role?: User["role"] }): User {
  return {
    id: generateId("usr"),
    firstName: payload.firstName ?? "Tunde",
    lastName: payload.lastName ?? "Onakayo",
    email: payload.email ?? "tunde@example.com",
    phone: payload.phone ?? "+2348012345678",
    role: payload.role ?? "user",
    createdAt: new Date().toISOString(),
  };
}

const mockAuthService = {
  // Legacy single-shot mock flow — kept so the app runs fully offline
  // without a backend. See real* methods below for the true multi-step
  // flows used once NEXT_PUBLIC_USE_MOCK_API=false.
  async signUp(payload: SignUpPayload): Promise<AuthSession> {
    await mockDelay();
    if (!payload.email.includes("@")) {
      throw new ApiError({
        message: "Please enter a valid email address.",
        status: 400,
        code: "VALIDATION_ERROR",
        fieldErrors: { email: "Invalid email address" },
      });
    }
    const session: AuthSession = {
      user: buildMockUser(payload),
      accessToken: generateId("mock_token"),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24,
    };
    persistSession(session);
    return session;
  },

  async login(payload: LoginPayload): Promise<AuthSession> {
    await mockDelay();
    if (!payload.email.includes("@") || payload.password.length < 4) {
      throw new ApiError({
        message: "Incorrect email or password.",
        status: 401,
        code: "INVALID_CREDENTIALS",
      });
    }
    const session: AuthSession = {
      user: buildMockUser({ email: payload.email }),
      accessToken: generateId("mock_token"),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24,
    };
    persistSession(session);
    return session;
  },

  async loginWithGoogle(): Promise<AuthSession> {
    await mockDelay();
    const session: AuthSession = {
      user: buildMockUser({ firstName: "Tunde", lastName: "Onakayo", email: "tunde.onakayo@gmail.com" }),
      accessToken: generateId("mock_token"),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24,
    };
    persistSession(session);
    return session;
  },

  // Real-shaped flows, mocked — so the UI's actual multi-step screens
  // (OTP request/verify, rider register, vendor first-login-reset) can
  // be developed and tested before the backend is wired in.
  async requestConsumerOtp(): Promise<{ sent: true }> {
    await mockDelay(500);
    return { sent: true };
  },

  async registerConsumer(payload: RegisterConsumerPayload): Promise<AuthSession> {
    await mockDelay();
    if (payload.code.length !== 6) {
      throw new ApiError({ message: "Enter the 6-digit code.", status: 400, code: "INVALID_OTP" });
    }
    const session: AuthSession = {
      user: buildMockUser({ firstName: payload.fullName.split(" ")[0], lastName: payload.fullName.split(" ")[1] ?? "" }),
      accessToken: generateId("mock_token"),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24,
    };
    persistSession(session);
    return session;
  },

  async requestConsumerLoginOtp(): Promise<{ sent: true }> {
    await mockDelay(500);
    return { sent: true };
  },

  async loginConsumer(payload: LoginConsumerPayload): Promise<AuthSession> {
    await mockDelay();
    if (!payload.password && !payload.code) {
      throw new ApiError({ message: "Enter your password or OTP code.", status: 400, code: "VALIDATION_ERROR" });
    }
    const session: AuthSession = {
      user: buildMockUser({ email: payload.target.includes("@") ? payload.target : undefined, phone: !payload.target.includes("@") ? payload.target : undefined }),
      accessToken: generateId("mock_token"),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24,
    };
    persistSession(session);
    return session;
  },

  async submitConsumerOnboarding(_userId: string, payload: ConsumerOnboardingPayload): Promise<User> {
    await mockDelay();
    return buildMockUser({ firstName: payload.firstName, lastName: payload.lastName, email: payload.email, phone: payload.phone });
  },

  async registerRider(payload: RegisterRiderPayload): Promise<AuthSession> {
    await mockDelay();
    const session: AuthSession = {
      user: buildMockUser({ firstName: payload.firstName, lastName: payload.lastName, email: payload.email, phone: payload.phone, role: "rider" }),
      accessToken: generateId("mock_token"),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24,
    };
    persistSession(session);
    return session;
  },

  async loginRider(payload: LoginRiderPayload): Promise<AuthSession> {
    await mockDelay();
    if (payload.password.length < 4) {
      throw new ApiError({ message: "Incorrect phone or password.", status: 401, code: "INVALID_CREDENTIALS" });
    }
    const session: AuthSession = {
      user: buildMockUser({ firstName: "Emeka", lastName: "Nwosu", phone: payload.target, role: "rider" }),
      accessToken: generateId("mock_token"),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24,
    };
    persistSession(session);
    return session;
  },

  async submitRiderOnboarding(): Promise<User> {
    await mockDelay();
    return buildMockUser({ firstName: "Emeka", lastName: "Nwosu", role: "rider" });
  },

  async loginNodeStaff(payload: LoginNodeStaffPayload): Promise<AuthSession> {
    await mockDelay();
    if (payload.password.length < 4) {
      throw new ApiError({ message: "Incorrect email or password.", status: 401, code: "INVALID_CREDENTIALS" });
    }
    // Simulate a temporary/first-login password so the reset flow is
    // testable offline — try logging in with password "temp1234".
    if (payload.password === "temp1234") {
      throw new ApiError({
        message: "This is a temporary password — please set a new one.",
        status: 428,
        code: "PASSWORD_RESET_REQUIRED",
      });
    }
    const session: AuthSession = {
      user: buildMockUser({ email: payload.email, role: "vendor" }),
      accessToken: generateId("mock_token"),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24,
    };
    persistSession(session);
    return session;
  },

  async firstLoginReset(payload: FirstLoginResetPayload): Promise<AuthSession> {
    await mockDelay();
    const session: AuthSession = {
      user: buildMockUser({ email: payload.email, role: "vendor" }),
      accessToken: generateId("mock_token"),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24,
    };
    persistSession(session);
    return session;
  },

  async refreshSession(): Promise<AuthSession> {
    await mockDelay(200);
    const existing = readPersistedSession();
    if (!existing) {
      throw new ApiError({ message: "Session expired.", status: 401, code: "SESSION_EXPIRED" });
    }
    return existing;
  },

  async getSession(): Promise<AuthSession | null> {
    await mockDelay(150);
    return readPersistedSession();
  },

  async logout(): Promise<void> {
    await mockDelay(150);
    clearPersistedSession();
  },
};

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

  async registerConsumer(payload: RegisterConsumerPayload): Promise<AuthSession> {
    const raw = await httpClient.post(ENDPOINTS.auth.consumerRegister, payload, { skipAuth: true });
    const session = mapSessionResponse(raw);
    persistSession(session);
    return session;
  },

  async requestConsumerLoginOtp(target: string): Promise<{ sent: true }> {
    await httpClient.post(ENDPOINTS.auth.consumerRequestLoginOtp, { target }, { skipAuth: true });
    return { sent: true };
  },

  async loginConsumer(payload: LoginConsumerPayload): Promise<AuthSession> {
    const raw = await httpClient.post(ENDPOINTS.auth.consumerLogin, payload, { skipAuth: true });
    const session = mapSessionResponse(raw);
    persistSession(session);
    return session;
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

  async refreshSession(refreshToken: string): Promise<AuthSession> {
    const raw = await httpClient.post(ENDPOINTS.auth.sessionRefresh, { refreshToken }, { skipAuth: true });
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
    const session = readPersistedSession();
    if (session?.refreshToken) {
      try {
        await httpClient.post(ENDPOINTS.auth.sessionLogout, { refreshToken: session.refreshToken });
      } catch {
        // Best-effort — clear the local session regardless.
      }
    }
    clearPersistedSession();
  },
};

export const authService = env.useMockApi ? mockAuthService : realAuthService;
