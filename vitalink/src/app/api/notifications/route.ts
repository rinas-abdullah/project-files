import { NextResponse } from "next/server";
import type { z } from "zod";
import { route } from "@/lib/api";
import { prisma } from "@/lib/db";
import { notificationsSchema } from "@/lib/validation/schemas";

export const GET = route({}, async ({ user, req }) => {
  const unread = await prisma.notification.count({ where: { userId: user.id, readAt: null } });
  if (req.nextUrl.searchParams.get("count")) return NextResponse.json({ unread });
  const items = await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 30 });
  return { unread, items };
});

export const POST = route<z.infer<typeof notificationsSchema>>({ schema: notificationsSchema }, async ({ user, body }) => {
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null, ...(body.all ? {} : { id: { in: body.ids ?? [] } }) },
    data: { readAt: new Date() },
  });
});
