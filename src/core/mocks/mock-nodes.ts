import type { LocoomoNode } from "@/core/types";

/**
 * Mock Pickup Station network — mirrors the nodes shown in the Figma
 * "Select Nodes" screen (Victoria Island Hub, Ikeja Central Node, etc.)
 */
export const MOCK_NODES: LocoomoNode[] = [
  {
    id: "node_vi_hub",
    name: "Victoria Island Hub",
    address: "12 Adeola Odeku St",
    area: "Victoria Island",
    location: { lat: 6.4281, lng: 3.4219 },
    distanceKm: 0.4,
    openingHours: "8am – 8pm",
    isOpenNow: true,
    capacity: { total: 80, occupied: 22 },
  },
  {
    id: "node_ikeja_central",
    name: "Ikeja Central Node",
    address: "45 Allen Avenue",
    area: "Ikeja",
    location: { lat: 6.6018, lng: 3.3515 },
    distanceKm: 1.2,
    openingHours: "8am – 9pm",
    isOpenNow: true,
    capacity: { total: 60, occupied: 38 },
  },
  {
    id: "node_ikoyi_city_superama",
    name: "Ikoyi City Superama",
    address: "Awolowo Road",
    area: "Ikoyi",
    location: { lat: 6.4541, lng: 3.4316 },
    distanceKm: 1.8,
    openingHours: "7am – 10pm",
    isOpenNow: true,
    capacity: { total: 50, occupied: 12 },
  },
  {
    id: "node_lekki_phase1",
    name: "Lekki Phase 1 Node",
    address: "Admiralty Way",
    area: "Lekki",
    location: { lat: 6.4351, lng: 3.4726 },
    distanceKm: 3.6,
    openingHours: "8am – 8pm",
    isOpenNow: true,
    capacity: { total: 70, occupied: 51 },
  },
  {
    id: "node_yaba_tech",
    name: "Yaba Tech Hub",
    address: "Herbert Macaulay Way",
    area: "Yaba",
    location: { lat: 6.5095, lng: 3.3711 },
    distanceKm: 5.1,
    openingHours: "8am – 7pm",
    isOpenNow: false,
    capacity: { total: 40, occupied: 40 },
  },
];
