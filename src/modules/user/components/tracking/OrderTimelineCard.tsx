import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatRelativeDateTime } from "@/lib/format";
import type { OrderTimelineEntry } from "@/core/types";

/** `GET /orders/:id/timeline` rendered as is — labels are written by the backend, so nothing here rewrites them. Newest first reads better on a phone. */
export function OrderTimelineCard({
  entries,
  isLoading,
}: {
  entries: OrderTimelineEntry[] | undefined;
  isLoading?: boolean;
}) {
  const ordered = [...(entries ?? [])].reverse();

  return (
    <Card padding="md" className="mb-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-4">History</p>

      {isLoading ? (
        <p className="text-[13px] text-text-muted">Loading history…</p>
      ) : ordered.length === 0 ? (
        <p className="text-[13px] text-text-muted">Nothing to show yet.</p>
      ) : (
        <ol className="flex flex-col">
          {ordered.map((entry, i) => (
            <li key={`${entry.at}-${i}`} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "w-2.5 h-2.5 rounded-full mt-1.5 shrink-0",
                    i === 0 ? "bg-brand-blue" : "bg-border-strong"
                  )}
                  aria-hidden="true"
                />
                {i < ordered.length - 1 && <span className="w-px flex-1 bg-border-default my-1" aria-hidden="true" />}
              </div>
              <div className="pb-4 min-w-0">
                <p className={cn("text-[13px] leading-snug", i === 0 ? "font-semibold text-text-primary" : "text-text-secondary")}>
                  {entry.label}
                </p>
                <p className="text-[11px] text-text-muted mt-0.5">{formatRelativeDateTime(entry.at)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
