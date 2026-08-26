import { Suspense } from "react";
import { VerifyEmailScreen } from "@/modules/user/components/auth";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailScreen />
    </Suspense>
  );
}
