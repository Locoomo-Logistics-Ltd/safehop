import { RiderScanScreen } from "@/modules/rider/components/scanner";
import { AuthGuard } from "@/components/layout";

export default function RiderScanPage() {
  return (
    <AuthGuard>
      <RiderScanScreen />
    </AuthGuard>
  );
}
