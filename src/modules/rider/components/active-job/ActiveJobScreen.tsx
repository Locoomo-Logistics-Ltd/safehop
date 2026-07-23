"use client";

import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { TopBar } from "@/components/layout";
import { MapPinIcon, NavigationIcon, QrCodeIcon } from "@/components/icons";
import { ROUTES } from "@/core/config/constants";
import { useActiveJob } from "@/modules/rider/hooks/use-active-job";
import { JobStepper } from "./JobStepper";
import { RiderMapPlaceholder } from "./RiderMapPlaceholder";

/**
 * Active job en-route screen — stepper, status banner, current
 * destination card, "Scan Parcel QR" button, Navigate button, and
 * map. Matches Figma "Html → Body (4)" active job frame.
 */
export function ActiveJobScreen() {
  const { job, isLoading } = useActiveJob();

  if (isLoading || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-canvas">
        <div className="w-8 h-8 rounded-full border-2 border-border-default border-t-brand-blue animate-spin" />
      </div>
    );
  }

  const isAtPickup = job.status === "accepted";
  const currentLocation = isAtPickup ? job.pickup : job.dropoff;

  /** Opens the device's native maps app for turn-by-turn navigation. */
  const handleNavigate = () => {
    const { lat, lng } = currentLocation.location;
    const label = encodeURIComponent(currentLocation.label);
    const url =
      /iPad|iPhone|iPod/.test(navigator.userAgent)
        ? `maps://?q=${label}&ll=${lat},${lng}`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="Locoomo" hideOnDesktop={false} />

      <div className="px-4 md:px-6 pt-2 md:pt-6 pb-8 max-w-[480px] mx-auto flex flex-col gap-4">
        {/* 3-step progress */}
        <JobStepper status={job.status} />

        {/* Status banner */}
        <div className="rounded-[12px] bg-status-success text-white py-2.5 px-4 text-center text-[13px] font-semibold">
          {isAtPickup ? "JOB ACCEPTED — HEAD TO PICKUP" : "PICKED UP — NAVIGATE TO DROPOFF"}
        </div>

        {/* Current destination card */}
        <Card padding="md" className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="w-9 h-9 rounded-[10px] bg-status-success-bg text-status-success flex items-center justify-center shrink-0 mt-0.5">
              <MapPinIcon size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-text-primary truncate">{currentLocation.label}</p>
              <p className="text-[12px] text-text-muted truncate">{currentLocation.address}</p>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-text-muted">
                <span>📦 {job.parcelCount} Parcel{job.parcelCount !== 1 ? "s" : ""} Ready</span>
                <span>• {job.parcelNote}</span>
              </div>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display font-bold text-[16px] text-brand-blue">{job.distanceKm}km</p>
            <p className="text-[10px] text-text-muted">{job.etaMinutes}min ETA</p>
          </div>
        </Card>

        {/* Scan CTA */}
        <Link href={ROUTES.riderScanPickup(job.id)}>
          <Button
            fullWidth size="lg"
            className="!bg-brand-blue"
            leftIcon={<QrCodeIcon size={18} />}
          >
            Scan Parcel QR
          </Button>
        </Link>

        {/* Navigate button */}
        <Button
          fullWidth size="lg"
          variant="outline"
          leftIcon={<NavigationIcon size={16} />}
          onClick={handleNavigate}
        >
          Navigate
        </Button>

        {/* Map */}
        <RiderMapPlaceholder
          center={currentLocation.location}
          height="h-[200px]"
        />
      </div>
    </div>
  );
}
