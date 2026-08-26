import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/portal/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await verifySessionToken(token) : null;

  if (!user) {
    const loginUrl = new URL("/portal/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // This is an optimistic, route-level check (per Next.js's Proxy guidance);
  // the API routes re-verify the session and role independently — Proxy is
  // not the actual authorization boundary, just a fast redirect for UX.
  const roleHome: Record<string, string> = {
    patient: "/portal/patient",
    doctor: "/portal/doctor",
    hospital_admin: "/portal/hospital",
  };

  const allowedForDoctor = pathname.startsWith("/portal/doctor") || pathname.startsWith("/portal/patient/");
  const isAllowed =
    (user.role === "patient" && pathname.startsWith("/portal/patient")) ||
    (user.role === "doctor" && allowedForDoctor) ||
    (user.role === "hospital_admin" && pathname.startsWith("/portal/hospital"));

  if (!isAllowed) {
    return NextResponse.redirect(new URL(roleHome[user.role] ?? "/portal/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*"],
};
