"use client";

import Link from "next/link";
import { RootTopBar } from "@/components/layout";
import { Button, EmptyState } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { QrCodeIcon, PackageIcon, ClockIcon, MapPinIcon, EyeOffIcon } from "@/components/icons";
import { PayoutReminderBanner } from "@/components/payout";
import { getFriendlyError } from "@/core/api/errors";
import { ROUTES } from "@/core/config/constants";
import { useNodeDashboard } from "@/modules/node/hooks/use-node-dashboard";
import { NodeSwitcher } from "@/modules/node/components/nodes";
import { CapacityBar } from "./CapacityBar";
import { ParcelFilterTabs } from "./ParcelFilterTabs";
import { NodeOrderRow } from "./NodeOrderRow";
import { CollectionSummaryList } from "./CollectionSummaryList";

/**
 * Node Dashboard — the Node operator's (and, in full, their invited
 * staff's) home screen, and (2026-08-17) the single place either sees
 * everything at their counter, now that the standalone Inventory
 * screen is retired. Node identity + capacity resolve through
 * `useMyNodes` (an owner's from `GET /node-operators/me/nodes`
 * directly; a staff member's reconstructed from order history + `GET
 * /nodes/:id`, since that route 403s them — see `use-my-nodes.ts`),
 * every tab's content from `GET /handoffs/my-node/orders` (see
 * `use-node-dashboard.ts` for how "occupied" is derived — the real API
 * has no such field on either source).
 *
 * **Scoped to one station** (2026-09-02): an operator can now run
 * several, and both endpoints above return all of them, so everything
 * here is filtered to the Node named in the `NodeSwitcher` at the top.
 * That's the point — the operator is physically standing at one
 * counter, and a pick-list mixing two branches' parcels, or a capacity
 * bar summing them, would be wrong rather than merely cluttered.
 *
 * Three tabs, each a pure summary — every row here just navigates,
 * nothing is actionable inline. The actual rider-code entry, check-in,
 * and collection actions all live on a dedicated details page per
 * order, reached by tapping a row:
 *   - **Awaiting Pickup** / **Awaiting Arrival** — `NodeOrderRow` rows
 *     link to `HandoffDetailScreen` (`ROUTES.nodeHandoffDetail`),
 *     which reuses the same `useConfirmHandoff` code-entry flow
 *     Inventory's Pickup/Incoming tabs used.
 *   - **Ready for Collection** — `CollectionSummaryList` rows (its own
 *     two sub-states: needs check-in / ready) link to the existing
 *     `CollectParcelScreen` (`ROUTES.nodeCollect`), extended to cover
 *     both.
 *
 * A Node that isn't onboarded yet, or is onboarded but not yet
 * Admin-approved, has nothing to show here — both states route the
 * operator back to Node Setup instead of a broken/empty dashboard
 * shell.
 */
export function NodeHomeScreen() {
  const {
    node,
    payoutAccountConfigured,
    isNodeActive,
    isStaff,
    isOwnerOfActiveNode,
    isPubliclyVisible,
    hasNoStationsYet,
    nodeError,
    isLoading,
    total,
    occupied,
    isHighFull,
    activeTab,
    setActiveTab,
    expected,
    awaitingPickup,
    awaitingArrival,
    needsIntakeOrders,
    readyForCollection,
  } = useNodeDashboard();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-canvas">
        <RootTopBar profileHref={ROUTES.nodeProfile} />
        <p className="text-[13px] text-text-muted text-center py-10">Loading your Node…</p>
      </div>
    );
  }

  // No stations, and the reason differs by role — an owner hasn't built
  // one yet, a staff member hasn't been invited to one. Never show
  // staff the setup form: creating a Node requires the `node_operator`
  // role, so it's a button they can't complete.
  if (hasNoStationsYet) {
    return (
      <div className="min-h-screen bg-bg-canvas">
        <RootTopBar profileHref={ROUTES.nodeProfile} />
        {isStaff ? (
          <EmptyState
            icon={<MapPinIcon size={24} />}
            title="No station yet"
            description="Nothing to show yet — a station only appears here once it's handled at least one order. If you were invited a while ago and still see this, check with whoever added you."
          />
        ) : (
          <EmptyState
            icon={<MapPinIcon size={24} />}
            title="Set up your Node"
            description="You haven't set up the location you'll operate from yet. It takes a minute, then an admin reviews it before you can start receiving parcels."
            action={
              <Link href={ROUTES.nodeSetup}>
                <Button size="md">Set Up Node</Button>
              </Link>
            }
          />
        )}
      </div>
    );
  }

  if (nodeError) {
    const friendly = getFriendlyError(nodeError);
    return (
      <div className="min-h-screen bg-bg-canvas">
        <RootTopBar profileHref={ROUTES.nodeProfile} />
        <div className="px-4 md:px-6 pt-4 max-w-[640px] mx-auto">
          <ErrorAlert title={friendly.title} message={friendly.message} action={friendly.action} />
        </div>
      </div>
    );
  }

  if (!isNodeActive) {
    return (
      <div className="min-h-screen bg-bg-canvas">
        <RootTopBar profileHref={ROUTES.nodeProfile} />
        {/* The switcher belongs here too, not just on the live
            dashboard: with several stations, one of them being pending
            must not strand the operator away from the ones that
            aren't. Switching to an approved station drops straight
            through to the real dashboard below. */}
        <div className="px-4 md:px-6 pt-4 max-w-[640px] mx-auto">
          <NodeSwitcher />
        </div>
        <EmptyState
          icon={<ClockIcon size={24} />}
          title="Waiting for approval"
          description={
            isStaff
              ? `${node?.name ?? "This station"} is still pending admin review. You'll be able to work the counter here once it's approved.`
              : `${node?.name ?? "Your Node"} has been submitted and is pending admin review. You'll be able to receive parcels once it's approved.`
          }
          // My Stations works read-only for staff too, so keep the
          // button for both — only the label admits staff can't act on
          // an approval, just watch for it.
          action={
            <Link href={ROUTES.nodeSetup}>
              <Button size="md" variant="outline">
                {isStaff ? "View Stations" : "Manage Stations"}
              </Button>
            </Link>
          }
        />
        {isOwnerOfActiveNode && payoutAccountConfigured === false && node && (
          <div className="px-4 md:px-6 max-w-[640px] mx-auto">
            {/* Payout accounts are per-Node now, so point at this
                station's own page rather than the stations list. */}
            <PayoutReminderBanner href={ROUTES.nodeDetail(node.id)} />
          </div>
        )}
      </div>
    );
  }

  const listedOrders =
    activeTab === "expected"
      ? expected
      : activeTab === "awaiting_pickup"
        ? awaitingPickup
        : awaitingArrival;

  const emptyCopy: Record<Exclude<typeof activeTab, "ready_for_collection">, string> = {
    expected:
      "Parcels paid for but not yet handed in at your counter — including ones you send yourself — show up here.",
    awaiting_pickup: "Parcels waiting for a rider to collect will show up here.",
    awaiting_arrival: "Parcels a rider is bringing to your Node will show up here.",
  };

  return (
    <div className="min-h-screen bg-bg-canvas relative">
      <RootTopBar profileHref={ROUTES.nodeProfile} />

      <div className="px-4 md:px-6 pt-2 md:pt-8 pb-28 max-w-[640px] mx-auto">
        {/* One header for both roles. A staff member sees the station
            they were invited to named here, exactly as its owner does —
            they're running that counter, not a shell of their own. */}
        <div className="flex items-start justify-between gap-3 mb-6">
          <NodeSwitcher className="flex-1" />
        </div>

        <CapacityBar total={total} occupied={occupied} isHighFull={isHighFull} />

        {/* Owner switched public drop-offs off. Stated as a standing
            fact, not an error — the station is deliberately closed to
            walk-ins and everything else still runs, which is precisely
            what an operator needs spelled out so they don't read an
            empty Expected tab as a fault. */}
        {isPubliclyVisible === false && (
          <div className="mt-4 flex items-start gap-2.5 p-3 rounded-[12px] bg-bg-subtle border border-border-default">
            <span className="w-7 h-7 rounded-[8px] bg-status-neutral-bg text-status-neutral flex items-center justify-center shrink-0">
              <EyeOffIcon size={14} />
            </span>
            <p className="text-[12px] text-text-secondary leading-[1.5]">
              <span className="font-semibold text-text-primary">
                Closed to public drop-offs.
              </span>{" "}
              Customers can&apos;t find or send to this station. Parcels already on their
              way still arrive, and you can still send your own.
              {/* Only the owner can flip this back, and the toggle only
                  renders on the detail page for them — so don't offer
                  staff a link to a control they won't find there. */}
              {node && isOwnerOfActiveNode && (
                <>
                  {" "}
                  <Link href={ROUTES.nodeDetail(node.id)} className="text-brand-blue font-semibold">
                    Change
                  </Link>
                </>
              )}
            </p>
          </div>
        )}

        {/* Owner-only: staff have no payout account anywhere in the API,
            so nagging them about one would be asking for something they
            can't do. */}
        {isOwnerOfActiveNode && payoutAccountConfigured === false && node && (
          <div className="mt-4">
            <PayoutReminderBanner href={ROUTES.nodeDetail(node.id)} />
          </div>
        )}

        <div className="mt-5 mb-4">
          <ParcelFilterTabs active={activeTab} onChange={setActiveTab} />
        </div>

        {activeTab === "ready_for_collection" ? (
          <CollectionSummaryList
            needsIntakeOrders={needsIntakeOrders}
            readyOrders={readyForCollection}
          />
        ) : listedOrders.length === 0 ? (
          <EmptyState
            icon={<PackageIcon size={24} />}
            title="Nothing here"
            description={emptyCopy[activeTab]}
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {listedOrders.map((order) => (
              <NodeOrderRow
                key={order.id}
                order={order}
                // Expected parcels haven't been received yet, so the
                // action they need is the drop-off preview + confirm,
                // not the rider-code entry every other tab links to.
                href={
                  activeTab === "expected"
                    ? ROUTES.nodeDropOff(order.trackingCode)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating scan action — the Figma orange circular QR button */}
      <Link
        href={ROUTES.nodeScan}
        aria-label="Scan a parcel"
        className="fixed bottom-[84px] right-5 md:bottom-8 md:right-8 z-30 w-14 h-14 rounded-full bg-brand-blue text-white flex items-center justify-center shadow-[var(--shadow-raised)] transition-transform active:scale-95"
      >
        <QrCodeIcon size={24} />
      </Link>
    </div>
  );
}
