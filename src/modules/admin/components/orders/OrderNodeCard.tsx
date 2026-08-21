import { Button } from "@/components/ui";
import { MapPinIcon } from "@/components/icons";

interface OrderNodeCardProps {
  nodeName: string;
  riderName: string | null;
}

/** Dark "Node & Rider" card, bottom-right of Order Details — matches admin_UI.png. */
export function OrderNodeCard({ nodeName, riderName }: OrderNodeCardProps) {
  return (
    <div className="rounded-[16px] bg-brand-navy text-white p-4">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/50 mb-3">
        <MapPinIcon size={12} />
        Origin Node
      </p>
      <div className="flex items-center justify-between text-[13px] mb-1.5">
        <span className="text-white/60">Node</span>
        <span className="font-medium">{nodeName}</span>
      </div>
      <div className="flex items-center justify-between text-[13px] mb-3">
        <span className="text-white/60">Rider</span>
        <span className="font-medium">{riderName ?? "Unassigned"}</span>
      </div>
      <Button
        fullWidth
        size="sm"
        className="bg-admin-accent hover:bg-admin-accent-dark text-white"
      >
        Contact Node
      </Button>
    </div>
  );
}
