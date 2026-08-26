"use client";

import { useState } from "react";
import { Scanner, type IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { CameraIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface QrScannerViewProps {
  onScan: (value: string) => void;
  isPaused?: boolean;
}

/**
 * Live camera QR scanner with a custom corner-bracket viewfinder
 * overlay, matching the Figma "Scan the parcel's QR code" screen.
 * Requests camera permission on mount; shows a clear error state if
 * denied or unavailable (common on desktop browsers / no camera).
 */
export function QrScannerView({ onScan, isPaused }: QrScannerViewProps) {
  const [cameraError, setCameraError] = useState<string | null>(null);

  const handleScan = (codes: IDetectedBarcode[]) => {
    const value = codes[0]?.rawValue;
    if (value) onScan(value);
  };

  if (cameraError) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center gap-3">
        <span className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center">
          <CameraIcon size={26} />
        </span>
        <p className="text-white font-semibold text-[15px]">Camera unavailable</p>
        <p className="text-white/60 text-[13px] leading-[1.6] max-w-[280px]">{cameraError}</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <Scanner
        onScan={handleScan}
        onError={(error) =>
          setCameraError(
            error.kind === "permission-denied"
              ? "Camera access was denied. Enable it in your browser settings, or enter the code manually below."
              : "Couldn't start the camera. You can enter the code manually below."
          )
        }
        paused={isPaused}
        constraints={{ facingMode: "environment" }}
        components={{
          finder: false, // we render our own bracket overlay below
          torch: true,
          zoom: false,
        }}
        styles={{
          container: { width: "100%", height: "100%" },
          video: { width: "100%", height: "100%", objectFit: "cover" },
        }}
        sound={false}
      />

      {/* Custom corner-bracket viewfinder, matching Figma */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-[240px] h-[240px]">
          <Corner className="top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl" />
          <Corner className="top-0 right-0 border-t-2 border-r-2 rounded-tr-2xl" />
          <Corner className="bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl" />
          <Corner className="bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl" />

          {/* Animated scan line */}
          <div className="absolute left-0 right-0 h-[2px] bg-[#FF8A3D] shadow-[0_0_12px_rgba(255,138,61,0.8)] animate-scan-line" />
        </div>
      </div>

      <style jsx>{`
        @keyframes scan-line {
          0%, 100% { top: 8%; opacity: 0.9; }
          50% { top: 92%; opacity: 0.9; }
        }
        .animate-scan-line {
          animation: scan-line 2.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function Corner({ className }: { className: string }) {
  return (
    <span
      className={cn("absolute w-9 h-9 border-[#FF8A3D]", className)}
      aria-hidden="true"
    />
  );
}
