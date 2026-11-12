import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic check only: bounce requests without a session cookie away from the
 * application area. The authoritative session + permission checks happen on the
 * server in every page, route handler and service call.
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has("amad_session")) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/app/:path*"] };
