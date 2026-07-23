"use client";

import { useEffect, useRef, useState } from "react";
import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Input } from "@/components/ui";
import { SearchIcon } from "@/components/icons";
import { env } from "@/core/config/env";
import { cn } from "@/lib/utils";

interface DestinationAddressInputProps {
  value: string;
  onChange: (address: string) => void;
  label?: string;
}

/**
 * Destination address input with live Google Places autocomplete.
 *
 * The real API's orders/book and orders/calculate-fare both take a
 * free-text `destinationAddress` (geocoded server-side) rather than a
 * destination Node — this replaces the old destination-node picker.
 *
 * Falls back to a plain text input if no Maps API key is configured,
 * same graceful-degradation pattern as GoogleMapView.
 */
export function DestinationAddressInput({ value, onChange, label = "Destination Address" }: DestinationAddressInputProps) {
  if (!env.googleMapsApiKey) {
    return (
      <Input
        label={label}
        placeholder="e.g. 12 Admiralty Way, Lekki Phase 1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        leftElement={<SearchIcon size={16} />}
      />
    );
  }

  return (
    <APIProvider apiKey={env.googleMapsApiKey} libraries={["places"]}>
      <PlacesAutocompleteInput value={value} onChange={onChange} label={label} />
    </APIProvider>
  );
}

function PlacesAutocompleteInput({ value, onChange, label }: DestinationAddressInputProps) {
  const placesLibrary = useMapsLibrary("places");
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);

  useEffect(() => {
    if (placesLibrary && !autocompleteServiceRef.current) {
      autocompleteServiceRef.current = new placesLibrary.AutocompleteService();
    }
  }, [placesLibrary]);

  const handleInputChange = (text: string) => {
    onChange(text);

    if (!autocompleteServiceRef.current || text.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    autocompleteServiceRef.current.getPlacePredictions(
      { input: text, componentRestrictions: { country: "ng" } },
      (predictions) => {
        setSuggestions(predictions ?? []);
        setShowSuggestions(true);
      }
    );
  };

  const handleSelectSuggestion = (description: string) => {
    onChange(description);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <Input
        label={label}
        placeholder="e.g. 12 Admiralty Way, Lekki Phase 1"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        leftElement={<SearchIcon size={16} />}
      />

      {showSuggestions && suggestions.length > 0 && (
        <ul
          className={cn(
            "absolute z-20 top-full left-0 right-0 mt-1.5 rounded-[12px] border border-border-default bg-bg-card shadow-[var(--shadow-card)] overflow-hidden"
          )}
        >
          {suggestions.map((s) => (
            <li key={s.place_id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelectSuggestion(s.description)}
                className="w-full text-left px-4 py-2.5 text-[13px] text-text-primary hover:bg-bg-subtle transition-colors border-b border-border-default last:border-b-0"
              >
                {s.description}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
