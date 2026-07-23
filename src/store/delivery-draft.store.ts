import { create } from "zustand";
import type {
  DeliveryMethod,
  ParcelDetails,
  ReceiverDetails,
} from "@/core/types";

interface DeliveryDraftState {
  receiver: ReceiverDetails | null;
  parcel: ParcelDetails | null;
  /** Free-text destination address (real API geocodes this server-side — see delivery.types.ts). */
  destinationAddress: string | null;
  originNodeId: string | null;
  method: DeliveryMethod | null;

  setReceiverAndParcel: (receiver: ReceiverDetails, parcel: ParcelDetails) => void;
  setDestinationAddress: (address: string) => void;
  setOriginNode: (nodeId: string | null) => void;
  setMethod: (method: DeliveryMethod) => void;
  reset: () => void;
}

const initialState = {
  receiver: null,
  parcel: null,
  destinationAddress: null,
  originNodeId: null,
  method: null,
};

/**
 * Holds in-progress "New Delivery" form state across the multi-step
 * flow (New Delivery → Select Origin Node & Destination Address →
 * Method → Checkout). Cleared on successful submission or when the
 * user backs out entirely.
 */
export const useDeliveryDraftStore = create<DeliveryDraftState>((set) => ({
  ...initialState,

  setReceiverAndParcel: (receiver, parcel) => set({ receiver, parcel }),
  setDestinationAddress: (address) => set({ destinationAddress: address }),
  setOriginNode: (nodeId) => set({ originNodeId: nodeId }),
  setMethod: (method) => set({ method }),
  reset: () => set(initialState),
}));
