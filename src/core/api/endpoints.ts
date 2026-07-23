
export const ENDPOINTS = {
  // ── Authentication Module ─────────────────────────────────────
  auth: {
    // Consumer (User)
    consumerRequestOtp: "/auth/consumer/request-otp",
    consumerRegister: "/auth/register",
    consumerRequestLoginOtp: "/auth/consumer/request-login-otp",
    consumerLogin: "/auth/consumer/login/password",
    

    // Rider
    riderRegister: "/auth/rider/register",
    riderLogin: "/auth/rider/login",

    // Node Staff (Vendor)
    nodeStaffProvision: "/auth/node-staff/provision",
    nodeStaffLogin: "/auth/node-staff/login",
    nodeStaffFirstLoginReset: "/auth/node-staff/first-login-reset",

    // Session (shared across all roles)
    sessionRefresh: "/auth/session/refresh",
    sessionLogout: "/auth/session/logout",
  },

  // ── Identity Module (KYC / profile completion, step 3 of signup) ──
  identity: {
    riderOnboarding: (userId: string) => `/identity/rider/${userId}/onboarding`,
    consumerOnboarding: (userId: string) => `/identity/consumer/${userId}/onboarding`,
  },

  // ── Corporate Operations Control (internal/admin — not used by app roles) ──
  corporateOps: {
    provisionStaff: "/corporate-ops/staff/provision",
    elevateSuperAdmin: "/corporate-ops/staff/elevate-superadmin",
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

  // ── Admin Nodes / Franchise Network (onboarding, admin-only) ──
  adminNodes: {
    onboardPartner: "/admin/nodes/onboard-partner",
  },
  franchiseNodes: {
    onboardOperator: "/franchise-nodes/onboard-operator",
  },

  // ── Orders Engine ──────────────────────────────────────────────
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

  // ── Payment Webhook Ingestion (backend-to-backend, not used by app) ──
  payments: {
    webhook: (provider: string) => `/payments/webhook/${provider}`,
  },
} as const;
