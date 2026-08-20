"use client";

import Link from "next/link";
import { TopBar } from "@/components/layout";
import { Button, EmptyState } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { QrCodeIcon, PackageIcon, ClockIcon, MapPinIcon } from "@/components/icons";
import { getFriendlyError } from "@/core/api/errors";
import { ROUTES } from "@/core/config/constants";
import { useNodeDashboard } from "@/modules/node/hooks/use-node-dashboard";
import { CapacityBar } from "./CapacityBar";
import { ParcelFilterTabs } from "./ParcelFilterTabs";
import { NodeOrderRow } from "./NodeOrderRow";
import { CollectionSummaryList } from "./CollectionSummaryList";

/**
 * Node Dashboard — the Node operator's home screen, and (2026-08-17) the
 * single place a Node operator sees everything at their counter, now
 * that the standalone Inventory screen is retired. Node identity +
 * capacity come from `GET /node-operators/me`, every tab's content from
 * `GET /handoffs/my-node/orders` (see `use-node-dashboard.ts` for how
 * "occupied" is derived — the real API has no such field on either
 * endpoint).
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
    isNodeActive,
    notOnboarded,
    nodeError,
    isLoading,
    total,
    occupied,
    isHighFull,
    activeTab,
    setActiveTab,
    awaitingPickup,
    awaitingArrival,
    needsIntakeOrders,
    readyForCollection,
  } = useNodeDashboard();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-canvas">
        <TopBar title="Locoomo Node" />
        <p className="text-[13px] text-text-muted text-center py-10">Loading your Node…</p>
      </div>
    );
  }

  if (notOnboarded) {
    return (
      <div className="min-h-screen bg-bg-canvas">
        <TopBar title="Locoomo Node" />
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
      </div>
    );
  }

  if (nodeError) {
    const friendly = getFriendlyError(nodeError);
    return (
      <div className="min-h-screen bg-bg-canvas">
        <TopBar title="Locoomo Node" />
        <div className="px-4 md:px-6 pt-4 max-w-[640px] mx-auto">
          <ErrorAlert title={friendly.title} message={friendly.message} action={friendly.action} />
        </div>
      </div>
    );
  }

  if (!isNodeActive) {
    return (
      <div className="min-h-screen bg-bg-canvas">
        <TopBar title={node?.name ?? "Locoomo Node"} />
        <EmptyState
          icon={<ClockIcon size={24} />}
          title="Waiting for approval"
          description={`${node?.name ?? "Your Node"} has been submitted and is pending admin review. You'll be able to receive parcels once it's approved.`}
          action={
            <Link href={ROUTES.nodeSetup}>
              <Button size="md" variant="outline">
                Check Status
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const handoffOrders = activeTab === "awaiting_pickup" ? awaitingPickup : awaitingArrival;

  return (
    <div className="min-h-screen bg-bg-canvas relative">
      <TopBar title={node?.name ?? "Locoomo Node"} />

      <div className="px-4 md:px-6 pt-2 md:pt-8 pb-28 max-w-[640px] mx-auto">
        <div className="hidden md:flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-[22px] font-bold text-text-primary">
              {node?.name ?? "Locoomo Node"}
            </h1>
            <p className="text-[13px] text-text-muted mt-0.5">{node?.address}</p>
          </div>
        </div>

        <CapacityBar total={total} occupied={occupied} isHighFull={isHighFull} />

        <div className="mt-5 mb-4">
          <ParcelFilterTabs active={activeTab} onChange={setActiveTab} />
        </div>

        {activeTab === "ready_for_collection" ? (
          <CollectionSummaryList
            needsIntakeOrders={needsIntakeOrders}
            readyOrders={readyForCollection}
          />
        ) : handoffOrders.length === 0 ? (
          <EmptyState
            icon={<PackageIcon size={24} />}
            title="Nothing here"
            description={
              activeTab === "awaiting_pickup"
                ? "Parcels waiting for a rider to collect will show up here."
                : "Parcels a rider is bringing to your Node will show up here."
            }
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {handoffOrders.map((order) => (
              <NodeOrderRow key={order.id} order={order} />
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
