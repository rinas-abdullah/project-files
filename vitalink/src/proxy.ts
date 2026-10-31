import { NextResponse, type NextRequest } from "next/server";

const PUBLIC = ["/", "/login"];

/**
 * Optimistic auth gate: redirect visitors without a session cookie away from
 * protected pages. Real authorization happens server-side on every page/API
 * (getCurrentUser + RBAC + tenant scope).
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.includes(pathname) || pathname.startsWith("/api/") || pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }
  const hasSession = req.cookies.has("authjs.session-token") || req.cookies.has("__Secure-authjs.session-token");
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
