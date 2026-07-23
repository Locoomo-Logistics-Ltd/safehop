"use client";

import { useNotificationStore } from "@/store/notification.store";
import { CheckCircle, XCircle } from "lucide-react";

export function Notification() {
  const notification = useNotificationStore(
    (state) => state.notification
  );

  if (!notification) return null;

  return (
    <div
      className="
        fixed
        top-5
        right-5
        z-50
        w-[350px]
        rounded-xl
        border
        bg-white
        shadow-lg
        p-4
        flex
        gap-3
        animate-in
        slide-in-from-top-5
      "
    >
      {notification.type === "success" ? (
        <CheckCircle className="text-green-600 mt-1" />
      ) : (
        <XCircle className="text-red-600 mt-1" />
      )}

      <div>
        <h3 className="font-semibold text-sm">
          {notification.title}
        </h3>

        <p className="text-sm text-gray-600">
          {notification.message}
        </p>
      </div>
    </div>
  );
}