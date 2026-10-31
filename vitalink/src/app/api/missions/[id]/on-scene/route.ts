import { route } from "@/lib/api";
import { markOnScene } from "@/lib/services/encounters";

export const POST = route<unknown, { id: string }>({ permission: "case:create" }, async ({ user, params }) => {
  await markOnScene(user, params.id);
});
