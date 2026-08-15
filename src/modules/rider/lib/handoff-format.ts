import { formatDistanceToNow } from "date-fns";
import type { HandoffType, OrderParcelSize } from "@/core/types";

/**
 * Presentation helpers for the rider's handoff screens. Local to the
 * Rider module rather than `src/lib/format.ts` because every one of
 * them is shaped by this contract specifically — metres (only
 * `/handoffs/available-orders` reports distance that way), the API's
 * 4-tier parcel enum, and the two handoff legs.
 */

/**
 * Metres → a distance a rider can act on. Sub-kilometre readings stay
 * in metres rounded to 10m (the difference between 40m and 900m matters
 * when deciding whether to walk); past that, one decimal of a km is as
 * much precision as a road route would justify.
 */
export function formatDistanceMeters(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return "—";
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export const PARCEL_SIZE_LABEL: Record<OrderParcelSize, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  extra_large: "Extra large",
};

/** Falls back to the raw value so an enum the frontend hasn't caught up with still renders. */
export function parcelSizeLabel(size: OrderParcelSize): string {
  return PARCEL_SIZE_LABEL[size] ?? size;
}

/** "about 2 hours ago" — how long a parcel has been waiting for a rider. */
export function formatWaitingSince(isoDate: string): string {
  try {
    return formatDistanceToNow(new Date(isoDate), { addSuffix: true });
  } catch {
    return "recently";
  }
}

/** Seconds → "4:32", for the handoff code countdown. */
export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

interface HandoffLegCopy {
  /** Short label for a list row. */
  badge: string;
  /** Screen heading. */
  title: string;
  /** What the rider is about to do, in their own terms. */
  description: string;
  /** Which node they should be standing at. */
  nodeLabel: string;
}

export const HANDOFF_LEG_COPY: Record<HandoffType, HandoffLegCopy> = {
  rider_pickup: {
    badge: "Collect",
    title: "Collect from origin",
    description:
      "Read this code to the operator at the origin node. They'll confirm it and hand you the parcel.",
    nodeLabel: "Origin node",
  },
  rider_arrival: {
    badge: "Deliver",
    title: "Deliver to destination",
    description:
      "Read this code to the operator at the destination node to hand the parcel over.",
    nodeLabel: "Destination node",
  },
};

/**
 * Opens the device's native maps app for an address.
 *
 * Address-based rather than coordinate-based (unlike ActiveJobScreen's
 * version) because the handoffs contract returns node names and
 * addresses but no lat/lng anywhere — `distanceMeters` is computed
 * server-side and the raw points never reach the client.
 */
export function buildNavigationUrl(address: string, isAppleDevice: boolean): string {
  const query = encodeURIComponent(address);
  return isAppleDevice
    ? `maps://?q=${query}`
    : `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}

export function isAppleDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}
