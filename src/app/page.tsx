import { redirect } from "next/navigation";
import { ROUTES } from "@/core/config/constants";

/**
 * Root route — redirects to the role-select onboarding entry point.
 * Once auth state is checked client-side, screens like Dashboard
 * handle redirecting an already-authenticated user past onboarding.
 */
export default function RootPage() {
  redirect(ROUTES.roleSelect);
}
