import type { UserRole } from "@/core/types";

export interface RoleOption {
  role: UserRole;
  title: string;
  description: string;
  emoji: string;
}

export const ROLE_OPTIONS: RoleOption[] = [
  {
    role: "user",
    title: "User",
    description: "Send and receive parcels securely across the network.",
    emoji: "🧑",
  },
  {
    role: "rider",
    title: "Rider",
    description: "Deliver parcels, optimize routes, and earn dynamically.",
    emoji: "🛵",
  },
  {
    role: "vendor",
    title: "Vendor",
    description: "Manage a Node/site, facilitate transfers, and build business.",
    emoji: "🏬",
  },
  // {
  //   role: "admin",
  //   title: "Admin",
  //   description: "Manage users, riders and vendors. Control the platform.",
  //   emoji: "🛡️",
  // },
];
