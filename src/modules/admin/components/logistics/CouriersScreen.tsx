"use client";

import { useMemo } from "react";
import { EmptyState, Card } from "@/components/ui";
import { ErrorAlert } from "@/components/ui/error-alert";
import { TruckIcon } from "@/components/icons";
import { getFriendlyError } from "@/core/api/errors";
import { useLogisticsProviders } from "@/modules/admin/hooks/use-admin-logistics";
import { useAdminNodes } from "@/modules/admin/hooks/use-admin-nodes";
import { LogisticsLayout } from "./LogisticsLayout";
import { ProviderCard } from "./ProviderCard";

/** "Couriers" — GET/PATCH /admin/logistics/providers: who can take jobs, in what order, within which limits, and the prepaid wallet. */
export function CouriersScreen() {
  const { providers, isLoading, isError, error } = useLogisticsProviders();
  const { nodes } = useAdminNodes();
  const nodeOptions = useMemo(() => nodes.map((n) => ({ id: n.id, name: n.name })), [nodes]);

  // Lowest priority number is tried first; Locoomo riders (1000) come last.
  const ordered = useMemo(() => [...providers].sort((a, b) => a.priority - b.priority), [providers]);

  return (
    <LogisticsLayout
      title="Couriers"
      description="The backend picks a courier for each parcel at drop-off, trying them in priority order and falling back to Locoomo riders if one fails. Set which couriers are on, and the limits they work within."
    >
      {isLoading ? (
        <p className="text-[13px] text-text-muted text-center py-10">Loading couriers…</p>
      ) : isError ? (
        <ErrorAlert {...getFriendlyError(error)} />
      ) : ordered.length === 0 ? (
        <Card padding="none">
          <EmptyState icon={<TruckIcon size={22} />} title="No couriers" description="The backend didn't list any logistics providers." />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {ordered.map((provider) => (
            <ProviderCard key={provider.key} provider={provider} nodes={nodeOptions} />
          ))}
        </div>
      )}
    </LogisticsLayout>
  );
}
