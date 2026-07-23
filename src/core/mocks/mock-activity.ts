import type { ActivityLogEntry } from "@/core/types";

/**
 * Mock activity log — mirrors the Figma "Activity & Rider..." screen:
 * Handoff to Rider, Batch Received, Scan Exception (red), Node Closed.
 */
export const MOCK_ACTIVITY_LOG: ActivityLogEntry[] = [
  {
    id: "act_1",
    type: "handoff_to_rider",
    title: "Handoff to Rider",
    description: "Tunde A. picked up LC-482TX, LC-4822Y.",
    timestamp: "2026-06-27T10:42:00Z",
    isException: false,
    tag: "12 Removed from inventory",
  },
  {
    id: "act_2",
    type: "batch_received",
    title: "Batch Received",
    description: "Received 14 parcels from Main Hub transport.",
    timestamp: "2026-06-27T09:15:00Z",
    isException: false,
  },
  {
    id: "act_3",
    type: "scan_exception",
    title: "Scan Exception",
    description: "Barcode unreadable for 1 parcel. Manual entry logged.",
    timestamp: "2026-06-27T08:30:00Z",
    isException: true,
  },
  {
    id: "act_4",
    type: "node_closed",
    title: "Node Closed",
    description: "End of day reconciliation completed. 0 parcels remaining.",
    timestamp: "2026-06-26T20:00:00Z",
    isException: false,
  },
];
