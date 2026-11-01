"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { PublicTrackingScreen } from "@/modules/tracking/components";

/**
 * Public tracking page — `/track/:trackingCode?t=<token>`. Deliberately
 * **outside every route group and `AuthGuard`**: the receiver has no
 * account, and the API's `GET /track/:code` is the one endpoint that
 * needs no session. (`/track` itself, the signed-in sender's order list,
 * stays in the `(user)` group.)
 */
function TrackContent() {
  const params = useParams<{ trackingCode: string }>();
  const searchParams = useSearchParams();
  const trackingCode = decodeURIComponent(params.trackingCode);
  const token = searchParams.get("t") ?? undefined;

  return <PublicTrackingScreen trackingCode={trackingCode} token={token} />;
}

export default function PublicTrackPage() {
  return (
    <Suspense fallback={null}>
      <TrackContent />
    </Suspense>
  );
}
