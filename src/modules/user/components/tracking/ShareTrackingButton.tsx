"use client";

import { Button } from "@/components/ui";
import { ShareIcon } from "@/components/icons";
import { useNotificationStore } from "@/store/notification.store";

interface ShareTrackingButtonProps {
  trackingUrl: string;
  trackingCode: string;
  className?: string;
}

/**
 * Shares the order's public tracking link as is — it already carries the
 * access token (`?t=`), so the receiver can open it without the code or
 * phone digits. Uses the native share sheet where there is one (WhatsApp
 * and friends on a phone) and falls back to copying the link.
 */
export function ShareTrackingButton({ trackingUrl, trackingCode, className }: ShareTrackingButtonProps) {
  const showNotification = useNotificationStore((s) => s.showNotification);

  const handleShare = async () => {
    const text = `Track my Locoomo parcel ${trackingCode}`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: "Locoomo parcel", text, url: trackingUrl });
        return;
      }
      await navigator.clipboard.writeText(trackingUrl);
      showNotification({ type: "success", title: "Link copied", message: "Paste it into a message to share." });
    } catch (err) {
      // Dismissing the native share sheet rejects with AbortError — not a failure.
      if (err instanceof DOMException && err.name === "AbortError") return;
      showNotification({ type: "error", title: "Couldn't share", message: "Copy the tracking code and send that instead." });
    }
  };

  return (
    <Button
      fullWidth
      size="lg"
      variant="outline"
      className={className}
      leftIcon={<ShareIcon size={16} />}
      onClick={handleShare}
    >
      Share tracking link
    </Button>
  );
}
