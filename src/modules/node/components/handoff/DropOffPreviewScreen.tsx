"use client";

import { useParams, useRouter } from "next/navigation";
import { Button, Card, EmptyState } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { TopBar } from "@/components/layout";
import { CheckCircleIcon, PackageIcon, MapPinIcon, SearchIcon } from "@/components/icons";
import { getFriendlyError } from "@/core/api/errors";
import { ROUTES } from "@/core/config/constants";
import { formatDate } from "@/lib/format";
import { useHandoffLookup } from "@/modules/node/hooks/use-handoff-lookup";
import { HandoffStatusPill } from "./HandoffStatusPill";

/**
 * Consumer drop-off at the counter: preview the parcel from its
 * tracking code, then confirm receipt.
 *
 * The preview step exists so the operator can check the parcel in their
 * hand against `parcelDescription` and `parcelSize` *before* taking
 * custody — confirming is what puts the order on the rider job board,
 * and it's much cheaper to catch a mismatch now than after a rider has
 * collected the wrong box.
 */
export function DropOffPreviewScreen() {
  const params = useParams<{ trackingCode: string }>();
  const router = useRouter();

  // The route param arrives percent-encoded (manual entry can contain
  // anything the operator typed), so it has to be decoded before it
  // goes back out as a query to the API.
  const trackingCode = decodeURIComponent(params.trackingCode ?? "");

  const {
    order,
    isLoading,
    notFound,
    lookupError,
    isAlreadyReceived,
    confirmDropOff,
    isConfirming,
    dropOffError,
    isConfirmed,
  } = useHandoffLookup(trackingCode);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-canvas">
        <div className="w-8 h-8 rounded-full border-2 border-border-default border-t-brand-blue animate-spin" />
      </div>
    );
  }

  if (isConfirmed && order) {
    return (
      <div className="min-h-screen bg-bg-canvas flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-status-success-bg text-status-success flex items-center justify-center mb-5">
          <CheckCircleIcon size={32} />
        </div>
        <h1 className="font-display text-[19px] font-bold text-text-primary mb-1.5">
          Parcel Received
        </h1>
        <p className="text-[14px] text-text-secondary mb-7 max-w-[300px]">
          {order.trackingCode} is now logged at your Node and visible to riders. A rider
          will claim it and collect it from you.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-[280px]">
          <Button size="lg" fullWidth onClick={() => router.push(ROUTES.nodeScan)}>
            Scan Another Parcel
          </Button>
          <Button
            size="lg"
            fullWidth
            variant="outline"
            onClick={() => router.push(ROUTES.nodeHome)}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // A 404 is scoped-not-found: either no such code exists, or it does
  // but its origin is a different Node. The API doesn't distinguish the
  // two, so neither can we — and shouldn't guess in the copy.
  if (notFound) {
    return (
      <div className="min-h-screen bg-bg-canvas">
        <TopBar title="Drop-off" showBack />
        <div className="px-4 md:px-6 pt-2 md:pt-6 pb-8 max-w-[480px] mx-auto">
          <EmptyState
            icon={<SearchIcon size={24} />}
            title="No parcel found for that code"
            description={`We couldn't find "${trackingCode}" waiting for drop-off at your Node. Check the code with the customer — it may belong to a different pickup station.`}
            action={
              <Button size="md" onClick={() => router.push(ROUTES.nodeScan)}>
                Try Another Code
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  if (lookupError || !order) {
    const error = getFriendlyError(lookupError);
    return (
      <div className="min-h-screen bg-bg-canvas">
        <TopBar title="Drop-off" showBack />
        <div className="px-4 md:px-6 pt-2 md:pt-6 pb-8 max-w-[480px] mx-auto">
          <ErrorAlert title={error.title} message={error.message} action={error.action} />
          <Button
            fullWidth
            size="lg"
            variant="outline"
            className="mt-4"
            onClick={() => router.push(ROUTES.nodeScan)}
          >
            Back to Scanner
          </Button>
        </div>
      </div>
    );
  }

  const confirmFailure = dropOffError ? getFriendlyError(dropOffError) : null;

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="Confirm Drop-off" showBack />

      <div className="px-4 md:px-6 pt-2 md:pt-6 pb-28 max-w-[480px] mx-auto">
        <p className="text-[13px] text-text-secondary mb-4">
          Check the parcel in front of you against these details before confirming.
        </p>

        <Card padding="md" className="mb-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] text-text-muted">Tracking Code</p>
              <p className="text-[15px] font-bold text-text-primary font-mono truncate">
                {order.trackingCode}
              </p>
            </div>
            <HandoffStatusPill status={order.status} />
          </div>

          <div className="h-px bg-border-default" />

          <div className="flex items-start gap-2.5">
            <span className="w-8 h-8 rounded-[9px] bg-bg-subtle text-text-muted flex items-center justify-center shrink-0 mt-0.5">
              <PackageIcon size={14} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] text-text-muted uppercase tracking-wide">Parcel</p>
              <p className="text-[13px] font-medium text-text-primary">
                {order.parcelDescription}
              </p>
              <p className="text-[12px] text-text-muted capitalize">
                {order.parcelSize.replace("_", " ")} · Booked {formatDate(order.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-8 h-8 rounded-[9px] bg-bg-subtle text-text-muted flex items-center justify-center shrink-0 mt-0.5">
              <MapPinIcon size={14} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] text-text-muted uppercase tracking-wide">
                Going To
              </p>
              <p className="text-[13px] font-medium text-text-primary">
                {order.destinationNodeName}
              </p>
            </div>
          </div>
        </Card>

        {/* Confirming is idempotent, so this isn't a blocker — but the
            operator should know the parcel was already logged rather
            than assume their first tap failed. */}
        {isAlreadyReceived && (
          <Card padding="md" className="mb-4 border-l-[3px] border-l-status-info">
            <p className="text-[13px] font-semibold text-text-primary mb-1">
              Already logged
            </p>
            <p className="text-[12px] text-text-secondary">
              This parcel has already been received at your Node and is waiting for a
              rider. Confirming again is harmless.
            </p>
          </Card>
        )}

        {confirmFailure && (
          <ErrorAlert
            title={confirmFailure.title}
            message={confirmFailure.message}
            action={confirmFailure.action}
          />
        )}
      </div>

      <div className="fixed bottom-[var(--bottom-nav-height)] md:bottom-0 left-0 right-0 md:left-[260px] p-4 bg-bg-canvas border-t border-border-default">
        <div className="max-w-[480px] mx-auto">
          <Button
            fullWidth
            size="lg"
            isLoading={isConfirming}
            onClick={() => confirmDropOff(order.id)}
          >
            Confirm Receipt →
          </Button>
        </div>
      </div>
    </div>
  );
}
