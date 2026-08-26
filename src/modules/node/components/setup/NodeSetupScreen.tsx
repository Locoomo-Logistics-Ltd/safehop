"use client";

import { useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout";
import { Button, Card, Input, EmptyState } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { AddressGeocodeButton } from "@/components/maps/AddressGeocodeButton";
import { CheckCircleIcon, ClockIcon, MapPinIcon, HomeIcon, PackageIcon, NavigationIcon } from "@/components/icons";
import { PayoutAccountCard } from "@/components/payout";
import { getFriendlyError } from "@/core/api/errors";
import { ROUTES } from "@/core/config/constants";
import { useNodeSetup } from "@/modules/node/hooks/use-node-setup";
import type { BankOption, NodeOperatorProfile, PayoutAccountPayload } from "@/core/types";

/**
 * Node Setup — the self-service step of a NodeOperator account's
 * registration: submit the Node's details, then wait for Admin
 * approval. Backed by two real, confirmed routes per docs/API.md
 * (`POST /node-operators/onboarding`, `GET /node-operators/me`),
 * previously unintegrated. Reachable from Profile — see
 * `NodeProfileScreen`.
 */
export function NodeSetupScreen() {
  const {
    profile,
    isLoadingProfile,
    notOnboarded,
    profileError,
    onboard,
    isOnboarding,
    onboardError,
    banks,
    isLoadingBanks,
    setPayoutAccount,
    isSettingPayoutAccount,
    payoutAccountError,
    payoutAccountSaved,
  } = useNodeSetup();

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-bg-canvas">
        <TopBar title="Node Setup" showBack />
        <p className="text-[13px] text-text-muted text-center py-10">Checking your Pickup station setup…</p>
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
    return (
      <NodeStatusView
        profile={profile}
        banks={banks}
        isLoadingBanks={isLoadingBanks}
        onSetPayoutAccount={setPayoutAccount}
        isSettingPayoutAccount={isSettingPayoutAccount}
        payoutAccountError={payoutAccountError}
        payoutAccountSaved={payoutAccountSaved}
      />
    );
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
        <h1 className="font-display text-[18px] font-bold text-text-primary mb-1">
          Set up your Pickup Station
        </h1>
        <p className="text-[13px] text-text-secondary mb-6">
          Tell us about the location you&apos;ll be operating. An admin reviews every new Pickup
          station before it goes live.
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

        <Button fullWidth size="lg" className="mt-6" disabled={!isValid} isLoading={isSubmitting} onClick={handleSubmit}>
          Submit for Approval
        </Button>
      </div>
    </div>
  );
}

function NodeStatusView({
  profile,
  banks,
  isLoadingBanks,
  onSetPayoutAccount,
  isSettingPayoutAccount,
  payoutAccountError,
  payoutAccountSaved,
}: {
  profile: NodeOperatorProfile;
  banks: BankOption[];
  isLoadingBanks: boolean;
  onSetPayoutAccount: (payload: PayoutAccountPayload) => void;
  isSettingPayoutAccount: boolean;
  payoutAccountError: unknown;
  payoutAccountSaved: boolean;
}) {
  const { node } = profile;

  const payoutCard = (
    <PayoutAccountCard
      configured={profile.payoutAccountConfigured}
      bankName={profile.payoutBankName}
      accountNumber={profile.payoutAccountNumber}
      accountName={profile.payoutAccountName}
      banks={banks}
      isLoadingBanks={isLoadingBanks}
      onSubmit={onSetPayoutAccount}
      isSubmitting={isSettingPayoutAccount}
      error={payoutAccountError}
      saved={payoutAccountSaved}
    />
  );

  if (node.status === "active") {
    return (
      <div className="min-h-screen bg-bg-canvas">
        <TopBar title="Node Setup" showBack />
        <EmptyState
          icon={<CheckCircleIcon size={24} />}
          title="Your Node is approved"
          description={`${node.name} is live on the network. You can start receiving parcels.`}
          action={
            <Link href={ROUTES.nodeHome}>
              <Button size="md">Go to Dashboard</Button>
            </Link>
          }
        />
        <div className="px-4 md:px-6 max-w-[480px] mx-auto">{payoutCard}</div>
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
      <div className="px-4 md:px-6 max-w-[480px] mx-auto flex flex-col gap-5">
        <Card padding="md" className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-[10px] bg-bg-subtle text-text-muted flex items-center justify-center shrink-0">
            <MapPinIcon size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-text-primary truncate">{node.name}</p>
            <p className="text-[12px] text-text-muted truncate">{node.address}</p>
          </div>
        </Card>
        {payoutCard}
      </div>
    </div>
  );
}
