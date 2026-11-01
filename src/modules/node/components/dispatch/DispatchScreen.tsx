"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TopBar } from "@/components/layout";
import { Button, Card, EmptyState, Input } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import {
  ClockIcon,
  MailIcon,
  MapPinIcon,
  PackageIcon,
  PhoneIcon,
  SearchIcon,
  UserIcon,
} from "@/components/icons";
import { getFriendlyError } from "@/core/api/errors";
import { ROUTES } from "@/core/config/constants";
import { formatCurrency } from "@/lib/format";
import { formatNigerianPhone } from "@/lib/phone";
import { toOrderParcelSize } from "@/core/types";
import type { DispatchParcelPayload } from "@/core/types";
import { ParcelSizeSelector } from "@/modules/user/components/delivery/ParcelSizeSelector";
import { NodeListItem } from "@/modules/user/components/delivery/NodeListItem";
import { useDispatchParcel } from "@/modules/node/hooks/use-dispatch-parcel";
import {
  dispatchParcelSchema,
  type DispatchParcelFormValues,
} from "@/modules/node/schemas/dispatch.schema";

/**
 * "Send a Parcel" (`/node/dispatch`) — `POST
 * /node-operators/nodes/:nodeId/dispatch` (docs/API.md, 2026-09-03).
 * The station's own outbound parcel: no Consumer account, no app on
 * the sending side, origin fixed to the counter the operator is
 * standing at.
 *
 * Open to **staff as well as owners** — the API gates this on
 * membership, not ownership, because it's counter work like every
 * other handoff step, so this is one of the few Node screens that
 * isn't owner-only.
 *
 * Deliberately a single screen, not the Consumer's four-step wizard
 * (`/delivery/new` → select-nodes → method → checkout): there's no
 * origin to choose, no delivery-method choice in the real contract,
 * and an operator sending a dozen parcels a day shouldn't walk a
 * funnel designed for a first-time sender. It ends the same way
 * Checkout does — a fee breakdown, then a redirect to Paystack.
 *
 * **Quote first** (docs/LOGISTICS_API.md §5.10): "See price" calls
 * `POST /delivery-quotes`, which reserves nothing, and shows the fee and
 * vehicle. Only the "Pay" tap calls `POST .../dispatch` (which holds a
 * slot for ~15 minutes) and goes straight to Paystack.
 *
 * **Validation** is react-hook-form + zod, same as the Consumer's
 * `NewDeliveryScreen` — see `dispatchParcelSchema` for why the email
 * rule in particular earns its keep. Submit stays enabled and failures
 * surface per-field on tap, rather than a disabled button that never
 * says what's missing.
 */
export function DispatchScreen() {
  const {
    originNode,
    destinations,
    isLoadingDestinations,
    requestQuote,
    quote,
    isQuoting,
    quoteError,
    clearQuote,
    dispatch,
    isDispatching,
    dispatchError,
    clearDispatchError,
  } = useDispatchParcel();

  // The body to send once the quote has been seen and accepted.
  const [pendingPayload, setPendingPayload] = useState<DispatchParcelPayload | null>(null);

  // Not part of the form — it filters the destination list, it isn't
  // a value that gets submitted.
  const [search, setSearch] = useState("");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<DispatchParcelFormValues>({
    resolver: zodResolver(dispatchParcelSchema),
  });

  // Captured on submit purely to label the confirmation screen below.
  // Deliberately not `watch()` — that opts the whole component out of
  // React Compiler memoization (it returns a non-memoizable function),
  // and the station list here is long enough for that to matter.
  const [dispatchedToId, setDispatchedToId] = useState<string | null>(null);

  const filteredDestinations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return destinations;
    return destinations.filter(
      (node) =>
        node.name.toLowerCase().includes(query) ||
        node.city.toLowerCase().includes(query) ||
        node.address.toLowerCase().includes(query)
    );
  }, [destinations, search]);

  // `values` arrives already trimmed by the schema, so the only thing
  // left to do is map the UI's "xl" onto the API's "extra_large".
  const onSubmit = (values: DispatchParcelFormValues) => {
    const payload: DispatchParcelPayload = {
      ...values,
      // The API wants `+` optional and 7–15 digits — no spaces.
      receiverPhone: formatNigerianPhone(values.receiverPhone.replace(/[\s-]/g, "")),
      parcelSize: toOrderParcelSize(values.parcelSize),
    };
    setDispatchedToId(values.destinationNodeId);
    setPendingPayload(payload);
    requestQuote({
      destinationNodeId: payload.destinationNodeId,
      parcelSize: payload.parcelSize,
    });
  };

  const backToForm = () => {
    clearQuote();
    clearDispatchError();
    setPendingPayload(null);
  };

  if (!originNode) {
    return (
      <div className="min-h-screen bg-bg-canvas">
        <TopBar title="Send a Parcel" showBack />
        <EmptyState
          icon={<MapPinIcon size={24} />}
          title="No station selected"
          description="Pick the station you're sending from first — sending is always from one of your own counters."
          action={
            <Link href={ROUTES.nodeHome}>
              <Button size="md" variant="outline">
                Go to Dashboard
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  if (originNode.status !== "active") {
    return (
      <div className="min-h-screen bg-bg-canvas">
        <TopBar title="Send a Parcel" showBack />
        <EmptyState
          icon={<ClockIcon size={24} />}
          title="This station isn't live yet"
          description={`${originNode.name} is still waiting on admin approval. You'll be able to send parcels from it once that's done.`}
        />
      </div>
    );
  }

  // Quote in hand: the price and vehicle are known and nothing is
  // reserved yet. The form stays mounted behind this so "Edit details"
  // doesn't lose what was typed.
  if (quote && pendingPayload) {
    // The price may lapse while this screen sits open; "now" is read at
    // the tap, not at render, and a lapsed quote is re-fetched first.
    const handlePay = () => {
      if (Date.now() > new Date(quote.validUntil).getTime()) {
        requestQuote({
          destinationNodeId: pendingPayload.destinationNodeId,
          parcelSize: pendingPayload.parcelSize,
        });
        return;
      }
      dispatch(pendingPayload);
    };
    return (
      <div className="min-h-screen bg-bg-canvas">
        <TopBar title="Confirm & Pay" showBack />
        <div className="px-4 md:px-6 pt-4 pb-10 max-w-[480px] mx-auto flex flex-col gap-5">
          <Card padding="lg">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-3">
              Delivery Fee
            </p>
            <p className="font-display text-[28px] font-bold text-text-primary">
              {formatCurrency(quote.amountKobo / 100)}
            </p>
            <p className="text-[12px] text-text-muted mt-1">
              {quote.distanceKm.toFixed(1)}km ·{" "}
              {originNode.name} → {destinations.find((n) => n.id === dispatchedToId)?.name ?? "destination"}
            </p>
            <p className="text-[12.5px] text-text-secondary mt-3">
              Goes by <span className="font-semibold text-text-primary">{quote.vehicleClass}</span>, about{" "}
              {quote.estimatedDeliveryMinutes} min after drop-off.
            </p>
          </Card>

          <p className="text-[12px] text-text-secondary leading-[1.6]">
            Your slot is held for about 15 minutes once you tap Pay. After paying you&apos;ll find this
            parcel under <span className="font-semibold text-text-primary">To receive</span>{" "}
            on your dashboard — confirm the drop-off there to release it to a courier.
          </p>

          {dispatchError != null && <ErrorAlert {...getFriendlyError(dispatchError)} />}

          <Button fullWidth size="lg" isLoading={isDispatching || isQuoting} onClick={handlePay}>
            Pay {formatCurrency(quote.amountKobo / 100)}
          </Button>
          <Button fullWidth variant="ghost" onClick={backToForm}>
            Edit details
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="Send a Parcel" showBack />

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="px-4 md:px-6 pt-4 pb-10 max-w-[480px] mx-auto flex flex-col gap-5"
      >
        <Card padding="md" className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-[10px] bg-status-info-bg text-brand-blue flex items-center justify-center shrink-0">
            <MapPinIcon size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] text-text-muted">Sending from</p>
            <p className="text-[14px] font-semibold text-text-primary truncate">
              {originNode.name}
            </p>
          </div>
        </Card>

        {/* Destination */}
        <Card padding="lg">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-9 h-9 rounded-[10px] bg-status-info-bg text-brand-blue flex items-center justify-center shrink-0">
              <MapPinIcon size={17} />
            </span>
            <div>
              <h2 className="font-semibold text-[15px] text-text-primary leading-tight">
                Destination
              </h2>
              <p className="text-[12px] text-text-muted">
                Nearest to {originNode.name} first
              </p>
            </div>
          </div>

          <Input
            placeholder="Search stations by name or city"
            leftElement={<SearchIcon size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Controller
            control={control}
            name="destinationNodeId"
            render={({ field }) => (
              <div className="flex flex-col gap-2 mt-3 max-h-[280px] overflow-y-auto">
                {isLoadingDestinations ? (
                  <p className="text-[12px] text-text-muted py-4 text-center">
                    Loading stations…
                  </p>
                ) : filteredDestinations.length === 0 ? (
                  <p className="text-[12px] text-text-muted py-4 text-center">
                    No other stations match that.
                  </p>
                ) : (
                  filteredDestinations.map((node) => (
                    <NodeListItem
                      key={node.id}
                      node={node}
                      isSelected={field.value === node.id}
                      onSelect={field.onChange}
                    />
                  ))
                )}
              </div>
            )}
          />

          {errors.destinationNodeId?.message && (
            <p className="text-[12px] text-status-danger mt-2" role="alert">
              {errors.destinationNodeId.message}
            </p>
          )}
        </Card>

        {/* Receiver */}
        <Card padding="lg">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-9 h-9 rounded-[10px] bg-status-info-bg text-brand-blue flex items-center justify-center shrink-0">
              <UserIcon size={17} />
            </span>
            <div>
              <h2 className="font-semibold text-[15px] text-text-primary leading-tight">
                Receiver
              </h2>
              <p className="text-[12px] text-text-muted">
                They&apos;ll be emailed a collection code
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            <Input
              label="Full name"
              placeholder="Chinedu Okonkwo"
              error={errors.receiverFullName?.message}
              {...register("receiverFullName")}
            />
            <Input
              label="Email"
              type="email"
              placeholder="chinedu@example.com"
              leftElement={<MailIcon size={16} />}
              error={errors.receiverEmail?.message}
              {...register("receiverEmail")}
            />
            <Input
              label="Phone"
              placeholder="0801 234 5678"
              inputMode="tel"
              leftElement={<PhoneIcon size={16} />}
              error={errors.receiverPhone?.message}
              {...register("receiverPhone")}
            />
          </div>
        </Card>

        {/* Parcel */}
        <Card padding="lg">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-9 h-9 rounded-[10px] bg-status-info-bg text-brand-blue flex items-center justify-center shrink-0">
              <PackageIcon size={17} />
            </span>
            <div>
              <h2 className="font-semibold text-[15px] text-text-primary leading-tight">
                Parcel
              </h2>
              <p className="text-[12px] text-text-muted">
                Larger parcels may go by a bigger vehicle, which changes the price
              </p>
            </div>
          </div>

          <Input
            label="What's inside"
            placeholder="Documents, sealed envelope"
            error={errors.parcelDescription?.message}
            {...register("parcelDescription")}
          />

          <div className="mt-4">
            <Controller
              control={control}
              name="parcelSize"
              render={({ field }) => (
                <ParcelSizeSelector value={field.value} onChange={field.onChange} />
              )}
            />
            {errors.parcelSize?.message && (
              <p className="text-[12px] text-status-danger mt-2" role="alert">
                {errors.parcelSize.message}
              </p>
            )}
          </div>
        </Card>

        {quoteError != null && <ErrorAlert {...getFriendlyError(quoteError)} />}

        <Button type="submit" fullWidth size="lg" isLoading={isQuoting}>
          See price
        </Button>
      </form>
    </div>
  );
}
