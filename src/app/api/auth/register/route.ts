import { NextResponse } from "next/server";
import { validateRegistration, createDoctorDirectly } from "@/lib/auth/users";
import { startEmailVerification } from "@/lib/auth/verification";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, password, department, hospital } = body;

    if (!name || !password) {
      return NextResponse.json({ error: "الاسم وكلمة المرور مطلوبان" }, { status: 400 });
    }

    const validated = await validateRegistration({ name, email, phone, password, department, hospital });
    if (!validated.success) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    // Email registrations require verifying a real code sent to that inbox
    // before the account is created. Phone-only registrations are created
    // immediately — there's no free way to send a real SMS code yet.
    if (validated.data.email) {
      const { email: verifiedEmail, ...pendingPayload } = validated.data;
      const started = await startEmailVerification(verifiedEmail, pendingPayload);
      if (!started.success) {
        return NextResponse.json({ error: started.error }, { status: 502 });
      }
      return NextResponse.json({
        success: true,
        requiresVerification: true,
        email: verifiedEmail,
        message: "أرسلنا رمز تحقق إلى بريدك الإلكتروني",
      });
    }

    const user = await createDoctorDirectly(validated.data);
    const token = await createSessionToken(user);
    const response = NextResponse.json({
      success: true,
      requiresVerification: false,
      message: "تم إنشاء الحساب بنجاح",
      user,
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
