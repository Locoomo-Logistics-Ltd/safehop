"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Input } from "@/components/ui";
import { CheckCircleIcon, MapPinIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { formatRelativeDateTime } from "@/lib/format";
import { getTodayHoursText, getWeekRows } from "@/lib/opening-hours";
import type { PublicTracking, PublicTrackingNode, PublicTrackingStatus } from "@/core/types";
import { usePublicTracking } from "@/modules/tracking/hooks/use-public-tracking";

/** The forward journey the public statuses map onto (docs/LOGISTICS_API.md §7, "Progress step"). */
const FORWARD_STEPS = ["Drop-off", "At origin", "On the way", "At destination", "Collected"] as const;

const PROGRESS_STEP: Partial<Record<PublicTrackingStatus, number>> = {
  awaiting_drop_off: 1,
  at_origin_station: 2,
  on_the_way: 3,
  arrived_at_destination: 4,
  ready_for_collection: 4,
  collected: 5,
};

const RETURN_STATUSES: PublicTrackingStatus[] = ["returning_to_sender", "returned_to_sender", "return_completed"];

interface PublicTrackingScreenProps {
  /** Fixed when the page URL carries the code (`/track/[trackingCode]`); the lookup page leaves it out. */
  trackingCode?: string;
  /** The `t` access token off the tracking link. */
  token?: string;
}

/**
 * Public tracking — no account, no session. Opened from the tracking link
 * (`?t=` token) or with a tracking code plus the last four digits of the
 * receiver's phone. The page deliberately carries no names, phones, codes
 * or prices, so everything is rendered verbatim from the API: status
 * label, next step and timeline labels.
 */
export function PublicTrackingScreen({ trackingCode: fixedCode, token }: PublicTrackingScreenProps) {
  const router = useRouter();
  const [codeInput, setCodeInput] = useState(fixedCode ?? "");
  const [digitsInput, setDigitsInput] = useState("");
  // Submitted values: the query only runs once the visitor presses Track,
  // never on every keystroke (10 requests/min per IP).
  const [submitted, setSubmitted] = useState<{ code: string; phoneLast4: string } | null>(null);

  const activeCode = fixedCode ?? submitted?.code ?? "";
  const credential = token
    ? { token }
    : submitted?.phoneLast4
      ? { phoneLast4: submitted.phoneLast4 }
      : null;

  const { tracking, isLoading, notFound, rateLimited, hasError, refetch } = usePublicTracking(activeCode, credential);

  // A 4-digit code is only 10,000 combinations. Cool the form down after
  // 5 lookups in a row — this slows casual guessing only; the real defence is
  // the API's rate limit.
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!lockedUntil) return;
    const timer = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= lockedUntil) {
        setLockedUntil(0);
        setAttempts(0);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lockedUntil]);
  const secondsLocked = lockedUntil ? Math.max(0, Math.ceil((lockedUntil - now) / 1000)) : 0;

  const canSubmit = codeInput.trim().length >= 4 && /^\d{4}$/.test(digitsInput) && secondsLocked === 0;
  const showForm = !token && !tracking;

  return (
    <div className="min-h-screen bg-bg-canvas">
      <header className="px-4 md:px-6 h-14 flex items-center justify-between max-w-[560px] mx-auto">
        <Link href="/" className="font-display text-[18px] font-bold text-brand-blue">
          Locoomo
        </Link>
        <Link href="/login" className="text-[13px] font-semibold text-text-secondary">
          Sign in
        </Link>
      </header>

      <main className="px-4 md:px-6 pt-2 pb-12 max-w-[560px] mx-auto flex flex-col gap-4">
        <div>
          <h1 className="font-display text-[22px] font-bold text-text-primary">Track a parcel</h1>
          {!tracking && (
            <p className="text-[14px] text-text-secondary mt-1">
              {token
                ? "Looking up your parcel…"
                : "Enter the tracking code written on the parcel and the last 4 digits of the receiver's phone."}
            </p>
          )}
        </div>

        {showForm && (
          <form
            className="flex flex-col gap-3.5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!canSubmit) return;
              const tries = attempts + 1;
              setAttempts(tries);
              if (tries >= 5) {
                const t = Date.now();
                setNow(t);
                setLockedUntil(t + 60_000);
              }
              if (fixedCode) {
                setSubmitted({ code: fixedCode, phoneLast4: digitsInput });
              } else {
                setSubmitted({ code: codeInput.trim(), phoneLast4: digitsInput });
              }
            }}
          >
            {!fixedCode && (
              <Input
                label="Tracking code"
                placeholder="LCM-7K3M-Q9TD"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                className="font-mono tracking-wide"
              />
            )}
            {fixedCode && (
              <p className="font-mono text-[18px] font-bold text-text-primary tracking-tight">{fixedCode}</p>
            )}
            <Input
              label="Last 4 digits of the receiver's phone"
              placeholder="5678"
              inputMode="numeric"
              maxLength={4}
              value={digitsInput}
              onChange={(e) => setDigitsInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
            />
            <Button type="submit" size="lg" fullWidth disabled={!canSubmit} isLoading={isLoading && !!credential}>
              {secondsLocked > 0 ? `Too many tries — wait ${secondsLocked}s` : "Track parcel"}
            </Button>
          </form>
        )}

        {isLoading && credential && !showForm && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 rounded-full border-2 border-border-default border-t-brand-blue animate-spin" />
          </div>
        )}

        {(notFound || rateLimited || (hasError && !tracking)) && (
          <Card padding="md" className="text-center" role="alert">
            <p className="text-[14px] font-semibold text-text-primary mb-1">
              {rateLimited ? "Too many tries" : "We couldn't find that parcel"}
            </p>
            <p className="text-[12.5px] text-text-secondary leading-[1.6]">
              {rateLimited
                ? "Please wait a minute and try again."
                : "Check the code and the last 4 digits."}
            </p>
            {token && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => (fixedCode ? router.replace(`/track/${encodeURIComponent(fixedCode)}`) : refetch())}
              >
                {fixedCode ? "Use phone digits instead" : "Try again"}
              </Button>
            )}
          </Card>
        )}

        {tracking && <TrackingResult tracking={tracking} />}
      </main>
    </div>
  );
}

function TrackingResult({ tracking }: { tracking: PublicTracking }) {
  const isReturn = RETURN_STATUSES.includes(tracking.status);
  const step = PROGRESS_STEP[tracking.status] ?? 0;
  const timeline = [...tracking.timeline].reverse();

  return (
    <>
      <Card padding="md" className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Tracking code</p>
            <p className="font-mono text-[18px] font-bold text-text-primary tracking-tight break-all">
              {tracking.trackingCode}
            </p>
          </div>
          <span
            className={cn(
              "text-[12px] font-semibold px-3 py-1 rounded-full shrink-0",
              tracking.isFinal && !isReturn
                ? "bg-status-success-bg text-status-success"
                : isReturn
                  ? "bg-status-warning-bg text-status-warning"
                  : "bg-status-info-bg text-brand-blue"
            )}
          >
            {tracking.statusLabel}
          </span>
        </div>

        <p className="text-[13.5px] text-text-secondary leading-[1.6]">{tracking.nextStep}</p>

        {(tracking.courierLabel || tracking.etaMinutes !== null) && !tracking.isFinal && (
          <p className="text-[12.5px] text-text-muted">
            {tracking.courierLabel ? `Carried by ${tracking.courierLabel}` : ""}
            {tracking.courierLabel && tracking.etaMinutes !== null ? " · " : ""}
            {tracking.etaMinutes !== null ? `about ${tracking.etaMinutes} min away` : ""}
          </p>
        )}
      </Card>

      {!isReturn && (
        <Card padding="md">
          <ol className="flex items-start" aria-label="Progress">
            {FORWARD_STEPS.map((label, i) => {
              const n = i + 1;
              const done = n < step || (n === step && tracking.isFinal);
              const current = n === step && !tracking.isFinal;
              return (
                <li key={label} className="flex-1 flex flex-col items-center gap-1.5 relative">
                  {i > 0 && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute top-[13px] right-1/2 w-full h-[3px] -z-0",
                        n <= step ? "bg-status-success" : "bg-border-default"
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      "relative z-10 w-7 h-7 rounded-full flex items-center justify-center border-2 text-[11px] font-bold",
                      done
                        ? "bg-status-success border-status-success text-white"
                        : current
                          ? "bg-brand-blue border-brand-blue text-white"
                          : "bg-bg-card border-border-default text-text-muted"
                    )}
                    aria-current={current ? "step" : undefined}
                  >
                    {done ? <CheckCircleIcon size={14} /> : n}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-medium text-center leading-tight",
                      n <= step ? "text-text-primary" : "text-text-muted"
                    )}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <StationCard
          title={isReturn ? "Collect from (sender)" : "From"}
          node={tracking.origin}
          emphasize={isReturn}
        />
        <StationCard title={isReturn ? "Was going to" : "Collect at"} node={tracking.destination} emphasize={!isReturn} />
      </div>

      <Card padding="md">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-4">History</p>
        <ol className="flex flex-col">
          {timeline.map((entry, i) => (
            <li key={`${entry.at}-${i}`} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn("w-2.5 h-2.5 rounded-full mt-1.5 shrink-0", i === 0 ? "bg-brand-blue" : "bg-border-strong")}
                  aria-hidden="true"
                />
                {i < timeline.length - 1 && <span className="w-px flex-1 bg-border-default my-1" aria-hidden="true" />}
              </div>
              <div className="pb-4 min-w-0">
                <p className={cn("text-[13px] leading-snug", i === 0 ? "font-semibold text-text-primary" : "text-text-secondary")}>
                  {entry.label}
                </p>
                <p className="text-[11px] text-text-muted mt-0.5">{formatRelativeDateTime(entry.at)}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <p className="text-[11.5px] text-text-muted text-center">
        Updated {formatRelativeDateTime(tracking.updatedAt)}
        {!tracking.isFinal && " · refreshes automatically"}
      </p>
    </>
  );
}

function StationCard({
  title,
  node,
  emphasize,
}: {
  title: string;
  node: PublicTrackingNode;
  emphasize?: boolean;
}) {
  const [showHours, setShowHours] = useState(false);
  const today = getTodayHoursText(node.openingHours);

  return (
    <Card padding="md" className={cn(emphasize && "border border-brand-blue")}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2">{title}</p>
      <div className="flex items-start gap-2.5">
        <MapPinIcon size={15} className="text-brand-blue shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-text-primary">{node.name}</p>
          <p className="text-[12.5px] text-text-secondary leading-snug">
            {[node.address, node.city, node.state].filter(Boolean).join(", ")}
          </p>
          {today && <p className="text-[12px] text-text-muted mt-1">{today}</p>}
        </div>
      </div>

      {node.openingHours && (
        <>
          <button
            type="button"
            onClick={() => setShowHours((v) => !v)}
            aria-expanded={showHours}
            className="mt-2 text-[12px] font-semibold text-brand-blue"
          >
            {showHours ? "Hide opening hours" : "Opening hours"}
          </button>
          {showHours && (
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[12px]">
              {getWeekRows(node.openingHours).map((row) => (
                <div key={row.key} className="contents">
                  <dt className="text-text-muted">{row.day}</dt>
                  <dd className="text-text-primary text-right">{row.text}</dd>
                </div>
              ))}
            </dl>
          )}
        </>
      )}
    </Card>
  );
}
