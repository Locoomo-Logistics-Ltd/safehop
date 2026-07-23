import type { DeliveryJob } from "@/core/types";

/**
 * Mock delivery jobs — mirrors the Figma "New Delivery Job" offer
 * (Central Warehouse Beta → Nexus Tech Towers, 4.2km, ₦650) and the
 * "Job Accepted" active job (Central Hub Node Alpha, 2.4km).
 */
export const MOCK_JOB_OFFER: DeliveryJob = {
  id: "job_offer_1",
  status: "offered",
  isHighPriority: true,
  isHighDemandArea: false,
  payout: 650,
  distanceKm: 4.2,
  etaMinutes: 18,
  pickup: {
    label: "Central Warehouse Beta",
    address: "124 Logistics Blvd, Sector 7",
    location: { lat: 6.5355, lng: 3.3087 },
  },
  dropoff: {
    label: "Nexus Tech Towers",
    address: "880 Innovation Parkway, Floor 12",
    location: { lat: 6.4698, lng: 3.4286 },
  },
  parcelCount: 1,
  parcelNote: "Medium Box",
  pickupQrCode: "LC-7741AB",
  createdAt: "2026-06-28T09:00:00Z",
};

export const MOCK_ACTIVE_JOB: DeliveryJob = {
  id: "job_active_1",
  status: "accepted",
  isHighPriority: false,
  isHighDemandArea: false,
  payout: 800,
  distanceKm: 2.4,
  etaMinutes: 12,
  pickup: {
    label: "Central Hub Node Alpha",
    address: "445 Sector 70 Logistics Way",
    location: { lat: 6.5483, lng: 3.3658 },
  },
  dropoff: {
    label: "Sector 7-3 Fulfillment",
    address: "12 Industrial Avenue",
    location: { lat: 6.5021, lng: 3.3877 },
  },
  parcelCount: 3,
  parcelNote: "1 Express 2lb",
  pickupQrCode: "LC-482TX",
  acceptedAt: "2026-06-28T09:05:00Z",
  createdAt: "2026-06-28T09:00:00Z",
};

/** History rows for "My Deliveries" — mirrors the Figma list. */
export const MOCK_JOB_HISTORY: DeliveryJob[] = [
  {
    id: "job_h1",
    status: "delivered",
    isHighPriority: false,
    isHighDemandArea: false,
    payout: 700,
    distanceKm: 3.1,
    etaMinutes: 0,
    pickup: { label: "Node A", address: "—", location: { lat: 6.52, lng: 3.37 } },
    dropoff: { label: "Node D", address: "—", location: { lat: 6.5, lng: 3.39 } },
    parcelCount: 1,
    parcelNote: "",
    pickupQrCode: "LC-1001",
    deliveredAt: "2026-06-26T14:30:00Z",
    createdAt: "2026-06-26T14:00:00Z",
  },
  {
    id: "job_h2",
    status: "delivered",
    isHighPriority: false,
    isHighDemandArea: false,
    payout: 650,
    distanceKm: 2.8,
    etaMinutes: 0,
    pickup: { label: "Hub 5", address: "—", location: { lat: 6.51, lng: 3.36 } },
    dropoff: { label: "Node 9", address: "—", location: { lat: 6.49, lng: 3.38 } },
    parcelCount: 1,
    parcelNote: "",
    pickupQrCode: "LC-1002",
    deliveredAt: "2026-06-22T16:15:00Z",
    createdAt: "2026-06-22T15:45:00Z",
  },
  {
    id: "job_h3",
    status: "delivered",
    isHighPriority: false,
    isHighDemandArea: false,
    payout: 720,
    distanceKm: 4.0,
    etaMinutes: 0,
    pickup: { label: "Node F", address: "—", location: { lat: 6.53, lng: 3.34 } },
    dropoff: { label: "Hub 1", address: "—", location: { lat: 6.47, lng: 3.41 } },
    parcelCount: 2,
    parcelNote: "",
    pickupQrCode: "LC-1003",
    deliveredAt: "2026-06-22T10:40:00Z",
    createdAt: "2026-06-22T10:00:00Z",
  },
  {
    id: "job_h4",
    status: "declined",
    isHighPriority: false,
    isHighDemandArea: false,
    payout: 0,
    distanceKm: 1.9,
    etaMinutes: 0,
    pickup: { label: "Node K", address: "—", location: { lat: 6.5, lng: 3.35 } },
    dropoff: { label: "Node S", address: "—", location: { lat: 6.48, lng: 3.36 } },
    parcelCount: 1,
    parcelNote: "",
    pickupQrCode: "LC-1004",
    createdAt: "2026-06-20T11:00:00Z",
  },
];
