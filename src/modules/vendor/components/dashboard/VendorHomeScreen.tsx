"use client";

import Link from "next/link";
import { TopBar } from "@/components/layout";
import { EmptyState } from "@/components/ui";
import { QrCodeIcon, PackageIcon } from "@/components/icons";
import { ROUTES } from "@/core/config/constants";
import { useVendorNode } from "@/modules/vendor/hooks/use-vendor-node";
import { useNodeParcels } from "@/modules/vendor/hooks/use-node-parcels";
import { CapacityBar } from "./CapacityBar";
import { ParcelFilterTabs } from "./ParcelFilterTabs";
import { NodeParcelRow } from "./NodeParcelRow";

/**
 * Node Dashboard — the vendor's home screen. Shows node capacity,
 * filterable parcel list, and a floating scan button (the Figma
 * orange circular QR action), matching "2. Node Dashboard".
 */
export function VendorHomeScreen() {
  const { node, isLoading: isNodeLoading } = useVendorNode();
  const { filteredParcels, activeTab, setActiveTab, isLoading: isParcelsLoading } = useNodeParcels();

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

        {!isNodeLoading && node && (
          <CapacityBar
            total={node.capacity.total}
            occupied={node.capacity.occupied}
            isHighFull={node.isHighFull}
          />
        )}

        <div className="mt-5 mb-4">
          <ParcelFilterTabs active={activeTab} onChange={setActiveTab} />
        </div>

        {isParcelsLoading ? (
          <p className="text-[13px] text-text-muted text-center py-10">Loading parcels…</p>
        ) : filteredParcels.length === 0 ? (
          <EmptyState
            icon={<PackageIcon size={24} />}
            title="No parcels here"
            description="Parcels matching this filter will show up here once scanned in."
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {filteredParcels.map((parcel) => (
              <NodeParcelRow key={parcel.id} parcel={parcel} />
            ))}
          </div>
        )}
      </div>

      {/* Floating scan action — the Figma orange circular QR button */}
      <Link
        href={ROUTES.vendorScan}
        aria-label="Scan a parcel"
        className="fixed bottom-[84px] right-5 md:bottom-8 md:right-8 z-30 w-14 h-14 rounded-full bg-brand-blue text-white flex items-center justify-center shadow-[var(--shadow-raised)] transition-transform active:scale-95"
      >
        <QrCodeIcon size={24} />
      </Link>
    </div>
  );
}
