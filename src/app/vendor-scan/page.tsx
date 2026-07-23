import { QrScannerScreen } from "@/modules/vendor/components/scanner";
import { AuthGuard } from "@/components/layout";

export default function VendorScanPage() {
  return (
    <AuthGuard>
      <QrScannerScreen />
    </AuthGuard>
  );
}
