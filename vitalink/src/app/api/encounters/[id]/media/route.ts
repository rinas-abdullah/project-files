import { route } from "@/lib/api";
import { ApiError, scopedEncounter } from "@/lib/services/core";
import { recordMedia } from "@/lib/services/encounters";
import { ALLOWED, sniff, storeMedia } from "@/lib/media";
import { MEDIA_CATEGORY } from "@/lib/validation/schemas";

export const POST = route<unknown, { id: string }>({ permission: "media:upload", multipart: true, rate: [30, 60_000] }, async ({ user, params, req }) => {
  const enc = await scopedEncounter(user, params.id);
  if (["COMPLETED", "CANCELLED"].includes(enc.status)) throw new ApiError(409, "ENCOUNTER_CLOSED");
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new ApiError(422, "VALIDATION");
  const spec = ALLOWED[file.type];
  if (!spec) throw new ApiError(415, "MEDIA_TYPE");
  if (file.size > spec.max) throw new ApiError(413, "MEDIA_SIZE");
  const buf = Buffer.from(await file.arrayBuffer());
  if (!sniff(buf, file.type)) throw new ApiError(415, "MEDIA_TYPE");
  const category = MEDIA_CATEGORY.parse(form.get("category") ?? "OTHER");
  const caption = String(form.get("caption") ?? "").slice(0, 300) || undefined;
  const key = await storeMedia(enc.id, buf, spec.ext);
  const row = await recordMedia(user, enc.id, { kind: spec.kind, category, mimeType: file.type, sizeBytes: file.size, storageKey: key, originalName: file.name.slice(0, 120), caption });
  return { id: row.id };
});
