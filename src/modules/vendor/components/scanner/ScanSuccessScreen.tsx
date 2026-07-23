"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { TopBar } from "@/components/layout";
import { CheckCircleIcon, UserIcon, PackageIcon } from "@/components/icons";
import { getErrorMessage } from "@/core/api/errors";
import { useNodeParcel, useShelfLocations, useAssignShelf } from "@/modules/vendor/hooks/use-parcel-detail";
import { NodeParcelStatusBadge } from "@/modules/vendor/components/dashboard/NodeParcelStatusBadge";
import { ShelfLocationPicker } from "./ShelfLocationPicker";

/**
 * "Parcel Received!" confirmation screen, shown right after a
 * successful QR scan + check-in. Lets the vendor assign a shelf
 * location, then confirm & store — matches Figma "4. Scan Success".
 */
export function ScanSuccessScreen() {
  const params = useParams<{ parcelId: string }>();
  const { parcel, isLoading } = useNodeParcel(params.parcelId);
  const { shelves, isLoading: isShelvesLoading } = useShelfLocations();
  const { assignShelf, isAssigning, error, isSuccess } = useAssignShelf();

  const [selectedShelf, setSelectedShelf] = useState<string | null>(null);

  if (isLoading || !parcel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-canvas">
        <div className="w-8 h-8 rounded-full border-2 border-border-default border-t-brand-blue animate-spin" />
      </div>
    );
  }

  const handleConfirm = () => {
    if (!selectedShelf) return;
    assignShelf({ parcelId: parcel.id, shelfId: selectedShelf });
  };

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar title="Scan Success" showBack />

      <div className="px-4 md:px-6 pt-2 md:pt-6 pb-28 max-w-[480px] mx-auto">
        <div className="flex flex-col items-center py-4 mb-2">
          <div className="w-14 h-14 rounded-full bg-status-success-bg text-status-success flex items-center justify-center mb-3">
            <CheckCircleIcon size={28} />
          </div>
          <h1 className="font-display text-[18px] font-bold text-text-primary">
            Parcel Received!
          </h1>
          <p className="text-[13px] text-text-muted mt-0.5">
            {isSuccess ? "Stored and ready for shelf assignment confirmation." : "Ready for shelf assignment"}
          </p>
        </div>

        <Card padding="md" className="mb-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-text-muted">Tracking ID</p>
              <p className="text-[15px] font-bold text-text-primary font-mono">
                {parcel.trackingCode}
              </p>
            </div>
            <NodeParcelStatusBadge status={parcel.status} />
          </div>

          <div className="h-px bg-border-default" />

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-[9px] bg-bg-subtle text-text-muted flex items-center justify-center">
                <UserIcon size={14} />
              </span>
              <div>
                <p className="text-[10px] text-text-muted">Recipient</p>
                <p className="text-[13px] font-medium text-text-primary">{parcel.receiver.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-[9px] bg-bg-subtle text-text-muted flex items-center justify-center">
                <PackageIcon size={14} />
              </span>
              <div>
                <p className="text-[10px] text-text-muted">Size</p>
                <p className="text-[13px] font-medium text-text-primary capitalize">{parcel.size}</p>
              </div>
            </div>
          </div>
        </Card>

        {isSuccess ? (
          <Card padding="lg" className="flex flex-col items-center text-center gap-2">
            <CheckCircleIcon size={32} className="text-status-success" />
            <p className="font-semibold text-[15px] text-text-primary">Parcel stored at {selectedShelf}</p>
            <p className="text-[13px] text-text-muted">It&apos;s now ready for collection or rider handoff.</p>
          </Card>
        ) : (
          <>
            <h2 className="font-semibold text-[14px] text-text-primary mb-3">
              Assign Shelf Location
            </h2>

            {isShelvesLoading ? (
              <p className="text-[13px] text-text-muted">Loading shelves…</p>
            ) : (
              <ShelfLocationPicker
                shelves={shelves}
                selectedId={selectedShelf}
                onSelect={setSelectedShelf}
              />
            )}

            {error && (
              <p className="text-[13px] text-status-danger mt-3" role="alert">
                {getErrorMessage(error)}
              </p>
            )}
          </>
        )}
      </div>

      {!isSuccess && (
        <div className="fixed bottom-[var(--bottom-nav-height)] md:bottom-0 left-0 right-0 md:left-[260px] p-4 bg-bg-canvas border-t border-border-default">
          <div className="max-w-[480px] mx-auto">
            <Button
              fullWidth
              size="lg"
              disabled={!selectedShelf}
              isLoading={isAssigning}
              onClick={handleConfirm}
            >
              Confirm & Store Parcel →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
