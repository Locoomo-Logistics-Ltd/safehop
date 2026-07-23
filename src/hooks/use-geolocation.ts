"use client";

import { useEffect, useState } from "react";
import type { GeoPoint } from "@/core/types";

interface GeolocationState {
  position: GeoPoint | null;
  isLoading: boolean;
  /** null = not yet asked, true = granted, false = denied or unsupported */
  permissionGranted: boolean | null;
  error: string | null;
}

const LAGOS_FALLBACK: GeoPoint = { lat: 6.5244, lng: 3.3792 };

function isGeolocationSupported(): boolean {
  return typeof window !== "undefined" && "geolocation" in navigator;
}

/**
 * Requests the browser's live geolocation once on mount.
 * Falls back to a Lagos-centered default if the user denies
 * permission or the browser doesn't support it — the map and
 * distance calculations always have a usable reference point.
 *
 * The "unsupported" case is resolved synchronously in the initial
 * state (lazy useState initializer) rather than inside the effect,
 * so the effect body only ever calls setState from the genuinely
 * async geolocation callbacks.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>(() => {
    if (!isGeolocationSupported()) {
      return {
        position: LAGOS_FALLBACK,
        isLoading: false,
        permissionGranted: false,
        error: "Geolocation isn't supported on this device.",
      };
    }
    return { position: null, isLoading: true, permissionGranted: null, error: null };
  });

  useEffect(() => {
    if (!isGeolocationSupported()) return;

    navigator.geolocation.getCurrentPosition(
      (result) => {
        setState({
          position: { lat: result.coords.latitude, lng: result.coords.longitude },
          isLoading: false,
          permissionGranted: true,
          error: null,
        });
      },
      () => {
        setState({
          position: LAGOS_FALLBACK,
          isLoading: false,
          permissionGranted: false,
          error: "Location access denied — showing Lagos by default.",
        });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 }
    );
  }, []);

  return state;
}
