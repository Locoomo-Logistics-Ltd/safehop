"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { nodeService, nodesService } from "@/core/api/services";
import { QUERY_KEYS, STORAGE_KEYS } from "@/core/config/constants";
import { useNodeProfile } from "./use-node-profile";
import type { DispatchParcelPayload } from "@/core/types";

/**
 * `POST /node-operators/nodes/:nodeId/dispatch` — real, confirmed
 * route per docs/API.md (2026-09-03). The operator's (or their staff's)
 * own outbound parcel: same fee calculation, same ~15-minute capacity
 * reservation, and the same Paystack hosted checkout a Consumer
 * booking gets, just with the origin fixed to the station you're
 * standing in rather than free-typed.
 *
 * **Destination list.** The picker is fed by `GET /nodes/nearby`
 * centred on *the origin station's own coordinates*, not the device's
 * — the operator is choosing where a parcel goes from their counter,
 * so distance from that counter is the useful sort, and it means the
 * screen needs no geolocation permission at all. Two consequences
 * worth knowing:
 *
 *   - The origin station itself is filtered out client-side; the API
 *     doesn't reject a same-Node order, but it isn't a delivery.
 *   - `/nodes/nearby` only returns publicly-visible Nodes to a
 *     non-Admin, while dispatch *accepts* any active Node regardless
 *     of visibility (docs/API.md explicitly allows sending to a
 *     partner's private station). So a private destination is
 *     reachable by the API but not discoverable in this picker —
 *     flagged for backend, there's no endpoint that would list it.
 *
 * **After payment.** `GET /payments/intents/:id` is Consumer-only, so
 * unlike Checkout this flow cannot poll its own intent — see
 * `PaymentCallbackScreen`'s dispatch branch for what happens instead.
 * The dispatch marker written below is what tells that screen which
 * flow it's completing.
 */
export function useDispatchParcel() {
  const { node } = useNodeProfile();

  const destinationsQuery = useQuery({
    queryKey: [...QUERY_KEYS.nodes, "dispatch-destinations", node?.id],
    queryFn: () =>
      nodesService.listNearby({ lat: node!.latitude, lng: node!.longitude }),
    enabled: !!node,
  });

  const destinations = (destinationsQuery.data ?? []).filter(
    (candidate) => candidate.id !== node?.id
  );

  const mutation = useMutation({
    mutationFn: (payload: DispatchParcelPayload) =>
      nodeService.dispatchParcel(node!.id, payload),
  });

  const redirectToPaystack = () => {
    const intent = mutation.data;
    if (!intent?.authorizationUrl) return;
    // Same stash as Checkout — Paystack's redirect query string shape
    // isn't documented, so the callback screen can't recover the intent
    // id from it. The extra dispatch marker is what stops that screen
    // polling a Consumer-only endpoint on an operator's session.
    sessionStorage.setItem(STORAGE_KEYS.pendingPaymentIntentId, intent.id);
    sessionStorage.setItem(STORAGE_KEYS.pendingDispatch, "1");
    window.location.href = intent.authorizationUrl;
  };

  return {
    originNode: node,
    destinations,
    isLoadingDestinations: destinationsQuery.isLoading,
    destinationsError: destinationsQuery.error,

    dispatch: mutation.mutate,
    intent: mutation.data,
    isDispatching: mutation.isPending,
    dispatchError: mutation.error,
    redirectToPaystack,
  };
}
