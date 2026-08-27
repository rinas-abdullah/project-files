import { NextResponse } from "next/server";
import { validatePatientActivation } from "@/lib/auth/users";
import { completeSignup } from "@/lib/auth/signup";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mrn, email, phone, password } = body;

    if (!mrn || !password) {
      return NextResponse.json({ error: "رقم الملف الطبي وكلمة المرور مطلوبان" }, { status: 400 });
    }

    const validated = await validatePatientActivation({ mrn, email, phone, password });
    if (!validated.success) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const result = await completeSignup(validated.data);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    if (result.requiresVerification) {
      return NextResponse.json({
        success: true,
        requiresVerification: true,
        email: result.email,
        message: "أرسلنا رمز تحقق إلى بريدك الإلكتروني",
      });
    }

    const response = NextResponse.json({
      success: true,
      requiresVerification: false,
      message: "تم تفعيل حسابك بنجاح",
      user: result.user,
    });

    response.cookies.set(SESSION_COOKIE_NAME, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "حدث خطأ غير متوقع أثناء تفعيل الحساب" }, { status: 500 });
  }
}
