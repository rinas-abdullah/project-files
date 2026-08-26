import { NextResponse } from "next/server";
import { confirmEmailVerification } from "@/lib/auth/verification";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json({ error: "البريد الإلكتروني ورمز التحقق مطلوبان" }, { status: 400 });
    }

    const result = await confirmEmailVerification(String(email).trim().toLowerCase(), String(code).trim());
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const token = await createSessionToken(result.user);
    const response = NextResponse.json({
      success: true,
      message: "تم تفعيل الحساب بنجاح",
      user: result.user,
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "حدث خطأ غير متوقع أثناء التحقق" }, { status: 500 });
  }
}
