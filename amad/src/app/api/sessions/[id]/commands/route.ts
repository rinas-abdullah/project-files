import { NextResponse } from "next/server";
import { withActor } from "@/server/http";
import { executeCommand } from "@/server/services/simulation";

export async function POST(request: Request, ctx: RouteContext<"/api/sessions/[id]/commands">) {
  const { id } = await ctx.params;
  return withActor(request, async (actor) => {
    const body = (await request.json().catch(() => null)) as { command?: unknown } | null;
    const r = await executeCommand(actor, id, body?.command);
    return NextResponse.json({ output: r.output, phase: r.state.phase, outcome: r.state.outcome, minute: r.state.minute });
  });
}
