"use client";

import { useQuery } from "@tanstack/react-query";
import { riderService } from "@/core/api/services";

/** Fetches vehicle/profile details shown on the Rider Profile screen. */
export function useRiderProfile() {
  const query = useQuery({
    queryKey: ["rider", "profile-details"],
    queryFn: () => riderService.getProfileDetails(),
  });

  return {
    details: query.data,
    isLoading: query.isLoading,
  };
}
