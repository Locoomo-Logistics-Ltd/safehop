import { Suspense } from "react";
import { AcceptInviteScreen } from "@/modules/user/components/auth";

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteScreen />
    </Suspense>
  );
}
