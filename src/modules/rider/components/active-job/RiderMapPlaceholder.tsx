import { cn } from "@/lib/utils";
import type { GeoPoint } from "@/core/types";

interface RiderMapPlaceholderProps {
  center?: GeoPoint;
  className?: string;
  height?: string;
}

/**
 * Static map placeholder for rider screens.
 *
 * SWAP POINT: identical pattern to the User module's MockMapView.
 * Replace with a real Google Maps / Mapbox component by keeping the
 * same `center` and `className` props — nothing calling this changes.
 *
 * The rider flow uses Google Maps for navigation via the device's
 * native app (tapping "Navigate" opens Google Maps / Apple Maps via
 * the maps:// / geo:// deep link), so the in-app map here is purely
 * orientation — a live map library would add value but isn't required
 * for core functionality.
 */
export function RiderMapPlaceholder({ className, height = "h-[180px]" }: RiderMapPlaceholderProps) {
  return (
    <div className={cn("relative rounded-[16px] overflow-hidden bg-[#E8EEF7] border border-border-default", height, className)}>
      {/* Stylized streets */}
      <svg className="absolute inset-0 w-full h-full opacity-50" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 60 H400 M0 120 H400 M0 160 H400" stroke="#C5D4E8" strokeWidth="2" />
        <path d="M60 0 V200 M160 0 V200 M280 0 V200 M350 0 V200" stroke="#C5D4E8" strokeWidth="2" />
        <path d="M0 0 L400 200 M400 0 L0 200" stroke="#D5E0EF" strokeWidth="1.5" />
        {/* Route line */}
        <path d="M80 160 Q 160 80 280 60" stroke="#006CDF" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
        {/* Origin dot */}
        <circle cx="80" cy="160" r="6" fill="#22C55E" />
        {/* Destination pin */}
        <circle cx="280" cy="60" r="8" fill="#006CDF" />
        <circle cx="280" cy="60" r="4" fill="white" />
      </svg>
      {/* Map label */}
      <span className="absolute bottom-2 right-3 text-[10px] font-semibold text-text-muted bg-white/80 px-2 py-0.5 rounded-full">
        Lagos
      </span>
      {/* Recenter button */}
      <button
        className="absolute bottom-2 right-14 w-8 h-8 rounded-full bg-white border border-border-default shadow-sm flex items-center justify-center text-text-secondary"
        aria-label="Recenter map"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="8" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
      </button>
    </div>
  );
}
