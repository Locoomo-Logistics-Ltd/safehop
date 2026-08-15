"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/core/config/constants";
import { decodeQrPayload } from "@/core/types";

/**
 * Turns a scanned QR (or a manually typed code) into a drop-off
 * preview.
 *
 * This used to call `vendorService.checkIn()` → the undocumented
 * `orders.scanHandoff` route, which resolved and checked the parcel in
 * atomically and needed a `qrNonce` plus the vendor's live GPS. The
 * documented `/handoffs` contract splits that in two — an
 * origin-scoped read (`by-tracking-code`) followed by a separate
 * `drop-off` write — and involves no nonce and no coordinates at all.
 * So scanning no longer mutates anything: it just carries the tracking
 * code to the preview screen, which does the lookup and owns the
 * confirm. `checkIn()` is left in place on the service but is no longer
 * called from this path.
 *
 * Consumer QRs may encode either a bare tracking code or the
 * `{ trackingCode, qrNonce }` JSON `decodeQrPayload` handles; both
 * still work, but only the tracking code matters now.
 */
export function useScanParcel() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const openDropOff = useCallback(
    (rawScannedValueOrCode: string) => {
      const decoded = decodeQrPayload(rawScannedValueOrCode);
      const trackingCode = (decoded?.trackingCode ?? rawScannedValueOrCode).trim();
      if (!trackingCode) return;

      // Held true through the route transition so the camera stays
      // paused and repeat frames don't fire a second navigation.
      setIsProcessing(true);
      router.push(ROUTES.vendorDropOff(encodeURIComponent(trackingCode)));
    },
    [router]
  );

  return {
    openDropOff,
    isProcessing,
  };
}
