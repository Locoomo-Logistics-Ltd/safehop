"use client";

import { useState } from "react";
import { Button, Card, Input } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { cn } from "@/lib/utils";
import { useUpdateVehicleRule, useVehicleRules } from "@/modules/admin/hooks/use-admin-logistics";
import type { Parcel, VehicleRule } from "@/core/types";
import { LogisticsLayout } from "./LogisticsLayout";

const SIZES: Parcel["parcelSize"][] = ["small", "medium", "large", "extra_large"];

/** "Vehicles" — GET/PATCH /admin/logistics/vehicle-rules. A parcel goes by the lowest-rank enabled vehicle it fits. */
export function VehicleRulesScreen() {
  const { rules, isLoading, isError } = useVehicleRules();
  const ordered = [...rules].sort((a, b) => a.rank - b.rank);

  return (
    <LogisticsLayout
      title="Vehicle rules"
      description="A parcel goes by the lowest-rank enabled vehicle it fits (size, weight and longest side). Senders see these limits as hints on the parcel form."
    >
      {isLoading ? (
        <p className="text-[13px] text-text-muted text-center py-10">Loading vehicle rules…</p>
      ) : isError ? (
        <ErrorAlert title="Couldn't load vehicle rules" message="Check your connection and try again." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {ordered.map((rule) => (
            <VehicleRuleCard key={rule.vehicleClass} rule={rule} />
          ))}
        </div>
      )}
    </LogisticsLayout>
  );
}

function VehicleRuleCard({ rule }: { rule: VehicleRule }) {
  const { updateRule, isSaving } = useUpdateVehicleRule();
  const [editing, setEditing] = useState(false);
  const [enabled, setEnabled] = useState(rule.enabled);
  const [rank, setRank] = useState(String(rule.rank));
  const [sizes, setSizes] = useState<Parcel["parcelSize"][]>(rule.parcelSizes);
  const [weight, setWeight] = useState(String(rule.maxWeightKg));
  const [side, setSide] = useState(String(rule.maxLongestSideCm));
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const rankN = Number(rank);
    const weightN = Number(weight);
    const sideN = Number(side);
    if (!Number.isInteger(rankN) || rankN < 1) return setError("Rank must be a whole number from 1.");
    if (!(weightN > 0)) return setError("Max weight must be more than 0 kg.");
    if (!(sideN > 0)) return setError("Max longest side must be more than 0 cm.");
    if (sizes.length === 0) return setError("Choose at least one parcel size.");

    const payload: Parameters<typeof updateRule>[0]["payload"] = {};
    if (enabled !== rule.enabled) payload.enabled = enabled;
    if (rankN !== rule.rank) payload.rank = rankN;
    if (weightN !== rule.maxWeightKg) payload.maxWeightKg = weightN;
    if (sideN !== rule.maxLongestSideCm) payload.maxLongestSideCm = sideN;
    if (JSON.stringify([...sizes].sort()) !== JSON.stringify([...rule.parcelSizes].sort())) payload.parcelSizes = sizes;

    setError(null);
    if (Object.keys(payload).length === 0) return setEditing(false);
    updateRule({ vehicleClass: rule.vehicleClass, payload }, { onSuccess: () => setEditing(false) });
  };

  return (
    <Card padding="md" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-[16px] font-bold text-text-primary capitalize">{rule.vehicleClass}</h2>
          <span className="text-[11px] text-text-muted">rank {rule.rank}</span>
        </div>
        <span
          className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full",
            rule.enabled ? "bg-status-success-bg text-status-success" : "bg-status-neutral-bg text-status-neutral"
          )}
        >
          {rule.enabled ? "Enabled" : "Disabled"}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12.5px]">
        <dt className="text-text-muted">Sizes</dt>
        <dd className="text-right text-text-primary capitalize">{rule.parcelSizes.map((s) => s.replace("_", " ")).join(", ")}</dd>
        <dt className="text-text-muted">Max weight</dt>
        <dd className="text-right text-text-primary">{rule.maxWeightKg} kg</dd>
        <dt className="text-text-muted">Max longest side</dt>
        <dd className="text-right text-text-primary">{rule.maxLongestSideCm} cm</dd>
      </dl>

      <div>
        <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)}>
          {editing ? "Close" : "Edit"}
        </Button>
      </div>

      {editing && (
        <div className="rounded-[12px] border border-border-default p-4 flex flex-col gap-3 bg-bg-subtle/40">
          <label className="flex items-center gap-2.5 text-[13px] font-medium text-text-primary">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="w-4 h-4" />
            Enabled
          </label>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Rank" type="number" value={rank} onChange={(e) => setRank(e.target.value)} />
            <Input label="Max kg" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
            <Input label="Longest side cm" type="number" value={side} onChange={(e) => setSide(e.target.value)} />
          </div>
          <fieldset className="flex flex-wrap gap-3">
            <legend className="text-[12px] font-medium text-text-secondary mb-1">Parcel sizes</legend>
            {SIZES.map((size) => (
              <label key={size} className="flex items-center gap-2 text-[13px] text-text-primary capitalize">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={sizes.includes(size)}
                  onChange={(e) => setSizes((prev) => (e.target.checked ? [...prev, size] : prev.filter((s) => s !== size)))}
                />
                {size.replace("_", " ")}
              </label>
            ))}
          </fieldset>
          {error && (
            <p className="text-[12.5px] text-status-danger" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button size="sm" isLoading={isSaving} onClick={save} className="bg-admin-accent hover:bg-admin-accent-dark text-white">
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
