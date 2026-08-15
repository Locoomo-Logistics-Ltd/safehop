import { env } from "@/core/config/env";
import { ApiError } from "@/core/api/errors";
import type { GeoPoint } from "@/core/types";

/**
 * Address → coordinates, provider-agnostic.
 *
 * Deliberately **not** routed through `core/api/client.ts`: that client
 * wraps the Locoomo backend's `{success, data, meta}` envelope and
 * attaches session cookies. This talks to a third-party geocoder that
 * speaks GeoJSON and must never receive our cookies, so it owns its own
 * `fetch` — the same reasoning as `riderService.uploadVerificationDocument`
 * posting straight to Cloudinary.
 *
 * Why this matters more than it looks: a Node created with wrong or
 * placeholder coordinates is invisible to `GET /nodes/nearby` for every
 * Consumer searching from a real location. The Node exists, looks fine
 * in the Admin list, and simply never appears to anyone. That's the bug
 * this service is here to prevent.
 *
 * Swapping to Google later is a change to `geocodeWithGoogle` below plus
 * `NEXT_PUBLIC_MAPS_PROVIDER=google` — no call site changes.
 */

export interface GeocodeQuery {
  address: string;
  city: string;
  state: string;
  /** ISO 3166-1 alpha-2, lowercased. Constrains results to one country; Nigeria unless told otherwise. */
  countryCode?: string;
}

export interface GeocodeResult extends GeoPoint {
  /** The provider's canonical rendering of the address — shown back so the user can sanity-check what was matched. */
  formatted: string;
}

/** Geoapify's `/v1/geocode/search` response, narrowed to the fields used here. */
interface GeoapifyFeature {
  properties?: {
    lat?: number;
    lon?: number;
    formatted?: string;
  };
}

interface GeoapifySearchResponse {
  features?: GeoapifyFeature[];
}

function buildQueryText({ address, city, state }: GeocodeQuery): string {
  return [address, city, state].map((part) => part.trim()).filter(Boolean).join(", ");
}

async function geocodeWithGeoapify(query: GeocodeQuery): Promise<GeocodeResult> {
  const params = new URLSearchParams({
    text: buildQueryText(query),
    // `filter` hard-excludes results outside the country, unlike `bias`
    // which merely prefers them. A Lagos street name that also exists in
    // another country would otherwise be a coin flip.
    filter: `countrycode:${query.countryCode ?? "ng"}`,
    limit: "1",
    format: "geojson",
    apiKey: env.geoapifyApiKey,
  });

  let response: Response;
  try {
    response = await fetch(`https://api.geoapify.com/v1/geocode/search?${params.toString()}`);
  } catch {
    throw new ApiError({
      message: "Couldn't reach the address lookup service. Check your connection and try again.",
      code: "NETWORK_ERROR",
      status: 0,
    });
  }

  if (!response.ok) {
    throw new ApiError({
      message:
        response.status === 401
          ? "The address lookup key was rejected. Check NEXT_PUBLIC_GEOAPIFY_API_KEY."
          : "The address lookup service didn't respond properly. Enter coordinates manually.",
      code: "GEOCODING_FAILED",
      status: response.status,
    });
  }

  const json = (await response.json().catch(() => null)) as GeoapifySearchResponse | null;
  const properties = json?.features?.[0]?.properties;

  // A 200 with zero features is the normal "no such address" answer, not
  // a failure — surfaced as a distinct code so the UI can say "we
  // couldn't find that" rather than "something went wrong."
  if (!properties || typeof properties.lat !== "number" || typeof properties.lon !== "number") {
    throw new ApiError({
      message: "We couldn't find that address. Check the spelling, or enter coordinates manually.",
      code: "ADDRESS_NOT_FOUND",
      status: 404,
    });
  }

  return {
    lat: properties.lat,
    lng: properties.lon,
    formatted: properties.formatted ?? buildQueryText(query),
  };
}

async function geocodeWithGoogle(query: GeocodeQuery): Promise<GeocodeResult> {
  void query;
  // Not implemented on purpose. Google's Geocoding web service rejects
  // browser requests without a proxy (no CORS headers), so this can't
  // just mirror the Geoapify call — it needs either the Maps JS SDK's
  // client-side `Geocoder` (what the pre-2026-08-15 `AddressGeocodeButton`
  // used) or a small backend route. Pick one when the budget arrives;
  // until then `NEXT_PUBLIC_MAPS_PROVIDER=google` fails loudly rather
  // than silently falling back to a provider the operator didn't choose.
  throw new ApiError({
    message:
      "Google geocoding isn't wired up yet — set NEXT_PUBLIC_MAPS_PROVIDER=geoapify, or implement geocodeWithGoogle().",
    code: "NOT_IMPLEMENTED",
  });
}

export const geocodingService = {
  /** True when the active provider has the key it needs — call sites use this to hide the control instead of offering one that can't work. */
  isConfigured(): boolean {
    return env.mapsProvider === "google" ? !!env.googleMapsApiKey : !!env.geoapifyApiKey;
  },

  async geocodeAddress(query: GeocodeQuery): Promise<GeocodeResult> {
    if (!geocodingService.isConfigured()) {
      throw new ApiError({
        message: "Address lookup isn't configured. Add an API key to .env.local.",
        code: "NOT_CONFIGURED",
        status: 0,
      });
    }
    return env.mapsProvider === "google"
      ? geocodeWithGoogle(query)
      : geocodeWithGeoapify(query);
  },
};
