"use client";

import { useState } from "react";
import { Card, Input, Button } from "@/components/ui";
import { useCreatePricingRule } from "@/modules/admin/hooks/use-admin-pricing";

interface AddPricingRuleFormProps {
  onClose: () => void;
}

/**
 * Inline "Add Pricing Rule" form — POST /admin/pricing, a real,
 * confirmed route per docs/API.md. Append-only: submitting this never
 * edits the current rule, it adds a new one that becomes "current"
 * immediately. Same inline-card pattern as `OnboardNodeForm`/
 * `InviteMemberForm` — no modal primitive exists in `components/ui`.
 */
export function AddPricingRuleForm({ onClose }: AddPricingRuleFormProps) {
  const [baseFeeNaira, setBaseFeeNaira] = useState("");
  const [perKmRateNaira, setPerKmRateNaira] = useState("");
  const [destinationFeeNaira, setDestinationFeeNaira] = useState("");
  const { createPricingRule, isSubmitting } = useCreatePricingRule();

  const isValid = baseFeeNaira.trim() && perKmRateNaira.trim() && destinationFeeNaira.trim();

  const handleSubmit = () => {
    createPricingRule({
      baseFeeNaira: Number(baseFeeNaira),
      perKmRateNaira: Number(perKmRateNaira),
      destinationFeeNaira: Number(destinationFeeNaira),
    });
  };

  return (
    <Card padding="md" className="mb-4 border-l-[3px] border-l-status-success">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] font-semibold text-text-primary">Add Pricing Rule</p>
        <button type="button" onClick={onClose} className="text-[12px] text-text-muted hover:text-text-primary">
          Cancel
        </button>
      </div>
      <p className="text-[12px] text-text-muted mb-3">
        This becomes the current rate immediately. It doesn&apos;t edit or remove any existing rule — past orders keep
        referencing whichever rule was current when their fee was calculated.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <Input
          placeholder="Base fee (₦)"
          type="number"
          value={baseFeeNaira}
          onChange={(e) => setBaseFeeNaira(e.target.value)}
        />
        <Input
          placeholder="Per-km rate (₦)"
          type="number"
          value={perKmRateNaira}
          onChange={(e) => setPerKmRateNaira(e.target.value)}
        />
        <Input
          placeholder="Destination fee (₦)"
          type="number"
          value={destinationFeeNaira}
          onChange={(e) => setDestinationFeeNaira(e.target.value)}
        />
      </div>
      <p className="text-[11px] text-text-muted mb-3">
        Destination fee is a flat amount added to the order total, paid entirely to the destination Node on
        completion — separate from the rider/origin-Node/platform revenue split.
      </p>
      <Button
        size="sm"
        disabled={!isValid}
        isLoading={isSubmitting}
        onClick={handleSubmit}
        className="bg-status-success hover:opacity-90 text-white"
      >
        Add Rule
      </Button>
    </Card>
  );
}
