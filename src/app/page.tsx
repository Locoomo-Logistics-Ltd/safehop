import { redirect } from "next/navigation";
import { ROUTES } from "@/core/config/constants";

/**
 * Root route — redirects to login, the app's primary entry point (fewer
 * clicks for returning users). New users reach role-select/create-account
 * via the "Sign up" link on the login screen instead.
 */
export default function RootPage() {
  redirect(ROUTES.login);
}
