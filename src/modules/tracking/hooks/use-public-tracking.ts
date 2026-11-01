"use client";

import { useQuery } from "@tanstack/react-query";
import { publicTrackingService, type TrackingCredential } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { isApiError } from "@/core/api/errors";

/**
 * `GET /track/:code` — the unauthenticated tracking page (docs/LOGISTICS_API.md §7).
 *
 * - Exactly one credential is ever sent: the `t` token off the tracking
 *   link, or the receiver phone's last four digits.
 * - Every failure but a malformed request is a `404` by design (wrong
 *   code, token or digits, or >30 days after collection), so the screen
 *   shows one generic message and this never retries a 404.
 * - Refreshes every 60 s while the tab is visible (TanStack pauses
 *   interval refetches in a hidden tab) and stops once `isFinal`.
 * - Backs off on `429` rather than polling into a rate limit.
 */
export function usePublicTracking(trackingCode: string, credential: TrackingCredential | null) {
  const credentialKey = !credential ? "" : "token" in credential ? `t:${credential.token}` : `p:${credential.phoneLast4}`;

  const query = useQuery({
    queryKey: QUERY_KEYS.publicTracking(trackingCode, credentialKey),
    queryFn: () => publicTrackingService.track(trackingCode, credential!),
    enabled: !!trackingCode && !!credential,
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: (q) => {
      if (q.state.data?.isFinal) return false;
      if (isApiError(q.state.error) && q.state.error.code === "RATE_LIMITED") return 3 * 60_000;
      return 60_000;
    },
  });

  const code = isApiError(query.error) ? query.error.code : null;

  return {
    tracking: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    notFound: code === "NOT_FOUND" || code === "VALIDATION_FAILED",
    rateLimited: code === "RATE_LIMITED",
    hasError: query.isError,
    refetch: query.refetch,
  };
}
