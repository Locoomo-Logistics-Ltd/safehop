"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { riderService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import type { RiderAvailability } from "@/core/types";

/** Online/Offline toggle on the Rider home screen, with optimistic UI update. */
export function useRiderAvailability() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEYS.riderAvailability,
    queryFn: () => riderService.getAvailability(),
  });

  const mutation = useMutation({
    mutationFn: (status: RiderAvailability) => riderService.setAvailability(status),
    onMutate: async (status) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.riderAvailability });
      const previous = queryClient.getQueryData<RiderAvailability>(QUERY_KEYS.riderAvailability);
      queryClient.setQueryData(QUERY_KEYS.riderAvailability, status);
      return { previous };
    },
    onError: (_err, _status, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.riderAvailability, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.riderAvailability });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.riderJobOffer });
    },
  });

  return {
    availability: query.data ?? "offline",
    isLoading: query.isLoading,
    toggle: () => mutation.mutate(query.data === "online" ? "offline" : "online"),
    isToggling: mutation.isPending,
  };
}
