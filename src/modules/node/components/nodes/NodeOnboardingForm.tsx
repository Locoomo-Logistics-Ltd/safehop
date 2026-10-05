"use client";

import { useState } from "react";
import { Button, Card, Input } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { AddressGeocodeButton } from "@/components/maps/AddressGeocodeButton";
import { ClockIcon, MapPinIcon, HomeIcon, PackageIcon, NavigationIcon } from "@/components/icons";
import { getFriendlyError } from "@/core/api/errors";
import type { NodeOperatorOnboardingPayload } from "@/core/types";

interface NodeOnboardingFormProps {
  onSubmit: (payload: NodeOperatorOnboardingPayload) => void;
  isSubmitting: boolean;
  error: unknown;
  /**
   * Whether this is the account's first station or an additional one.
   * Copy only — the endpoint difference (`POST
   * /node-operators/onboarding` vs `POST /node-operators/nodes`) is
   * resolved in `useNodeSetup` off the fetched list, not from here, so
   * this prop can never send a submission to the wrong route.
   */
  variant: "first" | "additional";
}

/**
 * The Node details form — name, address, coordinates, capacity, hours.
 * Extracted from `NodeSetupScreen` (2026-09-02) when one operator
 * became able to run several Nodes: the identical form now backs both
 * first-time onboarding and every station added afterwards, so it can't
 * drift between the two.
 *
 * Deliberately still plain `useState` rather than React Hook Form —
 * that's what this form already was, and the app is documented as
 * mixed on the point (see ARCHITECTURE.md's "Form handling is
 * inconsistent"); converting it would be an unrelated change.
 */
export function NodeOnboardingForm({
  onSubmit,
  isSubmitting,
  error,
  variant,
}: NodeOnboardingFormProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [capacity, setCapacity] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [operatingHours, setOperatingHours] = useState("");

  const isValid =
    name.trim() &&
    address.trim() &&
    city.trim() &&
    state.trim() &&
    capacity.trim() &&
    latitude.trim() &&
    longitude.trim();

  const handleSubmit = () => {
    onSubmit({
      name,
      address,
      city,
      state,
      capacity: Number(capacity),
      latitude: Number(latitude),
      longitude: Number(longitude),
      operatingHours: operatingHours.trim() || undefined,
    });
  };

  return (
    <div className="px-4 md:px-6 pt-4 pb-10 max-w-[480px] mx-auto">
      <h1 className="font-display text-[18px] font-bold text-text-primary mb-1">
        {variant === "first" ? "Set up your Pickup Station" : "Add another Pickup Station"}
      </h1>
      <p className="text-[13px] text-text-secondary mb-6">
        {variant === "first"
          ? "Tell us about the location you'll be operating. An admin reviews every new Pickup station before it goes live."
          : "Tell us about your new location. Every station is reviewed on its own — your existing ones keep running while this one waits."}
      </p>

      <div className="flex flex-col gap-5">
        {/* Location details */}
        <Card padding="lg" className="animate-locoomo-fade-up">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-9 h-9 rounded-[10px] bg-status-info-bg text-brand-blue flex items-center justify-center shrink-0">
              <MapPinIcon size={17} />
            </span>
            <div>
              <h2 className="font-semibold text-[15px] text-text-primary leading-tight">
                Location Details
              </h2>
              <p className="text-[12px] text-text-muted">Where riders and customers will find you</p>
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            <Input
              label="Station Name"
              placeholder="e.g. Lekki Phase 1 Station"
              leftElement={<HomeIcon size={16} />}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Address"
              placeholder="12 Admiralty Way"
              leftElement={<MapPinIcon size={16} />}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="City"
                placeholder="Lagos"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <Input
                label="State"
                placeholder="Lagos"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>

            <AddressGeocodeButton
              address={address}
              city={city}
              state={state}
              onResolved={(lat, lng) => {
                setLatitude(String(lat));
                setLongitude(String(lng));
              }}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Latitude"
                type="number"
                placeholder="6.4500"
                leftElement={<NavigationIcon size={15} />}
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
              <Input
                label="Longitude"
                type="number"
                placeholder="3.4700"
                leftElement={<NavigationIcon size={15} />}
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Capacity & hours */}
        <Card padding="lg" className="animate-locoomo-fade-up" style={{ animationDelay: "80ms" }}>
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-9 h-9 rounded-[10px] bg-status-info-bg text-brand-blue flex items-center justify-center shrink-0">
              <PackageIcon size={17} />
            </span>
            <div>
              <h2 className="font-semibold text-[15px] text-text-primary leading-tight">
                Capacity &amp; Hours
              </h2>
              <p className="text-[12px] text-text-muted">How much you can hold, and when</p>
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            <Input
              label="Capacity (parcels)"
              type="number"
              placeholder="e.g. 100"
              leftElement={<PackageIcon size={16} />}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
            <Input
              label="Operating Hours (optional)"
              placeholder="Mon-Sat 8am-7pm"
              leftElement={<ClockIcon size={16} />}
              value={operatingHours}
              onChange={(e) => setOperatingHours(e.target.value)}
            />
          </div>
        </Card>
      </div>

      {error != null &&
        (() => {
          const friendly = getFriendlyError(error);
          return (
            <div className="mt-5">
              <ErrorAlert title={friendly.title} message={friendly.message} action={friendly.action} />
            </div>
          );
        })()}

      <Button
        fullWidth
        size="lg"
        className="mt-6"
        disabled={!isValid}
        isLoading={isSubmitting}
        onClick={handleSubmit}
      >
        Submit for Approval
      </Button>
    </div>
  );
}
