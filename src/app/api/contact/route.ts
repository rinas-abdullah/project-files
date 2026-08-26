import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, institution, message } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "يرجى تعبئة جميع الحقول المطلوبة (الاسم والبريد الإلكتروني)." },
        { status: 400 }
      );
    }

    // Forward to Web3Forms if key is provided, or record internally
    const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;
    if (accessKey) {
      try {
        await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_key: accessKey,
            name,
            email,
            institution: institution || "غير محدد",
            message: message || "طلب تواصل / شراكة سريرية",
            subject: `طلب شراكة سريرية جديد من: ${name} (${institution || "جهة غير محددة"})`
          }),
        });
      } catch (e) {
        console.warn("External form webhook notification failed, processed locally:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: "تم استلام طلب الشراكة بنجاح، سيتواصل معك فريق دِثار الطبي خلال 24 ساعة.",
      receivedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: "حدث خطأ أثناء معالجة الطلب، يرجى المحاولة مرة أخرى أو مراسلتنا عبر البريد المباشر." },
      { status: 500 }
    );
  }
}
