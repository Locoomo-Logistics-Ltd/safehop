"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { XIcon, MapPinIcon, NavigationIcon } from "@/components/icons";
import { QrScannerView } from "@/components/scanner/QrScannerView";
import { getErrorMessage } from "@/core/api/errors";
import { useActiveJob } from "@/modules/rider/hooks/use-active-job";
import { useScanJob } from "@/modules/rider/hooks/use-scan-job";

/**
 * Rider parcel QR scan screen — used for both pickup scan and the
 * "scan at dropoff" flow. Matches Figma frame 5: full-screen camera
 * with corner-bracket viewfinder, success overlay with destination
 * card, "Navigate to Destination" CTA.
 */
export function RiderScanScreen() {
  const params = useParams<{ jobId: string }>();
  const router = useRouter();
  const { job } = useActiveJob();
  const { scanPickup, isScanningPickup, pickupError, resetPickupError } = useScanJob(params.jobId);

  const [scanSuccess, setScanSuccess] = useState(false);

  const handleScan = (value: string) => {
    if (isScanningPickup || scanSuccess) return;
    scanPickup(value, {
      onSuccess: () => setScanSuccess(true),
    });
  };

  const handleNavigate = () => {
    if (!job) return;
    const { lat, lng } = job.dropoff.location;
    const label = encodeURIComponent(job.dropoff.label);
    const url =
      /iPad|iPhone|iPod/.test(navigator.userAgent)
        ? `maps://?q=${label}&ll=${lat},${lng}`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, "_blank");
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-[max(16px,env(safe-area-inset-top))] pb-3">
        <button
          onClick={() => router.back()}
          aria-label="Close scanner"
          className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-white"
        >
          <XIcon size={18} />
        </button>
        <p className="text-white font-semibold text-[15px] text-center flex-1">
          Scan Parcel QR at Origin Node
        </p>
        <span className="w-9" aria-hidden="true" />
      </div>

      {/* Camera + finder */}
      {!scanSuccess && <QrScannerView onScan={handleScan} isPaused={isScanningPickup} />}

      {/* Scanning indicator overlay */}
      {isScanningPickup && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            <p className="text-white text-[14px] font-medium">Verifying parcel…</p>
          </div>
        </div>
      )}

      {/* Scan success overlay */}
      {scanSuccess && (
        <div className="absolute inset-0 flex flex-col bg-bg-canvas z-20">
          {/* Success indicator */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
            <div className="w-16 h-16 rounded-full bg-status-success-bg text-status-success flex items-center justify-center text-[28px]">
              ✓
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-[17px] text-text-primary">
                Parcel Scanned Successfully
              </p>
              <p className="text-[13px] text-text-muted mt-1">Ready for Pickup</p>
            </div>

            {/* Destination node card */}
            {job && (
              <Card padding="md" className="w-full border-l-[3px] border-l-status-success">
                <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-2">
                  Destination Node
                </p>
                <div className="flex items-start gap-2.5">
                  <span className="w-8 h-8 rounded-[9px] bg-bg-subtle text-text-muted flex items-center justify-center shrink-0 mt-0.5">
                    <MapPinIcon size={14} />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-text-primary">{job.dropoff.label}</p>
                    <p className="text-[12px] text-text-muted">{job.dropoff.address}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Navigate CTA */}
          <div className="px-4 pb-8">
            <Button
              fullWidth size="lg"
              className="!bg-brand-blue"
              leftIcon={<NavigationIcon size={16} />}
              onClick={handleNavigate}
            >
              Navigate to Destination
            </Button>
          </div>
        </div>
      )}

      {/* Error state */}
      {pickupError && !scanSuccess && (
        <div className="absolute bottom-28 left-0 right-0 px-6">
          <Card padding="md" className="border-status-danger bg-status-danger-bg">
            <p className="text-[13px] font-semibold text-status-danger">
              {getErrorMessage(pickupError)}
            </p>
            <button
              onClick={resetPickupError}
              className="text-[12px] text-status-danger underline mt-1"
            >
              Try again
            </button>
          </Card>
        </div>
      )}

      {/* Hint */}
      {!scanSuccess && !isScanningPickup && (
        <div className="absolute bottom-8 left-0 right-0 text-center px-8">
          <p className="text-white/60 text-[13px]">
            Hold steady — we&apos;ll detect it automatically
          </p>
        </div>
      )}
    </div>
  );
}
