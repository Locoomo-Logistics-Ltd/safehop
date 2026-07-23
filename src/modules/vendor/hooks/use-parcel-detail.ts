"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";

/** Fetches a single node parcel by id — used on Scan Success and Release screens. */
export function useNodeParcel(parcelId: string) {
  const query = useQuery({
    queryKey: [...QUERY_KEYS.vendorParcels, parcelId],
    queryFn: async () => {
      const all = await vendorService.listParcels();
      const found = all.find((p) => p.id === parcelId);
      if (!found) throw new Error("Parcel not found");
      return found;
    },
    enabled: !!parcelId,
  });

  return {
    parcel: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/** Fetches available shelf locations for the Scan Success "Assign Shelf Location" step. */
export function useShelfLocations() {
  const query = useQuery({
    queryKey: QUERY_KEYS.vendorShelves,
    queryFn: () => vendorService.listShelves(),
  });

  return {
    shelves: query.data ?? [],
    isLoading: query.isLoading,
  };
}

/** Assigns a shelf to a checked-in parcel — the "Confirm & Store Parcel" action. */
export function useAssignShelf() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ parcelId, shelfId }: { parcelId: string; shelfId: string }) =>
      vendorService.assignShelf(parcelId, shelfId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vendorParcels });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vendorShelves });
    },
  });

  return {
    assignShelf: mutation.mutate,
    isAssigning: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
}
