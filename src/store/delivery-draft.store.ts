import { create } from "zustand";
import type {
  DeliveryMethod,
  ParcelDetails,
  ReceiverDetails,
} from "@/core/types";

interface DeliveryDraftState {
  receiver: ReceiverDetails | null;
  parcel: ParcelDetails | null;
  originNodeId: string | null;
  /** Real API requires a destination Node, not a free-text address — see core/types/payment.types.ts. */
  destinationNodeId: string | null;
  method: DeliveryMethod | null;

  setReceiverAndParcel: (receiver: ReceiverDetails, parcel: ParcelDetails) => void;
  setOriginNode: (nodeId: string | null) => void;
  setDestinationNode: (nodeId: string | null) => void;
  setMethod: (method: DeliveryMethod) => void;
  reset: () => void;
}

const initialState = {
  receiver: null,
  parcel: null,
  originNodeId: null,
  destinationNodeId: null,
  method: null,
};

/**
 * Holds in-progress "New Delivery" form state across the multi-step
 * flow (New Delivery → Select Origin & Destination Node → Method →
 * Checkout). Cleared on successful submission or when the user backs
 * out entirely.
 */
export const useDeliveryDraftStore = create<DeliveryDraftState>((set) => ({
  ...initialState,

  setReceiverAndParcel: (receiver, parcel) => set({ receiver, parcel }),
  setOriginNode: (nodeId) => set({ originNodeId: nodeId }),
  setDestinationNode: (nodeId) => set({ destinationNodeId: nodeId }),
  setMethod: (method) => set({ method }),
  reset: () => set(initialState),
}));
