"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { RefreshCcwIcon } from "@/components/icons";
import { formatRelativeDateTime } from "@/lib/format";
import { useRefreshRoutes, useRouteDistances } from "@/modules/admin/hooks/use-admin-logistics";
import { LogisticsLayout } from "./LogisticsLayout";

/** "Routes" — measured road distances between active stations. Unmeasured pairs are priced on a straight-line estimate until measured. */
export function RouteDistancesScreen() {
  const [includePending, setIncludePending] = useState(false);
  const { data, isLoading, isError } = useRouteDistances(includePending);
  const { refresh, isStarting } = useRefreshRoutes(includePending);

  const running = !!data?.refreshRunning;
  const pct = data && data.eligiblePairs > 0 ? Math.round((data.measuredPairs / data.eligiblePairs) * 100) : 0;

  return (
    <LogisticsLayout
      title="Route distances"
      description="Measures the real road distance between every pair of active stations in the background, a few seconds per pair. Pairs not measured yet are priced on the straight-line estimate."
      actions={
        <Button
          size="sm"
          leftIcon={<RefreshCcwIcon size={14} />}
          isLoading={isStarting}
          disabled={running}
          onClick={() => refresh()}
          className="bg-admin-accent hover:bg-admin-accent-dark text-white"
        >
          {running ? "Already refreshing…" : "Refresh routes"}
        </Button>
      }
    >
      <label className="flex items-center gap-2.5 text-[13px] text-text-primary mb-4">
        <input
          type="checkbox"
          className="w-4 h-4"
          checked={includePending}
          onChange={(e) => setIncludePending(e.target.checked)}
        />
        Include stations still awaiting approval (pilot prep)
      </label>

      {isLoading ? (
        <p className="text-[13px] text-text-muted text-center py-10">Loading routes…</p>
      ) : isError || !data ? (
        <ErrorAlert title="Couldn't load route distances" message="Check your connection and try again." />
      ) : (
        <>
          <Card padding="md" className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[13px] font-semibold text-text-primary">
                {data.measuredPairs} of {data.eligiblePairs} routes measured
              </p>
              <p className="text-[12px] text-text-muted">{pct}%</p>
            </div>
            <div
              className="h-2 rounded-full bg-bg-subtle overflow-hidden"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Routes measured"
            >
              <div className="h-full bg-admin-accent transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[12px] text-text-muted mt-2">
              {running ? "Refreshing — this page updates every 5 seconds." : data.lastMeasuredAt ? `Last measured ${formatRelativeDateTime(data.lastMeasuredAt)}` : "Not measured yet."}
              {data.measuringProvider ? ` · measured via ${data.measuringProvider}` : ""}
            </p>
          </Card>

          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-text-muted bg-bg-subtle">
                    <th className="font-medium px-5 py-2.5">From</th>
                    <th className="font-medium px-5 py-2.5">To</th>
                    <th className="font-medium px-5 py-2.5 text-right">Straight line</th>
                    <th className="font-medium px-5 py-2.5 text-right">By road</th>
                    <th className="font-medium px-5 py-2.5">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {data.routes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-[13px] text-text-muted">
                        No routes measured yet. Press “Refresh routes”.
                      </td>
                    </tr>
                  ) : (
                    data.routes.map((r) => (
                      <tr key={`${r.originNodeId}-${r.destinationNodeId}`} className="border-t border-border-default">
                        <td className="px-5 py-3 text-[13px] text-text-primary">{r.originNodeName}</td>
                        <td className="px-5 py-3 text-[13px] text-text-primary">{r.destinationNodeName}</td>
                        <td className="px-5 py-3 text-[13px] text-text-secondary text-right whitespace-nowrap">
                          {r.straightLineKm.toFixed(1)} km
                        </td>
                        <td className="px-5 py-3 text-[13px] font-semibold text-text-primary text-right whitespace-nowrap">
                          {r.roadDistanceKm.toFixed(1)} km
                        </td>
                        <td className="px-5 py-3 text-[12px] text-text-muted">{r.source}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </LogisticsLayout>
  );
}
