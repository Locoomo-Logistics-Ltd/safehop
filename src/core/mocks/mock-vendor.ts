import type { NodeParcel } from "@/core/types";

/**
 * Mock parcels at the vendor's managed node — mirrors the Figma
 * Node Dashboard list (LC-482TX, LC-9932Y, LC-1104Z) and the QR
 * scan/success flow (LC-482TX is the one walked through scanning).
 */
export const MOCK_NODE_PARCELS: NodeParcel[] = [
  {
    id: "parcel_482tx",
    trackingCode: "LC-482TX",
    status: "awaiting_pickup",
    sender: { name: "Ngozi B." },
    receiver: { name: "Chukwuomeka O." },
    size: "medium",
    createdAt: "2026-06-24T14:30:00Z",
  },
  {
    id: "parcel_9932y",
    trackingCode: "LC-9932Y",
    status: "awaiting_rider",
    sender: { name: "Bisi Tech Ltd." },
    receiver: { name: "Peter D." },
    size: "large",
    createdAt: "2026-06-24T11:15:00Z",
  },
  {
    id: "parcel_1104z",
    trackingCode: "LC-1104Z",
    status: "delayed",
    sender: { name: "Tunde M." },
    receiver: { name: "Amaka P." },
    size: "small",
    createdAt: "2026-06-23T16:40:00Z",
  },
  {
    id: "parcel_8821y",
    trackingCode: "LC-8821Y",
    status: "ready_for_collection",
    sender: { name: "Funke A." },
    receiver: { name: "Daniel K." },
    size: "medium",
    shelfLocationId: "A1",
    checkedInAt: "2026-06-26T09:00:00Z",
    createdAt: "2026-06-25T10:00:00Z",
  },
];

/** The parcel scanned in the Figma "QR Scanner" → "Scan Success" walkthrough. */
export const MOCK_SCANNED_PARCEL: NodeParcel = MOCK_NODE_PARCELS[0];

export const MOCK_SHELF_LOCATIONS = {
  rackA: ["A1", "A2", "A3", "A4", "A5", "A6"],
  rackB: ["B1", "B2", "B3"],
} as const;

/** Shelf ids already occupied — disables those buttons in ShelfLocationPicker. */
export const MOCK_OCCUPIED_SHELVES = new Set(["A6", "A1"]);
