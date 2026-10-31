import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { homeFor } from "@/lib/rbac";

export default async function AppHome() {
  const user = await requireUser();
  redirect(homeFor(user.role));
}
