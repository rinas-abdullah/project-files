import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { deviceOutboxKey } from "@/lib/crypto";

/** Hands the signed-in user their outbox encryption key. Never cached. */
export const GET = route({ rate: [30, 60_000] }, async ({ user }) => {
  return NextResponse.json({ key: deviceOutboxKey(user.id) }, { headers: { "Cache-Control": "no-store" } });
});
