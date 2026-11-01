"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TopBar } from "@/components/layout";
import { Button, Card, Input } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { CheckCircleIcon, QrCodeIcon } from "@/components/icons";
import { getFriendlyError } from "@/core/api/errors";
import { ROUTES } from "@/core/config/constants";
import { useCounter } from "@/modules/node/hooks/use-counter";
import { CounterOrderCard } from "./CounterOrderCard";
import { CounterActionPanel } from "./CounterActionPanel";
import type { HandoffOrderSummary } from "@/core/types";

/**
 * The counter. Staff type (or scan) the code off the parcel and the
 * screen shows the one thing to do next — drop-off, hand to a rider or
 * courier, check in, hand to the receiver, or a return — straight from
 * the order's `nextAction` (docs/LOGISTICS_API.md §5). It replaces the
 * separate drop-off preview, hand-off detail and collect screens, which
 * each re-derived "what is this parcel waiting for" from `status`.
 *
 * Typing is the primary path: the sender hand-writes the code on the
 * parcel, so there's nothing to scan. The camera stays a secondary
 * option for codes that arrive another way.
 */
export function NodeCounterScreen() {
  const searchParams = useSearchParams();
  const urlCode = searchParams.get("code") ?? "";

  // Keyed by the code in the URL (set by a queue row, the scanner or the
  // form below): a different parcel remounts the view, so the field, the
  // pending mutations and any courier wait all start clean.
  return <CounterView key={urlCode} urlCode={urlCode} />;
}

function CounterView({ urlCode }: { urlCode: string }) {
  const router = useRouter();
  const [input, setInput] = useState(urlCode);
  const inputRef = useRef<HTMLInputElement>(null);

  const counter = useCounter(urlCode);
  const { order, isLoading, notFound, lookupError, lastTransition } = counter;

  const lookup = () => {
    const code = input.trim();
    if (code.length < 4) return;
    router.replace(ROUTES.nodeCounterOrder(code));
  };

  const scanNext = () => {
    router.replace(ROUTES.nodeCounter);
  };

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="Counter" showBack />

      <div className="px-4 md:px-6 pt-2 md:pt-6 pb-24 max-w-[560px] mx-auto flex flex-col gap-4">
        <div className="hidden md:block">
          <h1 className="font-display text-[22px] font-bold text-text-primary">Counter</h1>
          <p className="text-[14px] text-text-secondary mt-1">
            Type the code written on the parcel to see what to do with it.
          </p>
        </div>

        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            lookup();
          }}
        >
          <Input
            ref={inputRef}
            label="Parcel code"
            placeholder="LCM-7K3M-Q9TD"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            autoFocus={!urlCode}
            className="font-mono tracking-wide"
            hint="Capital letters, spaces or a missing “LCM-” are fine."
          />
          <div className="flex gap-2.5">
            <Button type="submit" size="lg" className="flex-1" disabled={input.trim().length < 4} isLoading={isLoading}>
              Find parcel
            </Button>
            <Link href={ROUTES.nodeScan} aria-label="Scan with camera">
              <Button type="button" size="lg" variant="outline" leftIcon={<QrCodeIcon size={18} />}>
                Scan
              </Button>
            </Link>
          </div>
        </form>

        {notFound && (
          <Card padding="md" className="text-center">
            <p className="text-[14px] font-semibold text-text-primary mb-1">No parcel with that code at this station</p>
            <p className="text-[12.5px] text-text-secondary leading-[1.6]">
              Check the code on the parcel. A parcel that belongs to another station won&apos;t show here either.
            </p>
          </Card>
        )}

        {lookupError && <ErrorAlert {...getFriendlyError(lookupError)} />}

        {lastTransition && <TransitionResult result={lastTransition} onNext={scanNext} />}

        {order && (
          <>
            <CounterOrderCard order={order} />
            {/* After an action, hold the panel until the order has been
                re-read, so a stale button for the step just finished never shows. */}
            {!counter.isRefreshing && (!lastTransition || (order.nextAction && order.nextAction !== "none")) && (
              <CounterActionPanel order={order} counter={counter} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** What just happened, in terms of what staff do with their hands next. */
function TransitionResult({ result, onNext }: { result: HandoffOrderSummary; onNext: () => void }) {
  const message = (() => {
    switch (result.status) {
      case "parcel_received_at_origin":
        return result.shelfNumber != null ? (
          <>
            Put it on shelf <span className="font-bold">{result.shelfNumber}</span>. A courier is being booked.
          </>
        ) : (
          "Parcel received. A courier is being booked."
        );
      case "in_transit":
        return "Handed over. The parcel is on its way.";
      case "arrived_at_destination":
        return "Arrival confirmed. Check the parcel in next.";
      case "ready_for_collection":
        return result.shelfNumber != null ? (
          <>
            Checked in — put it on shelf <span className="font-bold">{result.shelfNumber}</span>. The receiver has been
            emailed a collection code.
          </>
        ) : (
          "Checked in. The receiver has been emailed a collection code."
        );
      case "completed":
        return "Handed to the receiver. This order is complete.";
      case "ready_for_sender_collection":
        return result.shelfNumber != null ? (
          <>
            Checked in — put it on shelf <span className="font-bold">{result.shelfNumber}</span>. The sender has been
            emailed a collection code.
          </>
        ) : (
          "Checked in. The sender has been emailed a collection code."
        );
      case "return_completed":
        return "Handed back to the sender. This order is closed.";
      default:
        return "Done.";
    }
  })();

  return (
    <Card padding="md" className="border border-status-success bg-status-success-bg">
      <div className="flex items-start gap-3">
        <CheckCircleIcon size={22} className="text-status-success shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] text-text-primary leading-[1.5]" role="status">
            {message}
          </p>
          <Button size="sm" variant="outline" className="mt-3" onClick={onNext}>
            Next parcel
          </Button>
        </div>
      </div>
    </Card>
  );
}
