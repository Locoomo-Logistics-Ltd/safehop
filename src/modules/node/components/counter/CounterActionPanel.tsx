"use client";

import { safeTelHref } from "@/lib/safe-url";
import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { CheckCircleIcon } from "@/components/icons";
import { getFriendlyError } from "@/core/api/errors";
import { NEXT_ACTION_COPY, COURIER_ACTIONS, groupCode } from "@/modules/node/lib/next-action";
import type { useCounter } from "@/modules/node/hooks/use-counter";
import type { NodeOrderSummary } from "@/core/types";
import { CodeInput } from "./CodeInput";

type Counter = ReturnType<typeof useCounter>;

interface CounterActionPanelProps {
  order: NodeOrderSummary;
  counter: Counter;
}

/**
 * Exactly one primary action for the parcel, chosen by `nextAction`
 * (docs/LOGISTICS_API.md §5.1). Everything that needs a code — a rider's,
 * a courier's, a receiver's or a sender's — is its own small section so a
 * state never shows a control it can't use.
 */
export function CounterActionPanel({ order, counter }: CounterActionPanelProps) {
  const action = order.nextAction ?? "none";
  const copy = NEXT_ACTION_COPY[action];

  return (
    <Card padding="md" className="flex flex-col gap-4">
      <div>
        <p className="text-[15px] font-semibold text-text-primary">{copy.title}</p>
        <p className="text-[13px] text-text-secondary mt-1 leading-[1.6]">{copy.hint}</p>
      </div>

      {action === "confirm_drop_off" && (
        <Button
          size="lg"
          fullWidth
          isLoading={counter.dropOff.isPending}
          onClick={() => counter.dropOff.mutate(order.id)}
        >
          Confirm drop-off
        </Button>
      )}

      {action === "intake" && (
        <Button
          size="lg"
          fullWidth
          isLoading={counter.intake.isPending}
          onClick={() => counter.intake.mutate(order.id)}
        >
          Check parcel in
        </Button>
      )}

      {action === "return_intake" && (
        <Button
          size="lg"
          fullWidth
          isLoading={counter.returnIntake.isPending}
          onClick={() => counter.returnIntake.mutate(order.id)}
        >
          Check returned parcel in
        </Button>
      )}

      {(action === "hand_to_rider" || action === "receive_from_rider") && (
        <RiderCodeForm order={order} counter={counter} type={action === "hand_to_rider" ? "rider_pickup" : "rider_arrival"} />
      )}

      {COURIER_ACTIONS.includes(action) && <CourierCode order={order} counter={counter} />}

      {(action === "hand_to_receiver" || action === "hand_to_sender") && (
        <HandOverForm order={order} counter={counter} toSender={action === "hand_to_sender"} />
      )}

      {action === "await_courier" && order.shelfNumber != null && (
        <p className="text-[13px] text-text-secondary">
          Keep it on shelf <span className="font-bold text-text-primary">{order.shelfNumber}</span>. This page checks
          again on its own.
        </p>
      )}

      {counter.actionError && <ErrorAlert {...getFriendlyError(counter.actionError)} />}
    </Card>
  );
}

function RiderCodeForm({
  order,
  counter,
  type,
}: {
  order: NodeOrderSummary;
  counter: Counter;
  type: "rider_pickup" | "rider_arrival";
}) {
  const [code, setCode] = useState("");
  const submit = () => {
    if (code.length === 6) counter.riderHandoff.mutate({ orderId: order.id, type, code });
  };

  return (
    <div className="flex flex-col gap-3">
      <CodeInput label="Rider's 6-digit code" value={code} onChange={setCode} onSubmit={submit} autoFocus />
      {counter.shouldRequestFreshCode && (
        <p className="text-[12.5px] text-status-warning" role="status">
          That code is probably locked. Ask the rider to generate a new one.
        </p>
      )}
      <Button
        size="lg"
        fullWidth
        disabled={code.length !== 6}
        isLoading={counter.riderHandoff.isPending}
        onClick={submit}
      >
        {type === "rider_pickup" ? "Confirm pickup" : "Confirm arrival"}
      </Button>
    </div>
  );
}

function CourierCode({ order, counter }: { order: NodeOrderSummary; counter: Counter }) {
  const handover = counter.courierHandover.data;
  const kindLine =
    handover?.kind === "pickup"
      ? `Give the parcel${handover.shelfNumber != null ? ` on shelf ${handover.shelfNumber}` : ""} to ${handover.courier?.name ?? "the courier"} (${handover.providerLabel}).`
      : handover?.kind === "return_delivery"
        ? `${handover.courier?.name ?? "The courier"} is returning ${handover.trackingCode}.`
        : handover
          ? `${handover.courier?.name ?? "The courier"} is delivering ${handover.trackingCode}.`
          : "";

  if (!handover) {
    return (
      <Button
        size="lg"
        fullWidth
        isLoading={counter.courierHandover.isPending}
        onClick={() => counter.courierHandover.mutate(order.id)}
      >
        Show handover code
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] text-text-secondary leading-[1.6]">{kindLine}</p>
      <div className="rounded-[14px] border-2 border-dashed border-brand-blue bg-status-info-bg px-4 py-5 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-1">Read them this code</p>
        <p className="font-mono text-[40px] leading-none font-bold tracking-[0.12em] text-brand-blue">
          {groupCode(handover.code)}
        </p>
      </div>
      {handover.courier?.phone && (
        <a href={safeTelHref(handover.courier.phone)} className="text-[13px] font-semibold text-brand-blue">
          Call {handover.courier.name ?? "courier"}: {handover.courier.phone}
        </a>
      )}

      {counter.courierWaitTimedOut ? (
        <div className="flex flex-col gap-2">
          <p className="text-[12.5px] text-text-secondary">
            Still waiting on the courier. Check again once they&apos;ve entered the code.
          </p>
          <Button variant="outline" fullWidth onClick={() => counter.refetch()}>
            Refresh
          </Button>
        </div>
      ) : (
        <p className="text-[12.5px] text-text-muted flex items-center gap-2" role="status">
          <span className="w-3 h-3 rounded-full border-2 border-border-default border-t-brand-blue animate-spin" />
          Waiting for the courier to enter it…
        </p>
      )}
    </div>
  );
}

function HandOverForm({
  order,
  counter,
  toSender,
}: {
  order: NodeOrderSummary;
  counter: Counter;
  toSender: boolean;
}) {
  const [code, setCode] = useState("");
  // No default: `identityConfirmed` is an audit record, and pre-selecting
  // "yes" would quietly falsify it.
  const [identityConfirmed, setIdentityConfirmed] = useState<boolean | null>(null);
  const who = toSender ? "sender" : "receiver";
  const canSubmit = code.length === 6 && identityConfirmed !== null;

  const submit = () => {
    if (!canSubmit) return;
    counter.handOver.mutate({ orderId: order.id, toSender, code, identityConfirmed: identityConfirmed! });
  };

  return (
    <div className="flex flex-col gap-4">
      <CodeInput label={`${toSender ? "Sender" : "Receiver"}'s 6-digit code`} value={code} onChange={setCode} onSubmit={submit} autoFocus />

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[13px] font-medium text-text-secondary mb-1">
          Did you check the {who}&apos;s name and ID?
        </legend>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { value: true, label: "Yes, checked" },
            { value: false, label: "No — someone collecting for them" },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              aria-pressed={identityConfirmed === opt.value}
              onClick={() => setIdentityConfirmed(opt.value)}
              className={`rounded-[12px] border-2 px-3 py-3 text-[13px] font-medium text-left transition-colors ${
                identityConfirmed === opt.value
                  ? "border-brand-blue bg-status-info-bg text-text-primary"
                  : "border-border-default bg-bg-card text-text-secondary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      <Button size="lg" fullWidth disabled={!canSubmit} isLoading={counter.handOver.isPending} onClick={submit}>
        {toSender ? "Hand back to sender" : "Hand over to receiver"}
      </Button>

      {counter.shouldRequestFreshCode && (
        <p className="text-[12.5px] text-status-warning" role="status">
          That code is probably locked. Resend a fresh one by email.
        </p>
      )}

      <div className="border-t border-border-default pt-3">
        <Button
          variant="ghost"
          size="sm"
          isLoading={counter.resend.isPending}
          onClick={() => counter.resend.mutate(order.id)}
        >
          Resend code to {who}
        </Button>
        {counter.resend.isSuccess && (
          <p className="text-[12px] text-status-success mt-1 flex items-center gap-1.5" role="status">
            <CheckCircleIcon size={13} />
            A new code was emailed. It replaces the old one.
          </p>
        )}
      </div>
    </div>
  );
}
