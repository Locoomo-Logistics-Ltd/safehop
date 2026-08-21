/**
 * Promoted to `components/ui/HandoffStatusPill.tsx` 2026-08-21 once the
 * Rider module's Activity screen needed the same status pill — same
 * promotion pattern as `QrScannerView` (see `docs/ARCHITECTURE.md`'s
 * "Shared component architecture" section): this file re-exports from
 * the new shared location so no existing import path in this module
 * breaks. Import from `@/components/ui` directly in new code.
 */
export { HandoffStatusPill, getHandoffStatusLabel } from "@/components/ui/HandoffStatusPill";
