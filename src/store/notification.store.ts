import { create } from "zustand";

type NotificationType = "success" | "error";

interface Notification {
  type: NotificationType;
  title: string;
  message: string;
}

interface NotificationState {
  notification: Notification | null;
  showNotification: (notification: Notification) => void;
  clearNotification: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notification: null,

  showNotification: (notification) => {
    set({ notification });

    setTimeout(() => {
      set({ notification: null });
    }, 4000);
  },

  clearNotification: () => {
    set({ notification: null });
  },
}));