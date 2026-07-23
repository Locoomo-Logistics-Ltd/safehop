import { Suspense } from "react";
import { CreateAccountScreen } from "@/modules/user/components/auth";

export default function CreateAccountPage() {
  return (
    <Suspense>
      <CreateAccountScreen />
    </Suspense>
  );
}
