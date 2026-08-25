import type { ComponentType } from "react";
import { User, Bike, Building2 } from "lucide-react";
import type { UserRole } from "@/core/types";

export interface RoleOption {
  role: UserRole;
  title: string;
  description: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

export const ROLE_OPTIONS: RoleOption[] = [
  {
    role: "consumer",
    title: "User",
    description: "Send and receive parcels securely across the network.",
    icon: User,
  },
  {
    role: "rider",
    title: "Rider",
    description: "Deliver parcels, optimize routes, and earn dynamically.",
    icon: Bike,
  },
  {
    role: "node_operator",
    // title: "Node Operator",
    title: "Pickup Station",
    description: "Manage a Node/site, facilitate transfers, and build business.",
    icon: Building2,
  },
  // {
  //   role: "admin",
  //   title: "Admin",
  //   description: "Manage users, riders and vendors. Control the platform.",
  //   icon: ShieldCheck,
  // },
];
