import { PublicTrackingScreen } from "@/modules/tracking/components";

/** Public lookup for someone who only has the code off the parcel: tracking code + last 4 digits of the receiver's phone. No account needed. */
export default function FindParcelPage() {
  return <PublicTrackingScreen />;
}
