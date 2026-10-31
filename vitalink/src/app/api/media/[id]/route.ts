import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { prisma } from "@/lib/db";
import { ApiError, scopedEncounter } from "@/lib/services/core";
import { readMedia } from "@/lib/media";
import { audit } from "@/lib/audit";

const g = globalThis as unknown as { __vlMediaSeen?: Map<string, number> };
const seen = (g.__vlMediaSeen ??= new Map());

/** Protected media delivery: tenant-scoped, audited ("Media viewed"), never public. */
export const GET = route<unknown, { id: string }>({ permission: "media:read", rate: [300, 60_000] }, async ({ user, params }) => {
  const media = await prisma.mediaAttachment.findUnique({ where: { id: params.id } });
  if (!media) throw new ApiError(404, "NOT_FOUND");
  await scopedEncounter(user, media.encounterId);
  const buf = await readMedia(media.storageKey).catch(() => null);
  if (!buf) throw new ApiError(404, "NOT_FOUND");
  const k = `${user.id}:${media.id}`;
  if ((seen.get(k) ?? 0) < Date.now() - 10 * 60_000) {
    seen.set(k, Date.now());
    await audit({ id: user.id, email: user.email, role: user.role, organizationId: user.organizationId }, "media.viewed", "MediaAttachment", media.id, undefined, { encounterId: media.encounterId });
  }
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": media.mimeType,
      "Content-Length": String(buf.length),
      "Cache-Control": "private, no-store",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; media-src 'self'; sandbox",
    },
  });
});
