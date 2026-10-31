import { route } from "@/lib/api";
import { sendPreAlert } from "@/lib/services/encounters";

export const POST = route<unknown, { id: string }>({ permission: "case:clinical_write" }, async ({ user, params }) => sendPreAlert(user, params.id));
