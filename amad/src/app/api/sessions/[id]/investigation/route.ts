import { NextResponse } from "next/server";
import { withActor } from "@/server/http";
import { submitInvestigation } from "@/server/services/assessment";

export async function POST(request: Request, ctx: RouteContext<"/api/sessions/[id]/investigation">) {
  const { id } = await ctx.params;
  return withActor(request, async (actor) => {
    const body = await request.json().catch(() => null);
    const r = await submitInvestigation(actor, id, body);
    return NextResponse.json({ overall: r.readiness.overall, investigation: r.investigation.total, recommendationId: r.recommendationId });
  });
}
