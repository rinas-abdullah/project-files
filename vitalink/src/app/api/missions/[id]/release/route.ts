import { route } from "@/lib/api";
import { releaseAmbulance } from "@/lib/services/encounters";

export const POST = route<unknown, { id: string }>({ permission: "ambulance:release" }, async ({ user, params }) => {
  await releaseAmbulance(user, params.id);
});
