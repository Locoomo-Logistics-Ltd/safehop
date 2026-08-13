"use client";

import { useState } from "react";
import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Button } from "@/components/ui";
import { env } from "@/core/config/env";

interface AddressGeocodeButtonProps {
  address: string;
  city: string;
  state: string;
  onResolved: (lat: number, lng: number) => void;
}

/**
 * "Find Coordinates from Address" — resolves latitude/longitude from
 * an Address/City/State combo via Google's Geocoding API, instead of
 * requiring whoever's creating a Node (Admin's `OnboardNodeForm`, a
 * NodeOperator's own `VendorNodeSetupScreen` onboarding form) to type
 * raw coordinates by hand. A wrong or placeholder lat/lng here is
 * exactly what makes a Node invisible to `GET /nodes/nearby` for every
 * Consumer searching from a real location, so getting this right
 * matters more than it looks like it should.
 *
 * Shared between `modules/admin` and `modules/vendor` (promotion
 * pattern — see `ARCHITECTURE.md`'s note on `QrScannerView`/
 * `OtpInputBoxes` for the precedent). Same graceful-degradation
 * pattern as `GoogleMapView`/`NodeNetworkMap` — renders a hint instead
 * of a button when no Maps API key is configured, rather than a
 * dead/broken control. Lat/lng stay plain, editable inputs either way;
 * this only pre-fills them.
 */
export function AddressGeocodeButton({ address, city, state, onResolved }: AddressGeocodeButtonProps) {
  if (!env.googleMapsApiKey) {
    return (
      <p className="text-[11px] text-text-muted mb-3 -mt-1">
        Set <code className="text-[10px] bg-bg-subtle px-1 py-0.5 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to
        auto-fill coordinates from the address below instead of typing them.
      </p>
    );
  }

  return (
    <APIProvider apiKey={env.googleMapsApiKey}>
      <GeocodeButtonInner address={address} city={city} state={state} onResolved={onResolved} />
    </APIProvider>
  );
}

function GeocodeButtonInner({ address, city, state, onResolved }: AddressGeocodeButtonProps) {
  const geocodingLibrary = useMapsLibrary("geocoding");
  const [isLooking, setIsLooking] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const canLookUp = !!geocodingLibrary && address.trim().length > 0 && city.trim().length > 0 && state.trim().length > 0;

  const handleClick = () => {
    if (!geocodingLibrary) return;
    setIsLooking(true);
    setLookupError(null);

    const geocoder = new geocodingLibrary.Geocoder();
    geocoder.geocode(
      { address: `${address}, ${city}, ${state}`, componentRestrictions: { country: "ng" } },
      (results, status) => {
        setIsLooking(false);
        if (status === "OK" && results && results[0]) {
          const location = results[0].geometry.location;
          onResolved(location.lat(), location.lng());
        } else {
          setLookupError("Couldn't find coordinates for that address — enter them manually below.");
        }
      }
    );
  };

  return (
    <div className="mb-3">
      <Button type="button" variant="outline" size="sm" disabled={!canLookUp} isLoading={isLooking} onClick={handleClick}>
        Find Coordinates from Address
      </Button>
      {lookupError && <p className="text-[11px] text-status-danger mt-1.5">{lookupError}</p>}
    </div>
  );
}
