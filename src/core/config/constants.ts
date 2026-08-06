

export const ROUTES = {
  // Auth
  roleSelect: "/role-select",
  createAccount: "/create-account",
  login: "/login",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",

  // User
  dashboard: "/dashboard",
  newDelivery: "/delivery/new",
  selectNodes: "/delivery/select-nodes",
  deliveryMethod: "/delivery/method",
  checkout: "/checkout",
  orderSuccess: (id: string) => `/delivery/${id}/success`,
  track: (id: string) => `/delivery/${id}/track`,

  // Vendor (Shop Owner)
  vendorSetup: "/vendor-setup",
  vendorHome: "/vendor/home",
  vendorScan: "/vendor-scan",
  vendorScanSuccess: (parcelId: string) => `/vendor/scan-success/${parcelId}`,
  vendorActivity: "/vendor/activity",
  vendorRelease: (parcelId: string) => `/vendor/parcels/${parcelId}/release`,
  vendorFlag: (parcelId: string) => `/vendor/parcels/${parcelId}/flag`,
  vendorProfile: "/vendor/profile",

  // Rider
  riderLogin: "/rider-login",
  riderHome: "/rider/home",
  riderJobOffer: "/rider/jobs",
  riderActiveJob: (jobId: string) => `/rider/jobs/${jobId}`,
  riderScanPickup: (jobId: string) => `/rider-scan/${jobId}`,
  riderDeliveryComplete: (jobId: string) => `/rider/jobs/${jobId}/complete`,
  riderDeliveries: "/rider/deliveries",
  riderProfile: "/rider/profile",
} as const;

export const QUERY_KEYS = {
  session: ["session"] as const,
  nodes: ["nodes"] as const,
  node: (id: string) => ["nodes", id] as const,
  deliveries: ["deliveries"] as const,
  delivery: (id: string) => ["deliveries", id] as const,

  vendorNodeProfile: ["vendor", "node-profile"] as const,
  vendorParcels: ["vendor", "parcels"] as const,
  vendorShelves: ["vendor", "shelves"] as const,
  vendorActivity: ["vendor", "activity"] as const,

  riderAvailability: ["rider", "availability"] as const,
  riderEarnings: ["rider", "earnings"] as const,
  riderJobOffer: ["rider", "job-offer"] as const,
  riderActiveJob: ["rider", "active-job"] as const,
  riderJobHistory: ["rider", "job-history"] as const,
};

/** Business rules shared between UI validation and quote calculation */
export const PARCEL_RULES = {
  maxValueForDropAndPick: 100_000, // NGN — above this, recommend Express
} as const;

export const CURRENCY = {
  code: "NGN",
  symbol: "₦",
} as const;
