/**
 * Centralized environment configuration.
 *
 * Every env var the app reads should be declared here — never call
 * `process.env.X` directly inside a component or service. This file is
 * the single place you touch when wiring up the real backend.
 *
 * To switch from mock data to your real API:
 *   1. Set NEXT_PUBLIC_USE_MOCK_API=false in .env.local
 *   2. Set NEXT_PUBLIC_API_BASE_URL to your real API origin
 *   3. Done — every service in core/api/services/* will now hit the real API.
 */

function readBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
}

export const env = {
  /** When true, all services return mock data instead of calling the network. */
  useMockApi: readBool(process.env.NEXT_PUBLIC_USE_MOCK_API, true),

  /** Base URL for the real backend. Ignored while useMockApi is true. */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://locoomo-api.up.railway.app/api/v1",

  /** Simulated network latency (ms) for mock services — set to 0 to disable. */
  mockLatencyMs: Number(process.env.NEXT_PUBLIC_MOCK_LATENCY_MS ?? 600),

  /** NextAuth */
  nextAuthUrl: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",

  /**
   * Google Maps JavaScript API key — used by the live map on the
   * "Select Nodes" screen. Get one at console.cloud.google.com
   * (enable "Maps JavaScript API" + "Places API", set up billing).
   * The map renders a clear "Map unavailable" fallback state if this
   * is left empty, so the app still runs fine before you add a key.
   */
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  googleMapsMapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "",

  /** App metadata */
  appName: "Locoomo",
  appEnv: process.env.NODE_ENV ?? "development",
} as const;

export const isProd = env.appEnv === "production";
export const isDev = env.appEnv === "development";
