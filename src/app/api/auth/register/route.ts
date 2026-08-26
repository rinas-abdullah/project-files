import { NextResponse } from "next/server";
import { registerDoctor } from "@/lib/auth/users";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, password, department, hospital } = body;

    if (!name || !password) {
      return NextResponse.json({ error: "الاسم وكلمة المرور مطلوبان" }, { status: 400 });
    }

    const result = await registerDoctor({ name, email, phone, password, department, hospital });
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const token = await createSessionToken(result.user);
    const response = NextResponse.json({
      success: true,
      message: "تم إنشاء الحساب بنجاح",
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
    return NextResponse.json({ error: "حدث خطأ غير متوقع أثناء إنشاء الحساب" }, { status: 500 });
  }
}
