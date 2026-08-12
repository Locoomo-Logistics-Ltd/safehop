
export const ENDPOINTS = {
  // ── Authentication Module ─────────────────────────────────────
  auth: {
    // Consumer (User)
    consumerRequestOtp: "/auth/consumer/request-otp",
    // Shared self-registration for Consumer, Rider, and NodeOperator —
    // POST /auth/register, differing only in the `role` field. Real,
    // confirmed route per docs/API.md.
    consumerRegister: "/auth/register",
    consumerRequestLoginOtp: "/auth/consumer/request-login-otp",
    // Shared login for every role (Consumer, Rider, NodeOperator,
    // Admin) — POST /auth/login is role-agnostic per docs/API.md.
    consumerLogin: "/auth/login",

    // Session (shared across all roles)
    sessionRefresh: "/auth/refresh",
    sessionLogout: "/auth/logout",
    passwordResetRequest: "/auth/password-reset/request",
    passwordResetConfirm: "/auth/password-reset/confirm",
    verifyEmail: "/auth/verify-email",
    inviteConfirm: "/auth/invite/confirm",
  },

  // ── Identity Module (KYC / profile completion, step 3 of signup) ──
  // riderOnboarding removed — undocumented; real Rider onboarding is
  // `riders.onboarding` below (POST /riders/onboarding, per API.md).
  identity: {
    consumerOnboarding: (userId: string) => `/identity/consumer/${userId}/onboarding`,
  },

  // ── Corporate Operations Control (internal/admin — not used by app roles) ──
  corporateOps: {
    elevateSuperAdmin: "/corporate-ops/staff/elevate-superadmin",
  },

  // ── Users Module ───────────────────────────────────────────────
  users: {
    // Real, confirmed route per docs/API.md — Admin-only, invites a
    // node_operator/rider/admin account (never `consumer`).
    invite: "/users/invite",
  },

  // ── Notifications Engine ──────────────────────────────────────
  notifications: {
    listForUser: (userId: string) => `/notifications/user/${userId}`,
    markRead: (id: string) => `/notifications/${id}/read`,
    markAllRead: (userId: string) => `/notifications/user/${userId}/read-all`,
  },

  // ── Nodes Infrastructure Module ───────────────────────────────
  nodes: {
    nearby: "/nodes/nearby", // ?latitude&longitude&radiusInMeters
    onboard: "/nodes/onboard",
    operatorInventory: "/nodes/operator/inventory",
    updateStatus: (id: string) => `/nodes/${id}/status`,
  },

  // ── Node Operators (Vendor self-service onboarding) ────────────
  // Real, confirmed routes per docs/API.md. Requires an authenticated
  // NodeOperator session. Distinct from `nodes.operatorInventory`
  // above, which is the already-approved Node's live parcel data.
  nodeOperators: {
    onboarding: "/node-operators/onboarding",
    me: "/node-operators/me",
    // Admin-only review queue — real, confirmed routes per docs/API.md.
    pending: "/node-operators/pending",
    approve: (profileId: string) => `/node-operators/${profileId}/approve`,
  },

  // ── Admin Nodes / Franchise Network (onboarding, admin-only) ──
  adminNodes: {
    // Real routes per docs/API.md — the plain Nodes resource, Admin-scoped usage.
    create: "/nodes",
    list: "/nodes",
    detail: (id: string) => `/nodes/${id}`,
  },
  franchiseNodes: {
    onboardOperator: "/franchise-nodes/onboard-operator",
  },

  // ── Orders Engine ──────────────────────────────────────────────
  // `calculateFare`/`book` don't appear anywhere in docs/API.md and are
  // no longer called by delivery.service.ts as of 2026-08-12 — real
  // order placement is `payments.intents` below. Kept only in case a
  // real backend equivalent is ever confirmed; don't wire new code to
  // them. `list`/`detail` ARE documented (`GET /orders`(/:id)) and are
  // the real routes delivery.service.ts calls.
  orders: {
    calculateFare: "/orders/calculate-fare",
    book: "/orders/book",
    list: "/orders",
    detail: (id: string) => `/orders/${id}`,
    scanHandoff: "/orders/scan-handoff",
    scanCollection: "/orders/scan-collection",
  },

  // ── Maps & Live Telemetry Module ──────────────────────────────
  maps: {
    riderTelemetryPing: "/maps/rider/telemetry-ping",
    track: (trackingCode: string) => `/maps/track/${trackingCode}`,
  },

  // ── Rider Operations Gateway ───────────────────────────────────
  riderOps: {
    jobBoard: "/riders/job-board",
    acceptJob: "/riders/accept-job",
    manifest: "/riders/manifest",
    scanPickup: "/riders/scan-pickup",
    scanDropoff: "/riders/scan-dropoff",
  },

  // ── Riders (KYC verification / onboarding) ──────────────────────
  // Real, confirmed routes per docs/API.md. Requires an authenticated
  // Rider session. Distinct from `riderOps` above, which is the
  // already-approved Rider's live job-board/manifest data.
  riders: {
    uploadSignature: "/riders/verification/upload-signature",
    onboarding: "/riders/onboarding",
    me: "/riders/me",
    // Admin-only review queue — real, confirmed routes per docs/API.md.
    pending: "/riders/pending",
    approve: (profileId: string) => `/riders/${profileId}/approve`,
  },

  // ── Payments ─────────────────────────────────────────────────────
  // `webhook` (singular, provider-parameterized) is the pre-existing,
  // unconfirmed entry — kept for now, but note it does NOT match
  // docs/API.md's actual `POST /payments/webhooks/paystack` (plural,
  // Paystack-fixed, server-to-server only, never called by this app).
  // `intents`/`intentDetail` below are the real, confirmed,
  // frontend-facing routes.
  payments: {
    webhook: (provider: string) => `/payments/webhook/${provider}`,
    intents: "/payments/intents",
    intentDetail: (id: string) => `/payments/intents/${id}`,
  },

  // ── Admin Pricing ────────────────────────────────────────────────
  // Real, confirmed routes per docs/API.md. Append-only — POST never
  // edits an existing rule, it adds a new one that becomes "current."
  adminPricing: {
    create: "/admin/pricing",
    list: "/admin/pricing",
  },
} as const;
