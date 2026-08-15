

export const ROUTES = {
  // Auth
  roleSelect: "/role-select",
  createAccount: "/create-account",
  login: "/login",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  acceptInvite: "/accept-invite",

  // User
  dashboard: "/dashboard",
  newDelivery: "/delivery/new",
  selectNodes: "/delivery/select-nodes",
  deliveryMethod: "/delivery/method",
  checkout: "/checkout",
  /** Where Paystack redirects after checkout, per docs/API.md's `POST /payments/intents` — polls the intent, then forwards to orderSuccess once an Order exists. */
  paymentCallback: "/orders/payment-callback",
  orderSuccess: (id: string) => `/delivery/${id}/success`,
  track: (id: string) => `/delivery/${id}/track`,
  trackList: "/track",

  // Vendor (Shop Owner / Node Operator)
  vendorHome: "/vendor/home",
  vendorScan: "/vendor-scan",
  vendorActivity: "/vendor/activity",
  vendorFlag: (parcelId: string) => `/vendor/parcels/${parcelId}/flag`,
  vendorProfile: "/vendor/profile",
  vendorNodeSetup: "/vendor/node-setup",
  /** Consumer drop-off preview + confirm — `GET /handoffs/orders/by-tracking-code/:code` then `POST .../drop-off`. Reached from the scanner or manual code entry. */
  vendorDropOff: (trackingCode: string) => `/vendor/drop-off/${trackingCode}`,
  /** Operator types the rider's 6-digit code — `POST /handoffs/orders/:id/confirm-handoff`, both `rider_pickup` (origin) and `rider_arrival` (destination). */
  vendorRiderHandoff: "/vendor/rider-handoff",
  /** Parcels at this Node between arrival and collection. Client-side list — no destination-scoped orders endpoint exists (see store/node-parcels.store.ts). */
  vendorAwaitingCollection: "/vendor/awaiting-collection",
  /** Receiver collection: code entry + identity attestation — `POST /handoffs/orders/:id/collect`. */
  vendorCollect: (orderId: string) => `/vendor/awaiting-collection/${orderId}/collect`,

  // Rider
  riderHome: "/rider/home",
  /** The job board — `GET /handoffs/available-orders`. */
  riderAvailableJobs: "/rider/available-jobs",
  /** Rider's own accepted deliveries. Client-side only — no rider-scoped orders endpoint exists (see store/rider-jobs.store.ts). */
  riderActiveDeliveries: "/rider/active-deliveries",
  /** Where the rider requests + shows the 6-digit handoff code for one delivery. */
  riderHandoff: (orderId: string) => `/rider/active-deliveries/${orderId}/handoff`,
  riderVerification: "/rider/verification",
  riderDeliveries: "/rider/deliveries",
  riderProfile: "/rider/profile",

  // Admin
  adminLogin: "/admin-login",
  adminDashboard: "/admin/dashboard",
  adminOrders: "/admin/orders",
  adminOrderDetail: (id: string) => `/admin/orders/${id}`,
  adminNodes: "/admin/nodes",
  adminTeam: "/admin/team",
  adminApprovals: "/admin/approvals",
  adminPricing: "/admin/pricing",
  adminDisputes: "/admin/disputes",
  adminAnalytics: "/admin/analytics",
  adminSettings: "/admin/settings",
} as const;

export const QUERY_KEYS = {
  session: ["session"] as const,
  nodes: ["nodes"] as const,
  node: (id: string) => ["nodes", id] as const,
  deliveries: ["deliveries"] as const,
  delivery: (id: string) => ["deliveries", id] as const,
  paymentIntent: (id: string) => ["payment-intent", id] as const,

  vendorNodeProfile: ["vendor", "node-profile"] as const,
  vendorNodeOperatorProfile: ["vendor", "node-operator-profile"] as const,
  vendorParcels: ["vendor", "parcels"] as const,
  vendorActivity: ["vendor", "activity"] as const,

  riderAvailability: ["rider", "availability"] as const,
  riderEarnings: ["rider", "earnings"] as const,
  riderVerification: ["rider", "verification"] as const,
  riderJobHistory: ["rider", "job-history"] as const,

  // Handoffs module. `availableOrders` is keyed on the coordinates it
  // was sorted against and the page — a different position is a
  // genuinely different result set, not a stale one to reuse.
  /** Prefix for every position/page variant below — invalidate this to refetch the board wholesale (e.g. after an accept). */
  riderAvailableOrdersRoot: ["rider", "available-orders"] as const,
  riderAvailableOrders: (latitude: number, longitude: number, page: number) =>
    ["rider", "available-orders", latitude, longitude, page] as const,
  vendorHandoffOrder: (trackingCode: string) =>
    ["vendor", "handoff-order", trackingCode] as const,

  adminDashboardStats: ["admin", "dashboard-stats"] as const,
  adminRecentOrders: ["admin", "recent-orders"] as const,
  adminNetworkStatus: ["admin", "network-status"] as const,
  adminOrders: ["admin", "orders"] as const,
  adminOrderDetail: (id: string) => ["admin", "orders", id] as const,
  adminNodes: ["admin", "nodes"] as const,
  adminNodeDetail: (id: string) => ["admin", "nodes", id] as const,
  adminTeam: ["admin", "team"] as const,
  adminNodeOperatorsPending: ["admin", "node-operators-pending"] as const,
  adminRidersPending: ["admin", "riders-pending"] as const,
  adminPricingRules: ["admin", "pricing-rules"] as const,
  adminDisputes: ["admin", "disputes"] as const,
  adminDisputeMetrics: ["admin", "dispute-metrics"] as const,
  adminSuperAdminOverview: ["admin", "super-admin-overview"] as const,
  adminAnalyticsSummary: ["admin", "analytics-summary"] as const,
  adminTopNodes: ["admin", "top-nodes"] as const,
  adminRiderPerformance: ["admin", "rider-performance"] as const,
  adminOrdersTrend: ["admin", "orders-trend"] as const,
};

/** Business rules shared between UI validation and quote calculation */
export const PARCEL_RULES = {
  maxValueForDropAndPick: 100_000, // NGN — above this, recommend Express
} as const;

export const CURRENCY = {
  code: "NGN",
  symbol: "₦",
} as const;

export const STORAGE_KEYS = {
  /** Set right before redirecting to Paystack (`authorizationUrl`) — docs/API.md doesn't guarantee the intent id comes back on the `/orders/payment-callback` query string, so the callback screen reads it from here instead. */
  pendingPaymentIntentId: "locoomo_pending_payment_intent_id",
  /** The persisted-session localStorage key — shared between `auth.service.ts` (writes it) and `core/api/client.ts`'s 401 → refresh → retry interceptor (clears it on a hard sign-out), which can't import `authService` directly (would be a circular import back into `client.ts`). */
  session: "locoomo_session",
} as const;
