"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XIcon } from "@/components/icons";
import { getErrorMessage } from "@/core/api/errors";
import { useScanParcel } from "@/modules/vendor/hooks/use-scan-parcel";
import { ROUTES } from "@/core/config/constants";
import { QrScannerView } from "./QrScannerView";
import { ManualCodeEntrySheet } from "./ManualCodeEntrySheet";

/**
 * Full-screen QR Scanner — matches the Figma "Scan the parcel's QR
 * code" screen. Real camera access via QrScannerView; falls back to
 * manual code entry if the camera is denied/unavailable or the
 * vendor taps "Having trouble?".
 */
export function QrScannerScreen() {
  const router = useRouter();
  const [showManualEntry, setShowManualEntry] = useState(false);
  const { lookupAndCheckIn, isProcessing, error, reset } = useScanParcel();

  const handleScan = (value: string) => {
    if (isProcessing) return; // ignore repeat frames while a lookup is in flight
    lookupAndCheckIn(value);
  };

  const handleManualSubmit = (code: string) => {
    lookupAndCheckIn(code);
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-[max(16px,env(safe-area-inset-top))] pb-3">
        <button
          onClick={() => router.push(ROUTES.vendorHome)}
          aria-label="Close scanner"
          className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-white"
        >
          <XIcon size={18} />
        </button>
        <p className="text-white font-semibold text-[15px] text-center flex-1">
          Scan the parcel&apos;s QR code
        </p>
        <span className="w-9" aria-hidden="true" />
      </div>

      <QrScannerView onScan={handleScan} isPaused={isProcessing} />

      {/* Hint + processing state */}
      <div className="absolute bottom-32 left-0 right-0 flex flex-col items-center gap-2 px-8">
        {isProcessing ? (
          <p className="text-white text-[13px] font-medium">Looking up parcel…</p>
        ) : (
          <p className="text-white/70 text-[13px] text-center">
            Hold steady — we&apos;ll detect it automatically
          </p>
        )}

        {error && (
          <p className="text-[#FF8A3D] text-[12px] text-center mt-1">{getErrorMessage(error)}</p>
        )}
      </div>

      {/* Manual entry trigger */}
      <div className="absolute bottom-8 left-0 right-0 px-6">
        <button
          onClick={() => {
            reset();
            setShowManualEntry(true);
          }}
          className="w-full h-12 rounded-full border border-white/30 text-white text-[14px] font-medium"
        >
          Having trouble? Enter code manually
        </button>
      </div>

      {showManualEntry && (
        <ManualCodeEntrySheet
          onSubmit={handleManualSubmit}
          onClose={() => setShowManualEntry(false)}
          isSubmitting={isProcessing}
          error={error ? getErrorMessage(error) : null}
        />
      )}
    </div>
  );
}
