/**
 * Logistics domain — couriers (Sendii) and Locoomo riders, quotes,
 * returns, public tracking and the admin logistics screens. Shapes are
 * copied from docs/LOGISTICS_API.md §3; where that guide and
 * docs/API.md overlap, the logistics guide is the newer of the two.
 */

export type KnownOrderStatus =
  | "awaiting_drop_off"
  | "parcel_received_at_origin"
  | "rider_assigned"
  | "in_transit"
  | "arrived_at_destination"
  | "ready_for_collection"
  | "completed"
  | "return_initiated"
  | "return_in_transit"
  | "returned_to_origin"
  | "ready_for_sender_collection"
  | "return_completed"
  | "cancelled"
  | "disputed";

export type HandlingFlag = "fragile" | "keep_upright" | "perishable" | "liquid";
export type VehicleClass = "bicycle" | "motorbike" | "car" | "van" | "truck";

export const HANDLING_LABELS: Record<HandlingFlag, string> = {
  fragile: "Fragile",
  keep_upright: "Keep upright",
  perishable: "Perishable",
  liquid: "Liquid",
};

export const VEHICLE_LABELS: Record<VehicleClass, string> = {
  bicycle: "bicycle",
  motorbike: "motorbike",
  car: "car",
  van: "van",
  truck: "truck",
};

/** Parcel details as returned on orders. */
export interface Parcel {
  parcelSize: "small" | "medium" | "large" | "extra_large";
  weightKg: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  handling: HandlingFlag[];
  vehicleClass: VehicleClass | null;
}

export type DeliveryLegStatus =
  | "requested"
  | "assigned"
  | "picked_up"
  | "delivered"
  | "returning"
  | "returned"
  | "cancelled";

/** `delivery` on order responses: the order's current (or latest) courier leg. */
export interface OrderDelivery {
  /** Opaque — new couriers arrive without frontend changes. Display `providerLabel`, switch only on `handover`. */
  provider: string;
  providerLabel: string;
  type: "forward" | "return";
  status: DeliveryLegStatus;
  vehicleClass: VehicleClass | null;
  handover: "enter_rider_code" | "give_code_to_courier";
  courier: {
    name: string | null;
    /** Node staff only — never present for senders. */
    phone?: string | null;
    vehicle: string | null;
  } | null;
  etaMinutes: number | null;
  /** 2+ after a courier failed and was retried or replaced. */
  attemptNumber: number;
  updatedAt: string;
}

export type NextAction =
  | "confirm_drop_off"
  | "await_courier"
  | "hand_to_rider"
  | "hand_to_courier"
  | "await_arrival"
  | "receive_from_rider"
  | "receive_from_courier"
  | "intake"
  | "hand_to_receiver"
  | "return_intake"
  | "hand_to_sender"
  | "none";

export type DayHours = { open: string; close: string }[];
/** A missing day means closed. Times are `HH:mm`, Lagos local. */
export interface OpeningHours {
  mon?: DayHours;
  tue?: DayHours;
  wed?: DayHours;
  thu?: DayHours;
  fri?: DayHours;
  sat?: DayHours;
  sun?: DayHours;
}

/** Returned by every counter/rider action endpoint. */
export interface OrderTransition {
  id: string;
  trackingCode: string;
  status: string;
  originNodeId: string;
  destinationNodeId: string;
  shelfNumber: number | null;
}

export interface LabelInstructions {
  lines: string[];
  note: string;
}

// ── Sender: options + quotes ─────────────────────────────────────

export interface DeliveryOptions {
  parcelSizes: Parcel["parcelSize"][];
  handlingFlags: HandlingFlag[];
  limits: {
    weightKg: { min: number; max: number; decimals: number };
    dimensionCm: { min: number; max: number };
  };
  vehicles: {
    vehicleClass: VehicleClass;
    parcelSizes: Parcel["parcelSize"][];
    maxWeightKg: number;
    maxLongestSideCm: number;
  }[];
}

export interface DeliveryQuoteRequest {
  originNodeId: string;
  destinationNodeId: string;
  parcelSize: Parcel["parcelSize"];
  weightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  handling?: HandlingFlag[];
}

export interface DeliveryQuoteResult {
  amountKobo: number;
  vehicleClass: VehicleClass;
  estimatedDeliveryMinutes: number;
  distanceKm: number;
  feeBreakdown: import("./payment.types").PaymentIntentFeeBreakdown;
  validUntil: string;
}

export interface OrderTimelineEntry {
  status: string;
  label: string;
  at: string;
}

// ── Node counter ────────────────────────────────────────────────

export type NodeQueue = "to_receive" | "to_dispatch" | "incoming" | "to_collect";

export interface CourierHandover {
  kind: "pickup" | "delivery" | "return_delivery";
  code: string;
  courier: { name: string | null; phone: string | null; vehicle: string | null } | null;
  providerLabel: string;
  shelfNumber: number | null;
  trackingCode: string;
}

// ── Public tracking ─────────────────────────────────────────────

export type PublicTrackingStatus =
  | "awaiting_drop_off"
  | "at_origin_station"
  | "on_the_way"
  | "arrived_at_destination"
  | "ready_for_collection"
  | "collected"
  | "returning_to_sender"
  | "returned_to_sender"
  | "return_completed";

export interface PublicTrackingNode {
  name: string;
  city: string;
  address?: string;
  state?: string;
  openingHours?: OpeningHours;
}

export interface PublicTracking {
  trackingCode: string;
  status: PublicTrackingStatus;
  statusLabel: string;
  isFinal: boolean;
  timeline: OrderTimelineEntry[];
  origin: PublicTrackingNode;
  destination: PublicTrackingNode;
  courierLabel: string | null;
  etaMinutes: number | null;
  nextStep: string;
  updatedAt: string;
}

// ── Admin ───────────────────────────────────────────────────────

export interface LogisticsProvider {
  key: string;
  label: string;
  enabled: boolean;
  priority: number;
  maxAttempts: number;
  assignTimeoutMinutes: number | null;
  minDistanceKm: number | null;
  maxDistanceKm: number | null;
  pilotNodeIds: string[] | null;
  maxCostShare: number | null;
  lowBalanceAlertKobo: number | null;
  activeDeliveries: number;
  registered: boolean;
  capabilities: {
    vehicleClasses: VehicleClass[];
    handover: string;
    updates: string;
    prepaidWallet: boolean;
  } | null;
}

export interface UpdateLogisticsProviderPayload {
  enabled?: boolean;
  /** 1–10000, lower is tried first. Locoomo riders (1000) are always the fallback. */
  priority?: number;
  maxAttempts?: number;
  assignTimeoutMinutes?: number | null;
  minDistanceKm?: number | null;
  maxDistanceKm?: number | null;
  pilotNodeIds?: string[] | null;
  maxCostShare?: number | null;
  /** Naira, not kobo. */
  lowBalanceAlertNaira?: number | null;
}

export interface ProviderWallet {
  providerKey: string;
  availableKobo: number;
  balanceKobo: number;
  heldKobo: number;
  reservedForSurchargesKobo: number;
  freeKobo: number;
  lowBalanceAlertKobo: number | null;
  lowBalance: boolean;
}

export interface VehicleRule {
  vehicleClass: VehicleClass;
  rank: number;
  enabled: boolean;
  parcelSizes: Parcel["parcelSize"][];
  maxWeightKg: number;
  maxLongestSideCm: number;
  updatedAt: string;
}

export type UpdateVehicleRulePayload = Partial<
  Pick<VehicleRule, "enabled" | "rank" | "parcelSizes" | "maxWeightKg" | "maxLongestSideCm">
>;

export interface RouteRefreshResult {
  queued: boolean;
  alreadyRunning: boolean;
  providerKey: string;
  pairs: number;
  estimatedSeconds: number;
}

export interface RouteDistances {
  measuringProvider: string | null;
  refreshRunning: boolean;
  eligiblePairs: number;
  measuredPairs: number;
  lastMeasuredAt: string | null;
  routes: {
    originNodeId: string;
    originNodeName: string;
    destinationNodeId: string;
    destinationNodeName: string;
    straightLineKm: number;
    roadDistanceKm: number;
    source: string;
    updatedAt: string;
  }[];
}

export interface AdminDelivery {
  id: string;
  orderId: string;
  orderTrackingCode: string;
  orderStatus: string;
  provider: string;
  providerLabel: string;
  legType: "forward" | "return";
  status: DeliveryLegStatus;
  providerStatus: string | null;
  externalId: string | null;
  attemptNumber: number;
  vehicleClass: VehicleClass | null;
  courierName: string | null;
  courierPhone: string | null;
  quotedKobo: number | null;
  actualKobo: number | null;
  surchargeKobo: number;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  endedAt: string | null;
}

export interface AdminDeliveryFilters {
  trackingCode?: string;
  status?: DeliveryLegStatus;
  provider?: string;
  stuck?: boolean;
  page?: number;
  limit?: number;
}

export interface EconomicsItem {
  orderId: string;
  orderTrackingCode: string;
  orderStatus: string;
  providers: string[];
  customerPaidKobo: number;
  deliveryFeeKobo: number;
  courierCostKobo: number;
  settled: boolean;
  createdAt: string;
  courierAllocationKobo: number;
  allocationEstimated: boolean;
  marginKobo: number;
}

export interface Economics {
  items: EconomicsItem[];
  page: number;
  limit: number;
  total: number;
  totals: {
    orders: number;
    customerPaidKobo: number;
    courierCostKobo: number;
    courierAllocationKobo: number;
    marginKobo: number;
  };
}
