"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { nodeService } from "@/core/api/services";
import { QUERY_KEYS } from "@/core/config/constants";
import { isApiError } from "@/core/api/errors";
import { COURIER_ACTIONS, WAITING_ACTIONS } from "@/modules/node/lib/next-action";
import type { HandoffOrderSummary, HandoffType, NextAction } from "@/core/types";

/** Poll cadence while a courier is expected to enter the handover code (docs/LOGISTICS_API.md §10: 3–5 s, stop after ~10 min). */
const COURIER_POLL_MS = 4_000;
const COURIER_POLL_WINDOW_MS = 10 * 60_000;
/** Slower re-check while waiting on a courier booking or arrival. */
const WAITING_POLL_MS = 15_000;
/** Per docs/API.md: 5 wrong guesses lock a code out permanently. */
const MAX_CODE_ATTEMPTS = 5;

/** A courier handover in flight: the code was shown for this `action`, at this time. */
interface CourierWait {
  action: NextAction;
  startedAt: number;
  timedOut: boolean;
}

/**
 * The counter loop: type the code off the parcel → read `nextAction` →
 * one primary button → refresh. `GET /handoffs/orders/by-tracking-code/:code`
 * forgives case, spaces, a missing `LCM-` and O/0, I/1 mix-ups, so the
 * query key is the raw input trimmed.
 *
 * A `404` is an answer ("no parcel with that code at this station" —
 * also what another Node's parcel looks like), not a failure.
 *
 * One hook instance per parcel: the screen remounts it (via `key`) when
 * the code changes, so a new parcel always starts with clean mutation and
 * wait state.
 */
export function useCounter(code: string) {
  const queryClient = useQueryClient();
  const trimmed = code.trim();

  const [wait, setWait] = useState<CourierWait | null>(null);
  const [lastTransition, setLastTransition] = useState<HandoffOrderSummary | null>(null);
  const [failedCodeAttempts, setFailedCodeAttempts] = useState(0);

  const orderQuery = useQuery({
    queryKey: QUERY_KEYS.nodeHandoffOrder(trimmed),
    queryFn: () => nodeService.lookupOrderByTrackingCode(trimmed),
    enabled: trimmed.length >= 4,
    retry: false,
    refetchInterval: (q) => {
      const next = q.state.data?.nextAction;
      if (!next) return false;
      if (COURIER_ACTIONS.includes(next) && wait?.action === next && !wait.timedOut) return COURIER_POLL_MS;
      if (WAITING_ACTIONS.includes(next)) return WAITING_POLL_MS;
      return false;
    },
  });

  const order = orderQuery.data;
  const notFound = isApiError(orderQuery.error) && orderQuery.error.code === "NOT_FOUND";
  const nextAction = order?.nextAction;

  // The wait only counts while the order is still on the action it was
  // started for — once the courier enters the code and `nextAction`
  // changes, the handover is no longer pending and the code disappears.
  const activeWait = wait && wait.action === nextAction ? wait : null;
  const courierWaitTimedOut = !!activeWait?.timedOut;

  // Stop polling a handover nobody completes (~10 min) and offer Refresh
  // instead of hammering the API forever.
  const waitStartedAt = activeWait?.startedAt;
  useEffect(() => {
    if (!waitStartedAt) return;
    const remaining = COURIER_POLL_WINDOW_MS - (Date.now() - waitStartedAt);
    const timer = setTimeout(
      () => setWait((w) => (w && w.startedAt === waitStartedAt ? { ...w, timedOut: true } : w)),
      Math.max(0, remaining)
    );
    return () => clearTimeout(timer);
  }, [waitStartedAt]);

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nodeQueuesRoot });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nodeMyOrders });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nodeHandoffOrder(trimmed) });
  };

  const onTransition = (result: HandoffOrderSummary) => {
    setLastTransition(result);
    setFailedCodeAttempts(0);
    refreshAll();
  };

  // Another counter or a courier already moved the order: re-read it
  // rather than leaving a button that can only fail again.
  const onActionError = (error: unknown) => {
    if (isApiError(error) && (error.code === "ILLEGAL_ORDER_TRANSITION" || error.code === "NOT_FOUND")) {
      refreshAll();
    }
  };

  const dropOff = useMutation({
    mutationFn: (orderId: string) => nodeService.confirmDropOff(orderId),
    onSuccess: onTransition,
    onError: onActionError,
  });

  const intake = useMutation({
    mutationFn: (orderId: string) => nodeService.confirmIntake(orderId),
    onSuccess: onTransition,
    onError: onActionError,
  });

  const returnIntake = useMutation({
    mutationFn: (orderId: string) => nodeService.confirmReturnIntake(orderId),
    onSuccess: onTransition,
    onError: onActionError,
  });

  const riderHandoff = useMutation({
    mutationFn: ({ orderId, type, code: riderCode }: { orderId: string; type: HandoffType; code: string }) =>
      nodeService.confirmRiderHandoff(orderId, { type, code: riderCode }),
    onSuccess: onTransition,
    onError: (error) => {
      if (isApiError(error) && error.code === "INVALID_HANDOFF_CODE") {
        setFailedCodeAttempts((n) => n + 1);
        return;
      }
      onActionError(error);
    },
  });

  const handOver = useMutation({
    mutationFn: ({
      orderId,
      toSender,
      code: collectCode,
      identityConfirmed,
    }: {
      orderId: string;
      toSender: boolean;
      code: string;
      identityConfirmed: boolean;
    }) =>
      toSender
        ? nodeService.returnCollectParcel(orderId, { code: collectCode, identityConfirmed })
        : nodeService.collectParcel(orderId, { code: collectCode, identityConfirmed }),
    onSuccess: onTransition,
    onError: (error) => {
      if (isApiError(error) && error.code === "INVALID_HANDOFF_CODE") {
        setFailedCodeAttempts((n) => n + 1);
        return;
      }
      onActionError(error);
    },
  });

  const resend = useMutation({
    mutationFn: (orderId: string) => nodeService.resendCollectionCode(orderId),
    onSuccess: () => {
      // A fresh code supersedes the old one, including its lockout.
      setFailedCodeAttempts(0);
      handOver.reset();
    },
  });

  // The courier code is a credential: it lives in this mutation's state
  // only — never in the query cache, storage or logs.
  const courierHandover = useMutation({
    mutationFn: (orderId: string) => nodeService.getCourierHandover(orderId),
    onSuccess: () => {
      if (nextAction) setWait({ action: nextAction, startedAt: Date.now(), timedOut: false });
    },
    onError: (error) => {
      if (isApiError(error) && error.code === "COURIER_HANDOVER_NOT_AVAILABLE") refreshAll();
    },
  });

  const actionError =
    dropOff.error ??
    intake.error ??
    returnIntake.error ??
    riderHandoff.error ??
    handOver.error ??
    courierHandover.error ??
    resend.error ??
    null;

  return {
    order,
    isLoading: orderQuery.isLoading,
    isRefreshing: orderQuery.isFetching && !orderQuery.isLoading,
    notFound,
    lookupError: notFound ? null : orderQuery.error,
    refetch: orderQuery.refetch,

    dropOff,
    intake,
    returnIntake,
    riderHandoff,
    handOver,
    resend,
    courierHandover,
    courierWaitTimedOut,
    isWaitingOnCourier: !!activeWait && !activeWait.timedOut,

    lastTransition,
    actionError,
    failedCodeAttempts,
    shouldRequestFreshCode: failedCodeAttempts >= MAX_CODE_ATTEMPTS,
  };
}
