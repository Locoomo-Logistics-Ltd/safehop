"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminLogisticsService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { getErrorMessage, isApiError } from "@/core/api/errors";
import { useNotificationStore } from "@/store/notification.store";
import type {
  AdminDeliveryFilters,
  UpdateLogisticsProviderPayload,
  UpdateVehicleRulePayload,
} from "@/core/types";

// Admin screens show `error.message` directly — it's written for operators
// (docs/LOGISTICS_API.md §9) — so these hooks surface it as the toast body.

/** GET /admin/logistics/providers — couriers (Sendii, in_house, …). */
export function useLogisticsProviders() {
  const query = useQuery({
    queryKey: QUERY_KEYS.adminLogisticsProviders,
    queryFn: () => adminLogisticsService.listProviders(),
    retry: false,
  });
  return { providers: query.data ?? [], isLoading: query.isLoading, isError: query.isError, error: query.error };
}

/** PATCH /admin/logistics/providers/:key — send only what changed; `null` clears a nullable setting. */
export function useUpdateProvider() {
  const queryClient = useQueryClient();
  const showNotification = useNotificationStore((s) => s.showNotification);

  const mutation = useMutation({
    mutationFn: ({ key, payload }: { key: string; payload: UpdateLogisticsProviderPayload }) =>
      adminLogisticsService.updateProvider(key, payload),
    onSuccess: (provider) => {
      showNotification({ type: "success", title: "Courier updated", message: `${provider.label} settings saved.` });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminLogisticsProviders });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminLogisticsWallet(provider.key) });
    },
    onError: (error) => {
      showNotification({ type: "error", title: "Couldn't save courier", message: getErrorMessage(error) });
    },
  });
  return { updateProvider: mutation.mutate, isSaving: mutation.isPending };
}

/** GET /admin/logistics/providers/:key/wallet — prepaid couriers only; a 404 just means "no wallet". */
export function useProviderWallet(key: string, enabled: boolean) {
  const query = useQuery({
    queryKey: QUERY_KEYS.adminLogisticsWallet(key),
    queryFn: () => adminLogisticsService.getProviderWallet(key),
    enabled,
    retry: false,
  });
  const error = query.error;
  // 404 = this courier has no wallet; any other failure (502 and friends) = we couldn't read it.
  const failed = isApiError(error) && error.status !== 404;
  return {
    wallet: query.data,
    isLoading: query.isLoading,
    unreachable: failed,
    /** Support reference the backend team can look up in their logs. */
    reference: failed ? error.correlationId : undefined,
    refetch: query.refetch,
    isRefetching: query.isFetching,
  };
}

export function useVehicleRules() {
  const query = useQuery({
    queryKey: QUERY_KEYS.adminLogisticsVehicleRules,
    queryFn: () => adminLogisticsService.listVehicleRules(),
    retry: false,
  });
  return { rules: query.data ?? [], isLoading: query.isLoading, isError: query.isError };
}

export function useUpdateVehicleRule() {
  const queryClient = useQueryClient();
  const showNotification = useNotificationStore((s) => s.showNotification);

  const mutation = useMutation({
    mutationFn: ({ vehicleClass, payload }: { vehicleClass: string; payload: UpdateVehicleRulePayload }) =>
      adminLogisticsService.updateVehicleRule(vehicleClass, payload),
    onSuccess: (rule) => {
      showNotification({ type: "success", title: "Vehicle rule saved", message: `${rule.vehicleClass} updated.` });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminLogisticsVehicleRules });
      // Senders' parcel form is built from these rules.
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.deliveryOptions });
    },
    onError: (error) => {
      showNotification({ type: "error", title: "Couldn't save vehicle rule", message: getErrorMessage(error) });
    },
  });
  return { updateRule: mutation.mutate, isSaving: mutation.isPending };
}

/** GET route-distances; polls every 5 s while a refresh is running, then stops (docs/LOGISTICS_API.md §10). */
export function useRouteDistances(includePending: boolean) {
  const query = useQuery({
    queryKey: [...QUERY_KEYS.adminLogisticsRoutes, includePending],
    queryFn: () => adminLogisticsService.getRouteDistances(includePending),
    retry: false,
    refetchInterval: (q) => (q.state.data?.refreshRunning ? 5_000 : false),
  });
  return { data: query.data, isLoading: query.isLoading, isError: query.isError, refetch: query.refetch };
}

export function useRefreshRoutes(includePending: boolean) {
  const queryClient = useQueryClient();
  const showNotification = useNotificationStore((s) => s.showNotification);

  const mutation = useMutation({
    mutationFn: () => adminLogisticsService.refreshRouteDistances(includePending),
    onSuccess: (result) => {
      // "Already refreshing" is an answer, not an error.
      showNotification({
        type: "success",
        title: result.alreadyRunning ? "Already refreshing…" : "Refresh started",
        message: result.alreadyRunning
          ? "A route refresh is already running."
          : `Measuring ${result.pairs} routes — about ${Math.ceil(result.estimatedSeconds / 60)} min.`,
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminLogisticsRoutes });
    },
    onError: (error) => {
      showNotification({ type: "error", title: "Couldn't start refresh", message: getErrorMessage(error) });
    },
  });
  return { refresh: mutation.mutate, isStarting: mutation.isPending };
}

export function useAdminDeliveries(filters: AdminDeliveryFilters) {
  const query = useQuery({
    queryKey: [...QUERY_KEYS.adminLogisticsDeliveries, filters],
    queryFn: () => adminLogisticsService.listDeliveries(filters),
    retry: false,
    refetchInterval: 30_000,
    placeholderData: (prev) => prev,
  });
  return {
    deliveries: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? filters.page ?? 1,
    limit: query.data?.limit ?? filters.limit ?? 20,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useDeliveryAction() {
  const queryClient = useQueryClient();
  const showNotification = useNotificationStore((s) => s.showNotification);

  const mutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "retry" | "fallback" | "reconcile" }) =>
      adminLogisticsService.runDeliveryAction(id, action),
    onSuccess: (delivery, { action }) => {
      const done = { retry: "Booking retried", fallback: "Handed to Locoomo riders", reconcile: "Status refreshed" }[action];
      showNotification({ type: "success", title: done, message: delivery.orderTrackingCode });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminLogisticsDeliveries });
    },
    onError: (error) => {
      // ILLEGAL_DELIVERY_ACTION's message already says why (e.g. "already picked up — use reconcile").
      showNotification({ type: "error", title: "Action refused", message: getErrorMessage(error) });
    },
  });
  return {
    run: mutation.mutate,
    pendingId: mutation.isPending ? mutation.variables?.id : undefined,
  };
}

export function useEconomics(params: { provider?: string; page: number }) {
  const query = useQuery({
    queryKey: [...QUERY_KEYS.adminLogisticsEconomics, params],
    queryFn: () => adminLogisticsService.getEconomics({ ...params, limit: 20 }),
    retry: false,
    placeholderData: (prev) => prev,
  });
  return { data: query.data, isLoading: query.isLoading, isError: query.isError };
}
