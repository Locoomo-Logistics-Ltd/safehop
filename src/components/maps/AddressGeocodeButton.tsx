"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { NavigationIcon, HelpCircleIcon, CheckCircleIcon, AlertTriangleIcon } from "@/components/icons";
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
 * `NodeSetupScreen`) to type raw coordinates by hand. A wrong or
 * placeholder lat/lng here is exactly what makes a Node invisible to
 * `GET /nodes/nearby` for every Consumer searching from a real
 * location, so getting this right matters more than it looks like it
 * should.
 *
 * Shared between `modules/admin` and `modules/node` (promotion
 * pattern — see `ARCHITECTURE.md`'s note on `QrScannerView`/
 * `OtpInputBoxes`). Provider-agnostic: it calls `geocodingService` and
 * doesn't know or care whether Geoapify or Google answered.
 *
 * Lat/lng remain plain, editable inputs either way — this only
 * pre-fills them, and shows the matched address back so the person
 * filling the form can catch a plausible-but-wrong match before
 * saving.
 *
 * **2026-08-26**: wrapped in an explanatory info card — a plain button
 * with no context left first-time users (Admin or NodeOperator) unsure
 * what it does, when to press it, or why it might be disabled. Fixing
 * it here fixes it for both forms at once, since neither has its own
 * copy of this component.
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
    <div className="rounded-[14px] border border-border-default bg-status-info-bg/50 p-4 mb-4">
      <div className="flex items-start gap-2.5 mb-3">
        <span className="w-7 h-7 rounded-full bg-bg-card text-brand-blue flex items-center justify-center shrink-0">
          <HelpCircleIcon size={14} />
        </span>
        <div>
          <p className="text-[13px] font-semibold text-text-primary leading-tight">
            Not sure about the coordinates?
          </p>
          <p className="text-[12px] text-text-secondary mt-1 leading-relaxed">
            Fill in the Address, City, and State above, then tap the button below, we&apos;ll look
            up the exact Latitude and Longitude for you and fill them in automatically, so
            customers and riders can find this station.
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        leftIcon={<NavigationIcon size={14} />}
        disabled={!canLookUp}
        isLoading={isLooking}
        onClick={handleClick}
        className="bg-bg-card"
      >
        Find Coordinates from Address
      </Button>

      {!canLookUp && (
        <p className="text-[11px] text-text-muted mt-2">
          Enter the address, city, and state above first to enable this.
        </p>
      )}

      {matchedAddress && (
        <p className="flex items-start gap-1.5 text-[11px] mt-2.5">
          <CheckCircleIcon size={13} className="text-status-success shrink-0 mt-0.5" />
          <span className="text-text-secondary">
            Matched <span className="font-medium text-text-primary">{matchedAddress}</span> — check
            this is the right place before saving.
          </span>
        </p>
      )}

      {lookupError && (
        <p className="flex items-start gap-1.5 text-[11px] text-status-danger mt-2.5">
          <AlertTriangleIcon size={13} className="shrink-0 mt-0.5" />
          {lookupError}
        </p>
      )}
    </div>
  );
}
