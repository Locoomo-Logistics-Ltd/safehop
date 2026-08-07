"use client";

import { useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout";
import { Button, Card, Input, EmptyState } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { CheckCircleIcon, ClockIcon, MapPinIcon } from "@/components/icons";
import { getFriendlyError } from "@/core/api/errors";
import { ROUTES } from "@/core/config/constants";
import { useVendorNodeSetup } from "@/modules/vendor/hooks/use-vendor-node-setup";

/**
 * Node Setup — the self-service step of a NodeOperator (Vendor)
 * account's registration: submit the Node's details, then wait for
 * Admin approval. Backed by two real, confirmed routes per
 * docs/API.md (`POST /node-operators/onboarding`,
 * `GET /node-operators/me`), previously unintegrated. Reachable from
 * Vendor Profile — see `VendorProfileScreen`.
 */
export function VendorNodeSetupScreen() {
  const { profile, isLoadingProfile, notOnboarded, profileError, onboard, isOnboarding, onboardError } =
    useVendorNodeSetup();

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-bg-canvas">
        <TopBar title="Node Setup" showBack />
        <p className="text-[13px] text-text-muted text-center py-10">Checking your Node setup…</p>
      </div>
    );
  }

  if (profileError) {
    const error = getFriendlyError(profileError);
    return (
      <div className="min-h-screen bg-bg-canvas">
        <TopBar title="Node Setup" showBack />
        <div className="px-4 md:px-6 pt-4 max-w-[480px] mx-auto">
          <ErrorAlert title={error.title} message={error.message} action={error.action} />
        </div>
      </div>
    );
  }

  if (notOnboarded) {
    return <OnboardingForm onSubmit={onboard} isSubmitting={isOnboarding} error={onboardError} />;
  }

  if (profile) {
    return <NodeStatusView profile={profile} />;
  }

  return null;
}

function OnboardingForm({
  onSubmit,
  isSubmitting,
  error,
}: {
  onSubmit: (payload: {
    name: string;
    address: string;
    city: string;
    state: string;
    latitude: number;
    longitude: number;
    capacity: number;
    operatingHours?: string;
  }) => void;
  isSubmitting: boolean;
  error: unknown;
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [capacity, setCapacity] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [operatingHours, setOperatingHours] = useState("");

  const isValid =
    name.trim() && address.trim() && city.trim() && state.trim() && capacity.trim() && latitude.trim() && longitude.trim();

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
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="Node Setup" showBack />
      <div className="px-4 md:px-6 pt-4 pb-10 max-w-[480px] mx-auto">
        <h1 className="font-display text-[18px] font-bold text-text-primary mb-1">Set up your Node</h1>
        <p className="text-[13px] text-text-secondary mb-6">
          Tell us about the location you&apos;ll be operating. An admin reviews every new Node before it goes live.
        </p>

        <Card padding="md" className="flex flex-col gap-3">
          <Input placeholder="Node name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
          <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} />
          <Input
            placeholder="Capacity (parcels)"
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
          <Input
            placeholder="Operating hours (optional)"
            value={operatingHours}
            onChange={(e) => setOperatingHours(e.target.value)}
          />
          <Input placeholder="Latitude" type="number" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
          <Input
            placeholder="Longitude"
            type="number"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
          />
        </Card>

        {error != null &&
          (() => {
            const friendly = getFriendlyError(error);
            return <ErrorAlert title={friendly.title} message={friendly.message} action={friendly.action} />;
          })()}

        <Button fullWidth size="lg" className="mt-6" disabled={!isValid} isLoading={isSubmitting} onClick={handleSubmit}>
          Submit for Approval
        </Button>
      </div>
    </div>
  );
}

function NodeStatusView({
  profile,
}: {
  profile: { profileId: string; node: { name: string; address: string; status: string } };
}) {
  const { node } = profile;

  if (node.status === "active") {
    return (
      <div className="min-h-screen bg-bg-canvas">
        <TopBar title="Node Setup" showBack />
        <EmptyState
          icon={<CheckCircleIcon size={24} />}
          title="Your Node is approved"
          description={`${node.name} is live on the network. You can start receiving parcels.`}
          action={
            <Link href={ROUTES.vendorHome}>
              <Button size="md">Go to Dashboard</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="Node Setup" showBack />
      <EmptyState
        icon={<ClockIcon size={24} />}
        title="Waiting for approval"
        description={`${node.name} has been submitted and is pending review by an admin. This usually doesn't take long.`}
      />
      <div className="px-4 md:px-6 max-w-[480px] mx-auto">
        <Card padding="md" className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-[10px] bg-bg-subtle text-text-muted flex items-center justify-center shrink-0">
            <MapPinIcon size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-text-primary truncate">{node.name}</p>
            <p className="text-[12px] text-text-muted truncate">{node.address}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
