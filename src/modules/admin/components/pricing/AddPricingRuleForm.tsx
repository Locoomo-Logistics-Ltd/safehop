"use client";

import { useState } from "react";
import { Card, Input, Button } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import { useCreatePricingRule } from "@/modules/admin/hooks/use-admin-pricing";
import type { CreatePricingRulePayload } from "@/core/types";

interface AddPricingRuleFormProps {
  onClose: () => void;
}

const OVERRIDE_VEHICLES = ["bicycle", "car", "van", "truck"] as const;
type OverrideVehicle = (typeof OVERRIDE_VEHICLES)[number];

/** A "10 km costs ₦…" sanity check, per docs/LOGISTICS_API.md §8.3: trip = vehicle base + per-km × road km + destination fee. */
const SAMPLE_KM = 10;

/**
 * Inline "Add Pricing Rule" form — POST /admin/pricing, a real,
 * confirmed route per docs/API.md. Append-only: submitting this never
 * edits the current rule, it adds a new one that becomes "current"
 * immediately. Same inline-card pattern as `OnboardNodeForm`/
 * `InviteMemberForm` — no modal primitive exists in `components/ui`.
 *
 * The base and per-km fields are the **motorbike** rate. Other vehicles
 * use default multipliers of it unless overridden below; every amount is
 * entered in naira (the API echoes kobo back).
 */
export function AddPricingRuleForm({ onClose }: AddPricingRuleFormProps) {
  const [baseFeeNaira, setBaseFeeNaira] = useState("");
  const [perKmRateNaira, setPerKmRateNaira] = useState("");
  const [destinationFeeNaira, setDestinationFeeNaira] = useState("");
  const [roadDistanceFactor, setRoadDistanceFactor] = useState("");
  const [overrides, setOverrides] = useState<Record<OverrideVehicle, { base: string; perKm: string }>>({
    bicycle: { base: "", perKm: "" },
    car: { base: "", perKm: "" },
    van: { base: "", perKm: "" },
    truck: { base: "", perKm: "" },
  });
  const [error, setError] = useState<string | null>(null);
  const { createPricingRule, isSubmitting } = useCreatePricingRule();

  const isValid = baseFeeNaira.trim() && perKmRateNaira.trim() && destinationFeeNaira.trim();

  const setOverride = (vehicle: OverrideVehicle, field: "base" | "perKm", value: string) =>
    setOverrides((prev) => ({ ...prev, [vehicle]: { ...prev[vehicle], [field]: value } }));

  const handleSubmit = () => {
    const base = Number(baseFeeNaira);
    const perKm = Number(perKmRateNaira);
    const destination = Number(destinationFeeNaira);
    if ([base, perKm, destination].some((n) => !Number.isFinite(n) || n < 0)) {
      return setError("Base fee, per-km rate and destination fee must be ₦0 or more.");
    }

    const payload: CreatePricingRulePayload = {
      baseFeeNaira: base,
      perKmRateNaira: perKm,
      destinationFeeNaira: destination,
    };

    if (roadDistanceFactor.trim()) {
      const factor = Number(roadDistanceFactor);
      if (!Number.isFinite(factor) || factor < 1) return setError("The road-distance factor must be 1 or more (1.4 = roads are 40% longer than a straight line).");
      payload.roadDistanceFactor = factor;
    }

    const vehicleRates: NonNullable<CreatePricingRulePayload["vehicleRates"]> = {};
    for (const vehicle of OVERRIDE_VEHICLES) {
      const { base: b, perKm: k } = overrides[vehicle];
      if (!b.trim() && !k.trim()) continue;
      // An override needs both numbers — half of one would price the vehicle wrongly.
      if (!b.trim() || !k.trim()) return setError(`Give both a base fee and a per-km rate for ${vehicle}, or leave both blank.`);
      const bn = Number(b);
      const kn = Number(k);
      if (!Number.isFinite(bn) || !Number.isFinite(kn) || bn < 0 || kn < 0) return setError(`${vehicle} rates must be ₦0 or more.`);
      vehicleRates[vehicle] = { baseFeeNaira: bn, perKmRateNaira: kn };
    }
    if (Object.keys(vehicleRates).length > 0) payload.vehicleRates = vehicleRates;

    setError(null);
    createPricingRule(payload);
  };

  const sample = (b: string, k: string) => {
    const bn = Number(b);
    const kn = Number(k);
    const dn = Number(destinationFeeNaira) || 0;
    if (!b.trim() || !k.trim() || !Number.isFinite(bn) || !Number.isFinite(kn)) return null;
    return bn + kn * SAMPLE_KM + dn;
  };
  const motorbikeSample = sample(baseFeeNaira, perKmRateNaira);

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

      <p className="text-[12px] font-semibold text-text-secondary mb-2">Motorbike rate (the default for every vehicle)</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <Input
          aria-label="Base fee in naira"
          placeholder="Base fee (₦)"
          type="number"
          value={baseFeeNaira}
          onChange={(e) => setBaseFeeNaira(e.target.value)}
        />
        <Input
          aria-label="Per-km rate in naira"
          placeholder="Per-km rate (₦)"
          type="number"
          value={perKmRateNaira}
          onChange={(e) => setPerKmRateNaira(e.target.value)}
        />
        <Input
          aria-label="Destination fee in naira"
          placeholder="Destination fee (₦)"
          type="number"
          value={destinationFeeNaira}
          onChange={(e) => setDestinationFeeNaira(e.target.value)}
        />
      </div>
      <p className="text-[11px] text-text-muted mb-4">
        Destination fee is a flat amount added to the order total, paid entirely to the destination Node on
        completion — separate from the rider/origin-Node/platform revenue split.
      </p>

      <Input
        label="Road-distance factor (optional)"
        type="number"
        step="0.05"
        placeholder="e.g. 1.4"
        hint="Until a route is measured, road km is estimated as straight-line km × this factor."
        value={roadDistanceFactor}
        onChange={(e) => setRoadDistanceFactor(e.target.value)}
        className="max-w-[220px]"
      />

      <p className="text-[12px] font-semibold text-text-secondary mt-5 mb-1">Other vehicles (optional)</p>
      <p className="text-[11px] text-text-muted mb-2">
        Leave a vehicle blank to use the default multiplier of the motorbike rate. Fill both fields to override it.
      </p>
      <div className="flex flex-col gap-2 mb-4">
        {OVERRIDE_VEHICLES.map((vehicle) => {
          const total = sample(overrides[vehicle].base, overrides[vehicle].perKm);
          return (
            <div key={vehicle} className="grid grid-cols-[72px_1fr_1fr_auto] items-center gap-2">
              <span className="text-[13px] capitalize text-text-primary">{vehicle}</span>
              <Input
                aria-label={`${vehicle} base fee in naira`}
                placeholder="Base (₦)"
                type="number"
                value={overrides[vehicle].base}
                onChange={(e) => setOverride(vehicle, "base", e.target.value)}
              />
              <Input
                aria-label={`${vehicle} per-km rate in naira`}
                placeholder="Per km (₦)"
                type="number"
                value={overrides[vehicle].perKm}
                onChange={(e) => setOverride(vehicle, "perKm", e.target.value)}
              />
              <span className="hidden sm:block text-[11px] text-text-muted w-24 text-right">
                {total !== null ? `${SAMPLE_KM} km: ${formatCurrency(total)}` : ""}
              </span>
            </div>
          );
        })}
      </div>

      {motorbikeSample !== null && (
        <p className="text-[12px] text-text-secondary mb-3" role="status">
          Check: a {SAMPLE_KM} km motorbike trip costs{" "}
          <span className="font-semibold text-text-primary">{formatCurrency(motorbikeSample)}</span> (base + per-km × {SAMPLE_KM}{" "}
          + destination fee).
        </p>
      )}

      {error && (
        <p className="text-[12.5px] text-status-danger mb-3" role="alert">
          {error}
        </p>
      )}

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
