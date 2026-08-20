"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { useNotificationStore } from "@/store/notification.store";
import { getErrorMessage } from "@/core/api/errors";
import type { AdminRevenueSplitEntryFilters, CreateRevenueSplitRatioPayload } from "@/core/types";

/** GET /admin/revenue-split — real, confirmed route per docs/API.md. Ratio history, newest first. */
export function useRevenueSplitRatios() {
  const query = useQuery({
    queryKey: QUERY_KEYS.adminRevenueSplitRatios,
    queryFn: () => adminService.getRevenueSplitRatios(),
    retry: false,
  });

  return {
    ratios: query.data ?? [],
    isLoading: query.isLoading,
  };
}

/** POST /admin/revenue-split — real, confirmed route per docs/API.md. Append-only: never edits an existing ratio, adds a new "current" one. */
export function useCreateRevenueSplitRatio() {
  const queryClient = useQueryClient();
  const showNotification = useNotificationStore((s) => s.showNotification);

  const mutation = useMutation({
    mutationFn: (payload: CreateRevenueSplitRatioPayload) => adminService.createRevenueSplitRatio(payload),
    onSuccess: () => {
      showNotification({ type: "success", title: "Revenue split updated", message: "This ratio is now current for new completions." });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminRevenueSplitRatios });
    },
    onError: (error) => {
      showNotification({ type: "error", title: "Couldn't update revenue split", message: getErrorMessage(error) });
    },
  });

  return {
    createRatio: mutation.mutate,
    isSubmitting: mutation.isPending,
  };
}

/** GET /admin/revenue-split/entries — real, confirmed route per docs/API.md. Every entry across every completed order, newest first. */
export function useRevenueSplitEntries(filters?: AdminRevenueSplitEntryFilters) {
  const query = useQuery({
    queryKey: [...QUERY_KEYS.adminRevenueSplitEntries, filters?.partyType ?? null, filters?.payoutStatus ?? null] as const,
    queryFn: () => adminService.getRevenueSplitEntries(filters),
    retry: false,
  });

  return {
    entries: query.data ?? [],
    isLoading: query.isLoading,
  };
}

/** PATCH /admin/revenue-split/entries/:id/mark-paid — real, confirmed route per docs/API.md. Idempotent. */
export function useMarkRevenueSplitEntryPaid() {
  const queryClient = useQueryClient();
  const showNotification = useNotificationStore((s) => s.showNotification);

  const mutation = useMutation({
    mutationFn: (entryId: string) => adminService.markRevenueSplitEntryPaid(entryId),
    onSuccess: () => {
      showNotification({ type: "success", title: "Marked as paid", message: "This entry is now recorded as settled." });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminRevenueSplitEntries });
    },
    onError: (error) => {
      showNotification({ type: "error", title: "Couldn't mark as paid", message: getErrorMessage(error) });
    },
  });

  return {
    markPaid: mutation.mutate,
    isMarkingPaidId: mutation.isPending ? mutation.variables : undefined,
  };
}
