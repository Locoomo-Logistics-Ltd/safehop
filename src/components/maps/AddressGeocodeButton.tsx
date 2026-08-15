"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { getErrorMessage } from "@/core/api/errors";
import { geocodingService } from "@/core/api/services/geocoding.service";

interface AddressGeocodeButtonProps {
  address: string;
  city: string;
  state: string;
  onResolved: (lat: number, lng: number) => void;
}

/**
 * "Find Coordinates from Address" — resolves latitude/longitude from an
 * Address/City/State combo, instead of requiring whoever's creating a
 * Node (Admin's `OnboardNodeForm`, a NodeOperator's own
 * `VendorNodeSetupScreen`) to type raw coordinates by hand. A wrong or
 * placeholder lat/lng here is exactly what makes a Node invisible to
 * `GET /nodes/nearby` for every Consumer searching from a real
 * location, so getting this right matters more than it looks like it
 * should.
 *
 * Shared between `modules/admin` and `modules/vendor` (promotion
 * pattern — see `ARCHITECTURE.md`'s note on `QrScannerView`/
 * `OtpInputBoxes`). Provider-agnostic: it calls `geocodingService` and
 * doesn't know or care whether Geoapify or Google answered.
 *
 * Lat/lng remain plain, editable inputs either way — this only
 * pre-fills them, and shows the matched address back so the person
 * filling the form can catch a plausible-but-wrong match before
 * saving.
 */
export function AddressGeocodeButton({
  address,
  city,
  state,
  onResolved,
}: AddressGeocodeButtonProps) {
  const [isLooking, setIsLooking] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [matchedAddress, setMatchedAddress] = useState<string | null>(null);

  if (!geocodingService.isConfigured()) {
    return (
      <p className="text-[11px] text-text-muted mb-3 -mt-1">
        Set{" "}
        <code className="text-[10px] bg-bg-subtle px-1 py-0.5 rounded">
          NEXT_PUBLIC_GEOAPIFY_API_KEY
        </code>{" "}
        to auto-fill coordinates from the address below instead of typing them.
      </p>
    );
  }

  const canLookUp =
    address.trim().length > 0 && city.trim().length > 0 && state.trim().length > 0;

  const handleClick = async () => {
    setIsLooking(true);
    setLookupError(null);
    setMatchedAddress(null);

    try {
      const result = await geocodingService.geocodeAddress({ address, city, state });
      onResolved(result.lat, result.lng);
      setMatchedAddress(result.formatted);
    } catch (error) {
      setLookupError(getErrorMessage(error));
    } finally {
      setIsLooking(false);
    }
  };

  return (
    <div className="mb-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!canLookUp}
        isLoading={isLooking}
        onClick={handleClick}
      >
        Find Coordinates from Address
      </Button>

      {matchedAddress && (
        <p className="text-[11px] text-text-secondary mt-1.5">
          Matched <span className="font-medium text-text-primary">{matchedAddress}</span> — check
          this is the right place before saving.
        </p>
      )}

      {lookupError && <p className="text-[11px] text-status-danger mt-1.5">{lookupError}</p>}
    </div>
  );
}
