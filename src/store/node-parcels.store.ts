import { create } from "zustand";
import type { AwaitingCollectionParcel, HandoffStatus } from "@/core/types";
import { HANDOFF_STATUS } from "@/core/types";

/**
 * Parcels sitting at this Node between the rider handing them over and
 * the receiver collecting them, held client-side.
 *
 * **This exists to paper over a real API gap, not by preference** — the
 * destination-side twin of store/rider-jobs.store.ts, and for the same
 * reason. `intake`, `collection-code/resend` and `collect` are all keyed
 * on the order **uuid** and scoped to the destination Node, but the only
 * documented uuid lookup, `GET /handoffs/orders/by-tracking-code/:code`,
 * is scoped to the *origin* Node. So a destination operator can never
 * look up an order they are, right now, holding in their hands.
 *
 * The uuid crosses their session exactly once: `confirm-handoff`
 * (`rider_arrival`) returns it at the counter when the rider hands over.
 * Everything after that — intake minutes later, collection hours later —
 * depends on having caught it then, which is what this store does.
 *
 * Consequences to keep in mind while this stands:
 *   - It's per-device and per-browser. An operator who confirms an
 *     arrival on the shop tablet and then serves the receiver on their
 *     phone has no record of the parcel on the phone. For a counter
 *     app that's usually one device, but it is a real failure mode.
 *   - Clearing site data strands every parcel currently at the Node.
 *     There is no recovery path from the frontend: nothing the operator
 *     can type resolves a tracking code to a uuid.
 *   - It can drift. The server owns status; we only learn about a
 *     transition when this client performs it.
 *   - Nothing here is trusted for authorization. Every call
 *     re-authorizes server-side; a stale entry just yields a 404 or a
 *     409, which the UI surfaces and prunes.
 *
 * Ask the backend team for a destination-scoped lookup or list (see
 * docs/API_INTEGRATION_STATUS.md's Handoffs section). Once one exists,
 * delete this store rather than keeping it as a cache.
 */

const STORAGE_KEY = "locoomo_node_awaiting_collection";

interface NodeParcelsState {
  parcels: AwaitingCollectionParcel[];
  /** False until the localStorage read has run, so the UI can tell "empty" from "not loaded yet". */
  isHydrated: boolean;

  hydrate: () => void;
  addParcel: (parcel: AwaitingCollectionParcel) => void;
  markIntakeDone: (orderId: string) => void;
  updateStatus: (orderId: string, status: HandoffStatus) => void;
  removeParcel: (orderId: string) => void;
  clear: () => void;
}

function readFromStorage(): AwaitingCollectionParcel[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AwaitingCollectionParcel[]) : [];
  } catch {
    return [];
  }
}

function writeToStorage(parcels: AwaitingCollectionParcel[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parcels));
  } catch {
    // Quota/private-mode failures are survivable — the in-memory copy
    // still carries the operator through the current session.
  }
}

export const useNodeParcelsStore = create<NodeParcelsState>((set, get) => ({
  parcels: [],
  isHydrated: false,

  hydrate: () => {
    if (get().isHydrated) return;
    set({ parcels: readFromStorage(), isHydrated: true });
  },

  addParcel: (parcel) => {
    // Newest first. Unlike the rider store there's no server-side cap to
    // mirror here — a busy Node can legitimately hold many parcels at
    // once, so this list isn't truncated.
    const parcels = [parcel, ...get().parcels.filter((p) => p.id !== parcel.id)];
    writeToStorage(parcels);
    set({ parcels });
  },

  markIntakeDone: (orderId) => {
    const parcels = get().parcels.map((p) =>
      p.id === orderId
        ? { ...p, status: HANDOFF_STATUS.readyForCollection, intakeAt: new Date().toISOString() }
        : p
    );
    writeToStorage(parcels);
    set({ parcels });
  },

  updateStatus: (orderId, status) => {
    const parcels = get().parcels.map((p) => (p.id === orderId ? { ...p, status } : p));
    writeToStorage(parcels);
    set({ parcels });
  },

  removeParcel: (orderId) => {
    const parcels = get().parcels.filter((p) => p.id !== orderId);
    writeToStorage(parcels);
    set({ parcels });
  },

  clear: () => {
    writeToStorage([]);
    set({ parcels: [] });
  },
}));

/** Intake has run and the receiver has been emailed a code — the parcel can now be collected. */
export function isReadyForCollection(parcel: AwaitingCollectionParcel): boolean {
  return parcel.status === HANDOFF_STATUS.readyForCollection;
}

/** On the counter but not yet checked in, so the receiver has been told nothing. Intake is the operator's next action. */
export function needsIntake(parcel: AwaitingCollectionParcel): boolean {
  return parcel.status === HANDOFF_STATUS.arrivedAtDestination;
}
