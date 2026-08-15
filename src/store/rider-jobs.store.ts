import { create } from "zustand";
import type { AcceptedDelivery, HandoffStatus } from "@/core/types";
import { HANDOFF_STATUS, RIDER_MAX_CONCURRENT_DELIVERIES } from "@/core/types";

/**
 * The rider's accepted deliveries, held client-side.
 *
 * **This exists to paper over a real API gap, not by preference.**
 * docs/API.md has no rider-scoped "my deliveries" endpoint:
 * `GET /orders` is Consumer-only, and `GET /handoffs/available-orders`
 * by definition only returns orders *nobody* has claimed. So the
 * instant a rider accepts, the order vanishes from every list they're
 * allowed to query — while they still need its `id` to call
 * `POST /handoffs/orders/:id/request-code` at both ends of the trip.
 *
 * Consequences to keep in mind while this stands:
 *   - It's per-device. A rider who accepts on their phone and then
 *     opens the app on a tablet sees nothing.
 *   - It can drift. The server is the authority on status; we only
 *     learn about a transition when *this* client performs it. A
 *     handoff confirmed by the Node operator (`confirm-handoff`) moves
 *     the order server-side with no signal to the rider's client, so
 *     `markInTransit`/`markArrived` are the rider's own best guess.
 *   - Nothing here is trusted for authorization. Every call still
 *     re-authorizes server-side; a stale entry just yields a
 *     `404 NOT_FOUND` on `request-code`, which the UI treats as "this
 *     delivery is done or was never yours" and prunes.
 *
 * Ask the backend team for `GET /handoffs/my-deliveries` (or a
 * rider-scoped filter on an orders route). Once it exists, this store
 * should be deleted outright rather than kept as a cache.
 *
 * Persisted to localStorage by hand rather than via zustand/middleware
 * `persist` — the other two stores in this folder are plain `create()`
 * calls and the middleware isn't in use anywhere in the app yet.
 */

const STORAGE_KEY = "locoomo_rider_accepted_deliveries";

interface RiderJobsState {
  deliveries: AcceptedDelivery[];
  /** False until the localStorage read has run, so the UI can tell "empty" from "not loaded yet". */
  isHydrated: boolean;

  hydrate: () => void;
  addDelivery: (delivery: AcceptedDelivery) => void;
  updateStatus: (orderId: string, status: HandoffStatus) => void;
  removeDelivery: (orderId: string) => void;
  clear: () => void;
}

function readFromStorage(): AcceptedDelivery[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AcceptedDelivery[]) : [];
  } catch {
    return [];
  }
}

function writeToStorage(deliveries: AcceptedDelivery[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(deliveries));
  } catch {
    // Quota/private-mode failures are survivable — the in-memory copy
    // still carries the rider through the current session.
  }
}

export const useRiderJobsStore = create<RiderJobsState>((set, get) => ({
  deliveries: [],
  isHydrated: false,

  hydrate: () => {
    if (get().isHydrated) return;
    set({ deliveries: readFromStorage(), isHydrated: true });
  },

  addDelivery: (delivery) => {
    const existing = get().deliveries.filter((d) => d.id !== delivery.id);
    // Newest first, and hard-capped at the server's own concurrency
    // limit so a drifted store can't grow unbounded.
    const deliveries = [delivery, ...existing].slice(0, RIDER_MAX_CONCURRENT_DELIVERIES);
    writeToStorage(deliveries);
    set({ deliveries });
  },

  updateStatus: (orderId, status) => {
    const deliveries = get().deliveries.map((d) =>
      d.id === orderId ? { ...d, status } : d
    );
    writeToStorage(deliveries);
    set({ deliveries });
  },

  removeDelivery: (orderId) => {
    const deliveries = get().deliveries.filter((d) => d.id !== orderId);
    writeToStorage(deliveries);
    set({ deliveries });
  },

  clear: () => {
    writeToStorage([]);
    set({ deliveries: [] });
  },
}));

/**
 * A delivery is finished from the rider's point of view once it's been
 * handed to the destination Node — there's nothing further for them to
 * do on it, so it drops off the active list.
 */
export function isDeliveryComplete(delivery: AcceptedDelivery): boolean {
  return delivery.status === HANDOFF_STATUS.arrivedAtDestination;
}

/**
 * Which handoff the rider is heading into next: they're collecting at
 * the origin until the origin operator confirms `rider_pickup`, and
 * delivering to the destination after that.
 */
export function nextHandoffType(delivery: AcceptedDelivery): "rider_pickup" | "rider_arrival" {
  return delivery.status === HANDOFF_STATUS.inTransit ? "rider_arrival" : "rider_pickup";
}
