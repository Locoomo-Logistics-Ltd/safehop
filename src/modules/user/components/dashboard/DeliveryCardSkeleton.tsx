import { Card } from "@/components/ui";

/** Loading placeholder matching DeliveryCard's exact layout, to avoid layout shift. */
export function DeliveryCardSkeleton() {
  return (
    <Card padding="md" className="flex flex-col gap-3 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-bg-subtle shrink-0" />
          <div className="flex flex-col gap-1.5">
            <div className="h-3 w-24 bg-bg-subtle rounded-full" />
            <div className="h-2.5 w-16 bg-bg-subtle rounded-full" />
          </div>
        </div>
        <div className="h-5 w-20 bg-bg-subtle rounded-full" />
      </div>
      <div className="h-[2px] bg-bg-subtle rounded-full" />
    </Card>
  );
}
