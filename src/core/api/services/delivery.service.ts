
import { httpClient } from "@/core/api/client";
import { ENDPOINTS } from "@/core/api/endpoints";
// import { ApiError } from "@/core/api/errors";
// import { mockDelay, generateId } from "@/core/mocks/mock-utils";
// import { MOCK_DELIVERIES } from "@/core/mocks/mock-deliveries";
// import { MOCK_NODES } from "@/core/mocks/mock-nodes";
import {
  toApiParcelSize,
  type BookOrderPayload,
  type CalculateFarePayload,
  type CreateDeliveryDraft,
  type Delivery,
  type DeliveryQuote,
  type PaymentMethod,
} from "@/core/types";

/**
 * Delivery service — the central business-logic surface for the User
 * role. Covers the full lifecycle: New Delivery → Select Node +
 * Destination Address → Method → Checkout (real server-side fare) →
 * Track.
 *
 * IMPORTANT — payment collection gap: the real API only accepts an
 * optional `paymentReference` string on orders/book (presumably from
 * a payment provider's client SDK — Paystack/Flutterwave/etc — plus a
 * backend webhook at /payments/webhook/:provider to confirm it
 * server-side). No such payment SDK is integrated yet. Until it is,
 * `pay()` below just re-confirms the already-booked order; wire a
 * real payment collection step into CheckoutScreen before going live
 * with real money.
 */

// ── Real-shaped request builder (used by both mock and real quote calc) ──

function buildFarePayload(draft: Pick<CreateDeliveryDraft, "originNodeId" | "destinationAddress" | "parcel">): CalculateFarePayload {
  return {
    originNodeId: draft.originNodeId,
    destinationAddress: draft.destinationAddress,
    parcelSize: toApiParcelSize(draft.parcel.size),
  };
}

/** Local fallback pricing — used only by the mock service (no server to ask). */
// function mockCalculateQuote(draft: Pick<CreateDeliveryDraft, "method" | "parcel">): DeliveryQuote {
//   const sizeFare: Record<string, number> = { small: 1800, medium: 2500, large: 3500, xl: 5000 };
//   const baseFare = sizeFare[draft.parcel.size] ?? 2500;
//   const expressSurcharge = draft.method === "express" ? 1000 : 0;
//   const insurance = 200;
//   return { baseFare, expressSurcharge, insurance, total: baseFare + expressSurcharge + insurance, currency: "NGN" };
// }

/** Maps the real calculate-fare response into our DeliveryQuote shape — adjust if the real field names differ. */
function mapFareResponse(raw: unknown, method: CreateDeliveryDraft["method"]): DeliveryQuote {
  const data = raw as {
    baseFare?: number;
    base_fare?: number;
    expressSurcharge?: number;
    insurance?: number;
    total?: number;
    totalFare?: number;
  };
  const baseFare = data.baseFare ?? data.base_fare ?? 0;
  const expressSurcharge = data.expressSurcharge ?? (method === "express" ? 1000 : 0);
  const insurance = data.insurance ?? 0;
  const total = data.total ?? data.totalFare ?? baseFare + expressSurcharge + insurance;
  return { baseFare, expressSurcharge, insurance, total, currency: "NGN" };
}

// ── In-memory mock store (persists for the session only) ───────

// let mockDeliveryStore: Delivery[] = [...MOCK_DELIVERIES];

// const mockDeliveryService = {
//   async list(): Promise<Delivery[]> {
//     await mockDelay();
//     return [...mockDeliveryStore].sort(
//       (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
//     );
//   },

//   async getById(id: string): Promise<Delivery> {
//     await mockDelay(300);
//     const delivery = mockDeliveryStore.find((d) => d.id === id);
//     if (!delivery) {
//       throw new ApiError({ message: "Delivery not found.", status: 404, code: "NOT_FOUND" });
//     }
//     return delivery;
//   },

//   async calculateFare(draft: Pick<CreateDeliveryDraft, "method" | "parcel" | "originNodeId" | "destinationAddress">): Promise<DeliveryQuote> {
//     await mockDelay(400);
//     return mockCalculateQuote(draft);
//   },

//   async create(draft: CreateDeliveryDraft): Promise<Delivery> {
//     await mockDelay();

//     const originNode = MOCK_NODES.find((n) => n.id === draft.originNodeId);
//     if (!originNode) {
//       throw new ApiError({ message: "Please select a pickup node.", status: 400, code: "VALIDATION_ERROR" });
//     }

//     const quote = mockCalculateQuote(draft);
//     const id = generateId("del");
//     const trackingCode = `LCM-2026-${Math.floor(1000 + Math.random() * 9000)}`;

//     const delivery: Delivery = {
//       id,
//       trackingCode,
//       status: "draft",
//       method: draft.method,
//       receiver: draft.receiver,
//       parcel: draft.parcel,
//       originNode,
//       destinationAddress: draft.destinationAddress,
//       route: { originLabel: originNode.area, destinationLabel: draft.destinationAddress },
//       quote,
//       trackingHistory: [],
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//     };

//     mockDeliveryStore = [delivery, ...mockDeliveryStore];
//     return delivery;
//   },

//   async pay(id: string, paymentMethod: PaymentMethod): Promise<Delivery> {
//     await mockDelay(900);
//     const index = mockDeliveryStore.findIndex((d) => d.id === id);
//     if (index === -1) {
//       throw new ApiError({ message: "Delivery not found.", status: 404, code: "NOT_FOUND" });
//     }
//     const updated: Delivery = {
//       ...mockDeliveryStore[index],
//       status: "package_dropped",
//       paymentMethod,
//       collectionQrCode: mockDeliveryStore[index].trackingCode,
//       qrNonce: generateId("nonce"),
//       trackingHistory: [
//         {
//           id: generateId("evt"),
//           status: "package_dropped",
//           label: "Package Dropped",
//           description: "Sender dropped off the package at the origin hub.",
//           location: mockDeliveryStore[index].route.originLabel,
//           timestamp: new Date().toISOString(),
//         },
//       ],
//       updatedAt: new Date().toISOString(),
//     };
//     mockDeliveryStore[index] = updated;
//     return updated;
//   },
// };

// ── Real implementation ─────────────────────────────────────────

const realDeliveryService = {
  async list(): Promise<Delivery[]> {
    return httpClient.get<Delivery[]>(ENDPOINTS.orders.list);
  },

  async getById(id: string): Promise<Delivery> {
    return httpClient.get<Delivery>(ENDPOINTS.orders.detail(id));
  },

  async calculateFare(
    draft: Pick<CreateDeliveryDraft, "method" | "parcel" | "originNodeId" | "destinationAddress">
  ): Promise<DeliveryQuote> {
    const payload = buildFarePayload(draft);
    const raw = await httpClient.post(ENDPOINTS.orders.calculateFare, payload);
    return mapFareResponse(raw, draft.method);
  },

  async create(draft: CreateDeliveryDraft): Promise<Delivery> {
    // Real flow: get the fare first (server is the source of truth for
    // price), then book with that exact fee.
    const quote = await this.calculateFare(draft);

    const payload: BookOrderPayload = {
      originNodeId: draft.originNodeId,
      destinationAddress: draft.destinationAddress,
      receiverName: draft.receiver.fullName,
      receiverPhone: draft.receiver.phone,
      parcelSize: toApiParcelSize(draft.parcel.size),
      deliveryFee: quote.total,
      // paymentReference: — set this once a real payment SDK (Paystack/
      // Flutterwave) has collected payment client-side; see the gap
      // noted in this file's top comment.
    };

    return httpClient.post<Delivery>(ENDPOINTS.orders.book, payload);
  },

  async pay(id: string, paymentMethod: PaymentMethod): Promise<Delivery> {
    void paymentMethod; // real API has no separate "confirm payment" step yet — see comment below.
    // No dedicated "confirm payment" endpoint exists in the real API —
    // payment is expected to be collected client-side (payment SDK)
    // BEFORE calling orders/book with a paymentReference. Since that
    // integration isn't wired yet, this just re-fetches the order,
    // assuming it was already booked successfully by create().
    return this.getById(id);
  },
};

export const deliveryService = realDeliveryService;

/** @deprecated pure client-side math — use `deliveryService.calculateFare()` (now async, hits the real server) instead. Kept only so old imports don't hard-crash; always returns the mock estimate. */
// export function calculateQuote(draft: Pick<CreateDeliveryDraft, "method" | "parcel">): DeliveryQuote {
//   return mockCalculateQuote(draft);
// }
