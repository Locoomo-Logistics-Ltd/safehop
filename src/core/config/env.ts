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

  /** NextAuth — currently unused scaffolding, no [...nextauth] route exists. */
  nextAuthUrl: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",

  /**
   * Google Identity Services client ID — powers `GoogleAuthButton`
   * (`POST /auth/google`, docs/API.md). This is the public client-side
   * ID token flow, distinct from the NextAuth vars above: no secret
   * needed here since the raw ID token is verified server-side by the
   * backend, never exchanged by this app. Left empty, the button
   * degrades to a disabled state rather than crashing.
   */
  googleSignInClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",

  /**
   * Which provider backs maps + geocoding. `"geoapify"` today (free
   * tier, no billing account required); flip to `"google"` when there's
   * budget for it — see `core/api/services/geocoding.service.ts` and
   * `components/maps/MapView.tsx`, the only two files that branch on
   * this.
   */
  mapsProvider: (process.env.NEXT_PUBLIC_MAPS_PROVIDER ?? "geoapify") as "geoapify" | "google",

  /**
   * Geoapify API key — powers both the map tiles and address→coordinate
   * geocoding. Get one free at myprojects.geoapify.com (no card
   * required; 3,000 requests/day on the free tier).
   *
   * This key ships to the browser, same as any maps key. Geoapify's
   * project settings let you restrict it by HTTP referrer — do that
   * before going live, or anyone can spend your quota.
   *
   * Left empty, maps render a clear "Map unavailable" fallback and the
   * geocode buttons explain what's missing, so the app still runs.
   */
  geoapifyApiKey: process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY ?? "",

  /**
   * Geoapify raster tile style. `osm-bright` is the general-purpose
   * light basemap; `positron` / `osm-bright-grey` are quieter options
   * that let coloured markers stand out more.
   */
  geoapifyMapStyle: process.env.NEXT_PUBLIC_GEOAPIFY_MAP_STYLE ?? "osm-bright",

  /**
   * Google Maps JavaScript API key — only read when `mapsProvider` is
   * `"google"`. Requires a billing account even on the free tier, which
   * is why Geoapify is the default.
   */
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  googleMapsMapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "",

  /** App metadata */
  appName: "Locoomo",
  appEnv: process.env.NODE_ENV ?? "development",
} as const;

export const isProd = env.appEnv === "production";
export const isDev = env.appEnv === "development";
