import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("dithar_session_token");

    if (!token?.value) {
      return NextResponse.json({ user: null, authenticated: false }, { status: 200 });
    }

    try {
      const decoded = Buffer.from(token.value, "base64").toString("utf-8");
      const user = JSON.parse(decoded);
      return NextResponse.json({ user, authenticated: true });
    } catch {
      return NextResponse.json({ user: null, authenticated: false }, { status: 200 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to verify session" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const response = NextResponse.json({ success: true, message: "تم تسجيل الخروج بنجاح" });
    response.cookies.delete("dithar_session_token");
    return response;
  } catch (error) {
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
