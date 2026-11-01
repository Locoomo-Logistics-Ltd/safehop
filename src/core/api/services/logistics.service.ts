import { httpClient } from "@/core/api/client";
import { ENDPOINTS } from "@/core/api/endpoints";
import type { PaginatedList } from "@/core/api/types";
import type {
  AdminDelivery,
  AdminDeliveryFilters,
  Economics,
  LogisticsProvider,
  ProviderWallet,
  PublicTracking,
  RouteDistances,
  RouteRefreshResult,
  UpdateLogisticsProviderPayload,
  UpdateVehicleRulePayload,
  VehicleRule,
} from "@/core/types";

/**
 * Logistics surfaces that don't belong to one role's service: the
 * unauthenticated public tracking lookup and the Admin courier/vehicle/
 * route/delivery/economics screens (docs/LOGISTICS_API.md §7–§8).
 * Sender quotes and Node counter actions live in `deliveryService` and
 * `nodeService`, next to the flows that use them.
 */

/** Exactly one credential: the `t` token off the tracking link, or the receiver phone's last four digits. */
export type TrackingCredential = { token: string } | { phoneLast4: string };

const publicTrackingService = {
  /**
   * GET /track/:code — no session. Every failure except a malformed
   * request is `404 NOT_FOUND` by design (wrong code, token, digits, or
   * >30 days after collection), so callers show one generic message.
   * `skipAuth` keeps a stray 401 from triggering a session refresh.
   */
  async track(trackingCode: string, credential: TrackingCredential): Promise<PublicTracking> {
    const query = new URLSearchParams();
    if ("token" in credential) query.set("t", credential.token);
    else query.set("phoneLast4", credential.phoneLast4);
    return httpClient.get<PublicTracking>(
      `${ENDPOINTS.logistics.track(trackingCode)}?${query.toString()}`,
      { skipAuth: true }
    );
  },
};

const adminLogisticsService = {
  async listProviders(): Promise<LogisticsProvider[]> {
    return httpClient.get<LogisticsProvider[]>(ENDPOINTS.adminLogistics.providers);
  },

  async updateProvider(
    key: string,
    payload: UpdateLogisticsProviderPayload
  ): Promise<LogisticsProvider> {
    return httpClient.patch<LogisticsProvider>(ENDPOINTS.adminLogistics.provider(key), payload);
  },

  /** `404 NOT_FOUND` for couriers without a prepaid wallet (e.g. `in_house`). */
  async getProviderWallet(key: string): Promise<ProviderWallet> {
    return httpClient.get<ProviderWallet>(ENDPOINTS.adminLogistics.providerWallet(key));
  },

  async listVehicleRules(): Promise<VehicleRule[]> {
    return httpClient.get<VehicleRule[]>(ENDPOINTS.adminLogistics.vehicleRules);
  },

  async updateVehicleRule(
    vehicleClass: string,
    payload: UpdateVehicleRulePayload
  ): Promise<VehicleRule> {
    return httpClient.patch<VehicleRule>(ENDPOINTS.adminLogistics.vehicleRule(vehicleClass), payload);
  },

  async getRouteDistances(includePending = false): Promise<RouteDistances> {
    return httpClient.get<RouteDistances>(
      `${ENDPOINTS.adminLogistics.routeDistances}?includePending=${includePending}`
    );
  },

  /** `alreadyRunning: true` is not an error — show "Already refreshing…". */
  async refreshRouteDistances(includePending = false): Promise<RouteRefreshResult> {
    return httpClient.post<RouteRefreshResult>(ENDPOINTS.adminLogistics.routeDistancesRefresh, {
      includePending,
    });
  },

  async listDeliveries(filters: AdminDeliveryFilters = {}): Promise<PaginatedList<AdminDelivery>> {
    const query = new URLSearchParams();
    if (filters.trackingCode?.trim()) query.set("trackingCode", filters.trackingCode.trim());
    if (filters.status) query.set("status", filters.status);
    if (filters.provider) query.set("provider", filters.provider);
    if (filters.stuck) query.set("stuck", "true");
    query.set("page", String(filters.page ?? 1));
    query.set("limit", String(filters.limit ?? 20));
    return httpClient.get<PaginatedList<AdminDelivery>>(
      `${ENDPOINTS.adminLogistics.deliveries}?${query.toString()}`
    );
  },

  async runDeliveryAction(
    id: string,
    action: "retry" | "fallback" | "reconcile"
  ): Promise<AdminDelivery> {
    return httpClient.post<AdminDelivery>(ENDPOINTS.adminLogistics.deliveryAction(id, action));
  },

  async getEconomics(params: { provider?: string; page?: number; limit?: number } = {}): Promise<Economics> {
    const query = new URLSearchParams();
    if (params.provider) query.set("provider", params.provider);
    query.set("page", String(params.page ?? 1));
    query.set("limit", String(params.limit ?? 20));
    return httpClient.get<Economics>(`${ENDPOINTS.adminLogistics.economics}?${query.toString()}`);
  },
};

export { publicTrackingService, adminLogisticsService };
