"use client";

import { useState } from "react";
import { Button, Card, Input } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useProviderWallet, useUpdateProvider } from "@/modules/admin/hooks/use-admin-logistics";
import type { LogisticsProvider, UpdateLogisticsProviderPayload } from "@/core/types";

interface ProviderCardProps {
  provider: LogisticsProvider;
  nodes: { id: string; name: string }[];
}

const kobo = (v: number) => formatCurrency(v / 100);

/** Blank → `null` (clears a nullable setting); otherwise the number, or `undefined` when it isn't a number. */
function parseNullable(raw: string): number | null | undefined {
  if (raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export function ProviderCard({ provider, nodes }: ProviderCardProps) {
  const isInHouse = provider.key === "in_house";
  const [editing, setEditing] = useState(false);
  const { wallet, unreachable, isLoading: walletLoading, refetch } = useProviderWallet(
    provider.key,
    !!provider.capabilities?.prepaidWallet
  );

  return (
    <Card padding="md" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-display text-[17px] font-bold text-text-primary">{provider.label}</h2>
            <Badge tone={provider.enabled ? "success" : "neutral"}>{provider.enabled ? "Enabled" : "Disabled"}</Badge>
            {!provider.registered && <Badge tone="warning">Not configured</Badge>}
          </div>
          <p className="text-[12px] text-text-muted mt-0.5 font-mono">{provider.key}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-text-muted">In progress now</p>
          <p className="font-display text-[22px] font-bold text-text-primary leading-none">{provider.activeDeliveries}</p>
        </div>
      </div>

      {!provider.registered && (
        <p className="text-[12.5px] text-status-warning bg-status-warning-bg rounded-[10px] px-3 py-2" role="alert">
          The server isn&apos;t configured for this courier (no API key), so it can&apos;t take bookings even when enabled.
        </p>
      )}

      {provider.capabilities && (
        <p className="text-[12px] text-text-muted">
          Vehicles: {provider.capabilities.vehicleClasses.join(", ")} · Handover: {provider.capabilities.handover} ·
          Updates: {provider.capabilities.updates}
        </p>
      )}

      {provider.capabilities?.prepaidWallet && (
        <div className="rounded-[12px] border border-border-default p-3.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-text-muted">Wallet</p>
            <button type="button" onClick={() => refetch()} className="text-[12px] text-admin-accent font-semibold">
              Refresh
            </button>
          </div>
          {walletLoading ? (
            <p className="text-[13px] text-text-muted">Loading wallet…</p>
          ) : unreachable ? (
            <p className="text-[13px] text-status-danger" role="alert">
              Couldn&apos;t reach {provider.label}. Try again in a moment.
            </p>
          ) : wallet ? (
            <>
              {wallet.lowBalance && (
                <p className="text-[13px] font-semibold text-status-danger bg-status-danger-bg rounded-[10px] px-3 py-2 mb-3" role="alert">
                  Top up the {provider.label} wallet — the balance is below the alert threshold.
                </p>
              )}
              <p className="text-[11px] text-text-muted">Spendable on new jobs</p>
              <p className={cn("font-display text-[28px] font-bold leading-tight", wallet.lowBalance ? "text-status-danger" : "text-text-primary")}>
                {kobo(wallet.freeKobo)}
              </p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-[12px]">
                <dt className="text-text-muted">Balance</dt>
                <dd className="text-right text-text-primary">{kobo(wallet.balanceKobo)}</dd>
                <dt className="text-text-muted">Held for live jobs</dt>
                <dd className="text-right text-text-primary">{kobo(wallet.heldKobo)}</dd>
                <dt className="text-text-muted">Available</dt>
                <dd className="text-right text-text-primary">{kobo(wallet.availableKobo)}</dd>
                <dt className="text-text-muted">Reserved for surcharges</dt>
                <dd className="text-right text-text-primary">{kobo(wallet.reservedForSurchargesKobo)}</dd>
              </dl>
            </>
          ) : (
            <p className="text-[13px] text-text-muted">No wallet information.</p>
          )}
        </div>
      )}

      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-[12.5px]">
        <Fact label="Priority" value={provider.priority} help={isInHouse ? "Always the fallback" : "Lower is tried first"} />
        <Fact label="Attempts per order" value={provider.maxAttempts} />
        <Fact
          label="Wait for a driver"
          value={provider.assignTimeoutMinutes === null ? "Indefinitely" : `${provider.assignTimeoutMinutes} min`}
        />
        <Fact
          label="Road distance"
          value={
            provider.minDistanceKm === null && provider.maxDistanceKm === null
              ? "No limit"
              : `${provider.minDistanceKm ?? 0} – ${provider.maxDistanceKm ?? "∞"} km`
          }
        />
        <Fact
          label="Cost cap"
          value={provider.maxCostShare === null ? "No cap" : `${Math.round(provider.maxCostShare * 100)}% of fee`}
        />
        <Fact
          label="Pilot stations"
          value={provider.pilotNodeIds === null ? "All stations" : `${provider.pilotNodeIds.length} station(s)`}
        />
        {provider.lowBalanceAlertKobo !== null && (
          <Fact label="Low-balance alert" value={kobo(provider.lowBalanceAlertKobo)} />
        )}
      </dl>

      <div>
        <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)}>
          {editing ? "Close" : "Edit settings"}
        </Button>
      </div>

      {editing && <ProviderForm provider={provider} nodes={nodes} onDone={() => setEditing(false)} />}
    </Card>
  );
}

function ProviderForm({
  provider,
  nodes,
  onDone,
}: {
  provider: LogisticsProvider;
  nodes: { id: string; name: string }[];
  onDone: () => void;
}) {
  const isInHouse = provider.key === "in_house";
  const { updateProvider, isSaving } = useUpdateProvider();

  const [enabled, setEnabled] = useState(provider.enabled);
  const [priority, setPriority] = useState(String(provider.priority));
  const [maxAttempts, setMaxAttempts] = useState(String(provider.maxAttempts));
  const [timeout, setTimeoutMin] = useState(provider.assignTimeoutMinutes?.toString() ?? "");
  const [minKm, setMinKm] = useState(provider.minDistanceKm?.toString() ?? "");
  const [maxKm, setMaxKm] = useState(provider.maxDistanceKm?.toString() ?? "");
  const [costShare, setCostShare] = useState(provider.maxCostShare?.toString() ?? "");
  const [alertNaira, setAlertNaira] = useState(
    provider.lowBalanceAlertKobo !== null ? String(provider.lowBalanceAlertKobo / 100) : ""
  );
  const [allStations, setAllStations] = useState(provider.pilotNodeIds === null);
  const [pilot, setPilot] = useState<string[]>(provider.pilotNodeIds ?? []);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const payload: UpdateLogisticsProviderPayload = {};
    const fail = (msg: string) => setError(msg);

    if (!isInHouse && enabled !== provider.enabled) payload.enabled = enabled;

    if (!isInHouse && Number(priority) !== provider.priority) {
      const n = Number(priority);
      if (!Number.isInteger(n) || n < 1 || n > 10000) return fail("Priority must be a whole number from 1 to 10000.");
      payload.priority = n;
    }

    const attempts = Number(maxAttempts);
    if (!Number.isInteger(attempts) || attempts < 1 || attempts > 10) return fail("Attempts must be a whole number from 1 to 10.");
    if (attempts !== provider.maxAttempts) payload.maxAttempts = attempts;

    if (!isInHouse) {
      const t = parseNullable(timeout);
      if (t === undefined || (t !== null && (!Number.isInteger(t) || t < 1 || t > 1440)))
        return fail("Wait time must be 1–1440 minutes, or blank to wait indefinitely.");
      if (t !== provider.assignTimeoutMinutes) payload.assignTimeoutMinutes = t;

      const min = parseNullable(minKm);
      const max = parseNullable(maxKm);
      if (min === undefined || max === undefined || (min !== null && min < 0) || (max !== null && max < 0))
        return fail("Distances must be numbers of 0 or more, or blank for no limit.");
      if (min !== null && max !== null && min > max) return fail("The minimum distance can't exceed the maximum.");
      if (min !== provider.minDistanceKm) payload.minDistanceKm = min;
      if (max !== provider.maxDistanceKm) payload.maxDistanceKm = max;

      const share = parseNullable(costShare);
      if (share === undefined || (share !== null && (share < 0.1 || share > 2)))
        return fail("Cost cap must be between 0.1 and 2 (0.75 = 75%), or blank for no cap.");
      if (share !== provider.maxCostShare) payload.maxCostShare = share;

      const nextPilot = allStations ? null : pilot;
      if (!allStations && pilot.length === 0) return fail("Choose at least one station, or switch to all stations.");
      if (JSON.stringify(nextPilot) !== JSON.stringify(provider.pilotNodeIds)) payload.pilotNodeIds = nextPilot;
    }

    if (provider.capabilities?.prepaidWallet) {
      const alert = parseNullable(alertNaira);
      if (alert === undefined || (alert !== null && alert < 0)) return fail("The alert threshold must be ₦0 or more.");
      const current = provider.lowBalanceAlertKobo !== null ? provider.lowBalanceAlertKobo / 100 : null;
      if (alert !== current) payload.lowBalanceAlertNaira = alert;
    }

    if (Object.keys(payload).length === 0) {
      setError(null);
      return onDone();
    }
    setError(null);
    updateProvider({ key: provider.key, payload }, { onSuccess: onDone });
  };

  return (
    <div className="rounded-[12px] border border-border-default p-4 flex flex-col gap-4 bg-bg-subtle/40">
      {isInHouse ? (
        <p className="text-[12.5px] text-text-muted">
          Locoomo riders are always the fallback and can&apos;t be switched off. Only the number of attempts is editable.
        </p>
      ) : (
        <label className="flex items-center gap-2.5 text-[13px] font-medium text-text-primary">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="w-4 h-4" />
          Receives new jobs
        </label>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {!isInHouse && (
          <Input label="Priority (lower is tried first)" type="number" value={priority} onChange={(e) => setPriority(e.target.value)} />
        )}
        <Input label="Attempts per order (1–10)" type="number" value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} />
        {!isInHouse && (
          <>
            <Input
              label="Give up if no driver accepts (minutes)"
              type="number"
              placeholder="Blank = wait indefinitely"
              value={timeout}
              onChange={(e) => setTimeoutMin(e.target.value)}
            />
            <Input label="Minimum road distance (km)" type="number" placeholder="No limit" value={minKm} onChange={(e) => setMinKm(e.target.value)} />
            <Input label="Maximum road distance (km)" type="number" placeholder="No limit" value={maxKm} onChange={(e) => setMaxKm(e.target.value)} />
            <Input
              label="Cost cap (share of delivery fee)"
              type="number"
              step="0.05"
              placeholder="e.g. 0.75 = 75%"
              value={costShare}
              onChange={(e) => setCostShare(e.target.value)}
            />
          </>
        )}
        {provider.capabilities?.prepaidWallet && (
          <Input
            label="Low-balance alert (₦)"
            type="number"
            placeholder="No alert"
            value={alertNaira}
            onChange={(e) => setAlertNaira(e.target.value)}
          />
        )}
      </div>

      {!isInHouse && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-[12px] font-medium text-text-secondary mb-1">Pilot stations (orders from these only)</legend>
          <label className="flex items-center gap-2.5 text-[13px] text-text-primary">
            <input type="checkbox" checked={allStations} onChange={(e) => setAllStations(e.target.checked)} className="w-4 h-4" />
            All stations
          </label>
          {!allStations && (
            <div className="max-h-48 overflow-y-auto rounded-[10px] border border-border-default bg-bg-card p-2 flex flex-col gap-1">
              {nodes.length === 0 && <p className="text-[12px] text-text-muted p-1">No stations loaded.</p>}
              {nodes.map((node) => (
                <label key={node.id} className="flex items-center gap-2.5 text-[13px] text-text-primary px-1 py-0.5">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={pilot.includes(node.id)}
                    onChange={(e) =>
                      setPilot((prev) => (e.target.checked ? [...prev, node.id] : prev.filter((id) => id !== node.id)))
                    }
                  />
                  {node.name}
                </label>
              ))}
            </div>
          )}
        </fieldset>
      )}

      {error && (
        <p className="text-[12.5px] text-status-danger" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button size="sm" isLoading={isSaving} onClick={submit} className="bg-admin-accent hover:bg-admin-accent-dark text-white">
          Save changes
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function Fact({ label, value, help }: { label: string; value: React.ReactNode; help?: string }) {
  return (
    <div>
      <dt className="text-text-muted">{label}</dt>
      <dd className="font-semibold text-text-primary">{value}</dd>
      {help && <dd className="text-[11px] text-text-muted">{help}</dd>}
    </div>
  );
}

function Badge({ tone, children }: { tone: "success" | "warning" | "neutral"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "text-[10px] font-semibold px-2 py-0.5 rounded-full",
        tone === "success" && "bg-status-success-bg text-status-success",
        tone === "warning" && "bg-status-warning-bg text-status-warning",
        tone === "neutral" && "bg-status-neutral-bg text-status-neutral"
      )}
    >
      {children}
    </span>
  );
}
