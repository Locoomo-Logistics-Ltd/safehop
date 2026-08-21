import { redirect } from "next/navigation";
import { ROUTES } from "@/core/config/constants";

/** `/admin` redirects straight to the dashboard, same pattern as the root `/` route. */
export default function AdminRootPage() {
  redirect(ROUTES.adminDashboard);
}
