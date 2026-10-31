import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";
import { getCurrentUser, type CurrentUser } from "@/lib/session";
import { can, type Permission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { ApiError } from "@/lib/services/core";
import { IntegrationUnavailableError } from "@/lib/integrations/registry";

type Ctx<P> = { params: Promise<P> };

export type HandlerArgs<B, P> = { user: CurrentUser; body: B; params: P; req: NextRequest };

/**
 * Protected API route wrapper: authentication, RBAC, same-origin check for
 * mutations (CSRF), per-user rate limiting, Zod validation and error mapping.
 */
export function route<B = unknown, P = Record<string, string>>(
  opts: { permission?: Permission | Permission[]; schema?: ZodType<B>; rate?: [number, number]; multipart?: boolean },
  fn: (args: HandlerArgs<B, P>) => Promise<unknown>,
) {
  return async (req: NextRequest, ctx: Ctx<P>) => {
    try {
      const user = await getCurrentUser();
      if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
      const perms = opts.permission ? (Array.isArray(opts.permission) ? opts.permission : [opts.permission]) : [];
      if (perms.length && !perms.some((p) => can(user.role, p))) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

      if (req.method !== "GET" && req.method !== "HEAD") {
        const origin = req.headers.get("origin");
        const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
        if (origin && host && new URL(origin).host !== host) return NextResponse.json({ error: "BAD_ORIGIN" }, { status: 403 });
      }
      const [limit, windowMs] = opts.rate ?? [120, 60_000];
      const rl = rateLimit(`api:${user.id}:${req.nextUrl.pathname.split("/").slice(0, 3).join("/")}`, limit, windowMs);
      if (!rl.ok) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });

      let body = undefined as B;
      if (opts.schema && !opts.multipart) {
        const json = await req.json().catch(() => ({}));
        body = opts.schema.parse(json);
      }
      const params = (await ctx.params) as P;
      const result = await fn({ user, body, params, req });
      if (result instanceof Response) return result;
      return NextResponse.json(result ?? { ok: true });
    } catch (err) {
      if (err instanceof ZodError) return NextResponse.json({ error: "VALIDATION", issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 422 });
      if (err instanceof ApiError) return NextResponse.json({ error: err.code, message: err.message }, { status: err.status });
      if (err instanceof IntegrationUnavailableError) return NextResponse.json({ error: "INTEGRATION_NOT_CONNECTED", integration: err.key, status: err.status }, { status: 503 });
      console.error("[api]", err);
      return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
    }
  };
}
