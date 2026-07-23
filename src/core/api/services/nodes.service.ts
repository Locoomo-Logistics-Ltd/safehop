import { env } from "@/core/config/env";
import { httpClient } from "@/core/api/client";
import { ENDPOINTS } from "@/core/api/endpoints";
import { ApiError } from "@/core/api/errors";
// import { mockDelay } from "@/core/mocks/mock-utils";
// import { MOCK_NODES } from "@/core/mocks/mock-nodes";
import type { GeoPoint, LocoomoNode } from "@/core/types";

/**
 * Nodes service — Pickup Station directory.
 * Real API: GET /nodes/nearby?latitude&longitude&radiusInMeters —
 * server-side distance sorting from the user's live position (from
 * useGeolocation), replacing the old client-side haversine sort.
 */

// const mockNodesService = {
//   async list(): Promise<LocoomoNode[]> {
//     await mockDelay();
//     return MOCK_NODES;
//   },

//   async listNearby(position: GeoPoint): Promise<LocoomoNode[]> {
//     void position;
//     await mockDelay();
//     return MOCK_NODES;
//   },

//   async getById(id: string): Promise<LocoomoNode> {
//     await mockDelay(300);
//     const node = MOCK_NODES.find((n) => n.id === id);
//     if (!node) {
//       throw new ApiError({ message: "Node not found.", status: 404, code: "NOT_FOUND" });
//     }
//     return node;
//   },
// };

const realNodesService = {
  /** @deprecated no longer meaningful without a reference point — use listNearby(). Kept so old call sites don't break; returns the same as listNearby with a Lagos-centered default. */
  async list(): Promise<LocoomoNode[]> {
    return this.listNearby({ lat: 6.5244, lng: 3.3792 });
  },

  async listNearby(position: GeoPoint, radiusMeters = 5000): Promise<LocoomoNode[]> {
    const params = new URLSearchParams({
      latitude: String(position.lat),
      longitude: String(position.lng),
      radiusInMeters: String(radiusMeters),
    });
    return httpClient.get<LocoomoNode[]>(`${ENDPOINTS.nodes.nearby}?${params.toString()}`);
  },

  async getById(id: string): Promise<LocoomoNode> {
    // The real spec doesn't expose a single-node detail endpoint —
    // fetch nearby and find it, or add a /nodes/:id route on the
    // backend if you need direct lookup often.
    const nodes = await this.listNearby({ lat: 6.5244, lng: 3.3792 }, 50_000);
    const node = nodes.find((n) => n.id === id);
    if (!node) {
      throw new ApiError({ message: "Node not found.", status: 404, code: "NOT_FOUND" });
    }
    return node;
  },
};

export const nodesService = env.useMockApi ? mockNodesService : realNodesService;
