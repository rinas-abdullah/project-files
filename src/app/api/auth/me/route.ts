import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME);

    if (!token?.value) {
      return NextResponse.json({ user: null, authenticated: false }, { status: 200 });
    }

    const user = await verifySessionToken(token.value);
    if (!user) {
      return NextResponse.json({ user: null, authenticated: false }, { status: 200 });
    }

    return NextResponse.json({ user, authenticated: true });
  } catch {
    return NextResponse.json({ error: "Failed to verify session" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const response = NextResponse.json({ success: true, message: "تم تسجيل الخروج بنجاح" });
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  } catch {
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
