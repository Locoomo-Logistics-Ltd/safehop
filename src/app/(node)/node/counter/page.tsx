import { Suspense } from "react";
import { NodeCounterScreen } from "@/modules/node/components/counter";

export default function NodeCounterPage() {
  // `useSearchParams` (the `?code=` a queue row or the scanner passes) needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <NodeCounterScreen />
    </Suspense>
  );
}
