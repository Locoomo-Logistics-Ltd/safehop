"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { TopBar } from "@/components/layout";
import { BellIcon } from "@/components/icons";
import { getErrorMessage } from "@/core/api/errors";
import { useNodeParcel } from "@/modules/vendor/hooks/use-parcel-detail";
import { useFlagParcel } from "@/modules/vendor/hooks/use-flag-parcel";
import { NodeParcelStatusBadge } from "@/modules/vendor/components/dashboard/NodeParcelStatusBadge";
import { FlagReasonGrid } from "./FlagReasonGrid";
import type { FlagReason } from "@/core/types";

const NOTE_MAX_LENGTH = 240;

/** "Flag Issue" screen — report a parcel problem to admin, matching Figma "7. Flag Parcel Issue". */
export function FlagIssueScreen() {
  const params = useParams<{ parcelId: string }>();
  const { parcel, isLoading } = useNodeParcel(params.parcelId);
  const { submitFlag, isSubmitting, error } = useFlagParcel();

  const [reason, setReason] = useState<FlagReason | null>(null);
  const [note, setNote] = useState("");

  if (isLoading || !parcel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-canvas">
        <div className="w-8 h-8 rounded-full border-2 border-border-default border-t-brand-blue animate-spin" />
      </div>
    );
  }

  const handleSubmit = () => {
    if (!reason) return;
    submitFlag({ parcelId: parcel.id, reason, note: note.trim() || undefined });
  };

  return (
    <div className="min-h-screen bg-bg-canvas">
      <TopBar
        title="Flag Issue"
        showBack
        rightSlot={
          <span className="w-9 h-9 rounded-full bg-bg-card border border-border-default flex items-center justify-center text-text-secondary">
            <BellIcon size={16} />
          </span>
        }
      />

      <div className="px-4 md:px-6 pt-2 md:pt-6 pb-8 max-w-[460px] mx-auto">
        <Card padding="md" className="flex items-start justify-between gap-3 mb-6">
          <div>
            <p className="text-[11px] text-text-muted mb-0.5">Parcel ID</p>
            <p className="text-[15px] font-bold text-text-primary font-mono mb-1.5">
              #{parcel.trackingCode}
            </p>
            <p className="text-[12px] text-text-secondary">
              {parcel.sender.name} → <span className="font-medium">{parcel.receiver.name}</span>
            </p>
          </div>
          <NodeParcelStatusBadge status={parcel.status} />
        </Card>

        <h2 className="font-semibold text-[14px] text-text-primary mb-3">Select Issue Reason</h2>
        <FlagReasonGrid value={reason} onChange={setReason} />

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="flag-note" className="text-[13px] font-medium text-text-secondary">
              Add a note (optional)
            </label>
            <span className="text-[11px] text-text-muted">
              {note.length}/{NOTE_MAX_LENGTH}
            </span>
          </div>
          <textarea
            id="flag-note"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX_LENGTH))}
            placeholder="Describe what happened…"
            rows={4}
            className="w-full rounded-[12px] border border-border-default bg-bg-card px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 resize-none"
          />
        </div>

        {error && (
          <p className="text-[13px] text-status-danger mt-3" role="alert">
            {getErrorMessage(error)}
          </p>
        )}

        <Button
          fullWidth
          size="lg"
          variant="danger"
          className="mt-6"
          disabled={!reason}
          isLoading={isSubmitting}
          onClick={handleSubmit}
        >
          Submit Flag to Admin
        </Button>

        <p className="text-center text-[11px] text-text-muted mt-3">
          Locoomo support will review this within 24 hours.
        </p>
      </div>
    </div>
  );
}
