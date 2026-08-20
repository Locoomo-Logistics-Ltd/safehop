"use client";

import { useState } from "react";
import { Card, Input, Button } from "@/components/ui";
import { useCreateRevenueSplitRatio } from "@/modules/admin/hooks/use-admin-revenue-split";

interface SetRevenueSplitRatioFormProps {
  onClose: () => void;
}

/**
 * Inline "Set Revenue Split" form — POST /admin/revenue-split, a real,
 * confirmed route per docs/API.md. Append-only: submitting this never
 * edits the current ratio, it adds a new one that becomes "current"
 * immediately, for orders completed from then on. Same inline-card
 * pattern as `AddPricingRuleForm` — no modal primitive exists in
 * `components/ui`.
 */
export function SetRevenueSplitRatioForm({ onClose }: SetRevenueSplitRatioFormProps) {
  const [riderPercent, setRiderPercent] = useState("");
  const [nodePercent, setNodePercent] = useState("");
  const [platformPercent, setPlatformPercent] = useState("");
  const { createRatio, isSubmitting } = useCreateRevenueSplitRatio();

  const sum = [riderPercent, nodePercent, platformPercent]
    .map((v) => Number(v) || 0)
    .reduce((a, b) => a + b, 0);
  const isValid = riderPercent.trim() && nodePercent.trim() && platformPercent.trim() && sum === 100;

  const handleSubmit = () => {
    createRatio({
      riderPercent: Number(riderPercent),
      nodePercent: Number(nodePercent),
      platformPercent: Number(platformPercent),
    });
  };

  return (
    <Card padding="md" className="mb-4 border-l-[3px] border-l-status-success">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] font-semibold text-text-primary">Set Revenue Split</p>
        <button type="button" onClick={onClose} className="text-[12px] text-text-muted hover:text-text-primary">
          Cancel
        </button>
      </div>
      <p className="text-[12px] text-text-muted mb-3">
        Applies to every order completed from now on. It doesn&apos;t change how already-completed orders were split
        — the three percentages must sum to exactly 100.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
        <Input
          placeholder="Rider %"
          type="number"
          value={riderPercent}
          onChange={(e) => setRiderPercent(e.target.value)}
        />
        <Input
          placeholder="Node %"
          type="number"
          value={nodePercent}
          onChange={(e) => setNodePercent(e.target.value)}
        />
        <Input
          placeholder="Platform %"
          type="number"
          value={platformPercent}
          onChange={(e) => setPlatformPercent(e.target.value)}
        />
      </div>
      <p className={`text-[11px] mb-3 ${sum === 100 ? "text-status-success" : "text-text-muted"}`}>
        Total: {sum}% {sum !== 100 && "(must be exactly 100%)"}
      </p>
      <Button
        size="sm"
        disabled={!isValid}
        isLoading={isSubmitting}
        onClick={handleSubmit}
        className="bg-status-success hover:opacity-90 text-white"
      >
        Set Ratio
      </Button>
    </Card>
  );
}
