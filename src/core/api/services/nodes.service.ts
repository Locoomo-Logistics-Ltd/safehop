
import { httpClient } from "@/core/api/client";
import { ENDPOINTS } from "@/core/api/endpoints";
// import { ApiError } from "@/core/api/errors";
// import { mockDelay } from "@/core/mocks/mock-utils";
// import { MOCK_NODES } from "@/core/mocks/mock-nodes";
import type { PaginatedList } from "@/core/api/types";
import type { GeoPoint, PickupNode } from "@/core/types";

/**
 * Nodes service — Pickup Station directory for the Consumer's node
 * picker (New Delivery → Select Nodes). Fixed 2026-08-12 against the
 * real, documented contract — previously sent `radiusInMeters` and
 * parsed a flat array, but `GET /nodes/nearby` per docs/API.md takes
 * `radiusKm` (0.1–100) and returns the paginated envelope
 * `{items, page, limit, total}` with `distanceMeters` per item, sorted
 * nearest-first. Was flagged as the single highest-priority fix in
 * docs/API_INTEGRATION_STATUS.md — a real backend would have 400'd on
 * every call, and even past that, `.map()`-ing the response directly
 * would have crashed on the paginated object.
 */

interface RawNode {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  capacity: number;
  operatingHours: string | null;
}

interface RawNearbyNode extends RawNode {
  distanceMeters: number;
}

function mapNode(raw: RawNode): PickupNode {
  return {
    id: raw.id,
    name: raw.name,
    address: raw.address,
    city: raw.city,
    state: raw.state,
    location: { lat: raw.latitude, lng: raw.longitude },
    capacity: raw.capacity,
    operatingHours: raw.operatingHours,
  };
}

function mapNearbyNode(raw: RawNearbyNode): PickupNode {
  return { ...mapNode(raw), distanceKm: raw.distanceMeters / 1000 };
}

// const mockNodesService = {
//   async listNearby(position: GeoPoint): Promise<PickupNode[]> {
//     void position;
//     await mockDelay();
//     return MOCK_NODES;
//   },
// };

const realNodesService = {
  /** GET /nodes/nearby — real, confirmed route per docs/API.md. Always `active`-only, any authenticated role. */
  async listNearby(position: GeoPoint, radiusKm = 25): Promise<PickupNode[]> {
    const params = new URLSearchParams({
      latitude: String(position.lat),
      longitude: String(position.lng),
      radiusKm: String(radiusKm),
      limit: "100",
    });
    const raw = await httpClient.get<PaginatedList<RawNearbyNode>>(`${ENDPOINTS.nodes.nearby}?${params.toString()}`);
    return raw.items.map(mapNearbyNode);
  },

  /** GET /nodes/:id — real, confirmed route per docs/API.md. Any authenticated role; 404 if the Node exists but isn't `active`. */
  async getById(id: string): Promise<PickupNode> {
    const raw = await httpClient.get<RawNode>(ENDPOINTS.adminNodes.detail(id));
    return mapNode(raw);
  },
};

export const nodesService = realNodesService;
