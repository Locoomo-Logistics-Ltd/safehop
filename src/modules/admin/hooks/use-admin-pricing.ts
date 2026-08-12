"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { useNotificationStore } from "@/store/notification.store";
import { getErrorMessage } from "@/core/api/errors";
import type { CreatePricingRulePayload } from "@/core/types";

/** GET /admin/pricing — real, confirmed route per docs/API.md. Rate history, newest first. */
export function usePricingRules() {
  const query = useQuery({
    queryKey: QUERY_KEYS.adminPricingRules,
    queryFn: () => adminService.getPricingRules(),
    retry: false,
  });

  return {
    rules: query.data ?? [],
    isLoading: query.isLoading,
  };
}

/** POST /admin/pricing — real, confirmed route per docs/API.md. Append-only: never edits an existing rule, adds a new "current" one. */
export function useCreatePricingRule() {
  const queryClient = useQueryClient();
  const showNotification = useNotificationStore((s) => s.showNotification);

  const mutation = useMutation({
    mutationFn: (payload: CreatePricingRulePayload) => adminService.createPricingRule(payload),
    onSuccess: () => {
      showNotification({ type: "success", title: "Pricing rule added", message: "This rate is now current for new orders." });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminPricingRules });
    },
    onError: (error) => {
      showNotification({ type: "error", title: "Couldn't add pricing rule", message: getErrorMessage(error) });
    },
  });

  return {
    createPricingRule: mutation.mutate,
    isSubmitting: mutation.isPending,
  };
}
