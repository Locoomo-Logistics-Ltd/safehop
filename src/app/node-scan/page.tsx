import { QrScannerScreen } from "@/modules/node/components/scanner";
import { AuthGuard } from "@/components/layout";

export default function NodeScanPage() {
  return (
    <AuthGuard>
      <QrScannerScreen />
    </AuthGuard>
  );
}
