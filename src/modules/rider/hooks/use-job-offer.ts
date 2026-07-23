"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { riderService } from "@/core/api/services";
import { QUERY_KEYS, ROUTES } from "@/core/config/constants";
import { useGeolocation } from "@/hooks/use-geolocation";

/**
 * Fetches the rider's current job offer (only present while online
 * and not already on an active job) and exposes accept/decline.
 * Accepting routes straight into the active job screen, matching the
 * Figma "Accept Job" → "Job Accepted" transition.
 *
 * The real API's job-board endpoint needs the rider's live position
 * to search nearby — waits for useGeolocation before polling.
 */
export function useJobOffer() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { position } = useGeolocation();

  const query = useQuery({
    queryKey: [...QUERY_KEYS.riderJobOffer, position?.lat, position?.lng],
    queryFn: () => riderService.getCurrentJobOffer(position ?? undefined),
    enabled: !!position,
    refetchInterval: 15_000, // live polling for new offers
  });

  const acceptMutation = useMutation({
    mutationFn: (jobId: string) => riderService.acceptJob(jobId),
    onSuccess: (job) => {
      queryClient.setQueryData(QUERY_KEYS.riderActiveJob, job);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.riderJobOffer });
      router.push(ROUTES.riderActiveJob(job.id));
    },
  });

  const declineMutation = useMutation({
    mutationFn: () => riderService.declineJob(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.riderJobOffer });
    },
  });

  return {
    offer: query.data ?? null,
    isLoading: query.isLoading,

    acceptJob: acceptMutation.mutate,
    isAccepting: acceptMutation.isPending,

    declineJob: declineMutation.mutate,
    isDeclining: declineMutation.isPending,
  };
}
