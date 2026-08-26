import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password, role } = body;

    if (!identifier) {
      return NextResponse.json(
        { error: "يرجى إدخال البريد الإلكتروني أو رقم الملف (MRN)" },
        { status: 400 }
      );
    }

    // Role-based profiles
    let user;
    if (role === "doctor" || identifier.toLowerCase().includes("doc")) {
      user = {
        id: "doc-1",
        name: "د. خالد السليمان",
        role: "doctor",
        email: identifier.includes("@") ? identifier : "dr.khalid@dithar.sa",
        department: "استشاري جراحة الأوعية الدموية والقدم السكرية",
        hospital: "مدينة الملك عبدالعزيز الطبية",
      };
    } else if (role === "hospital_admin" || identifier.toLowerCase().includes("admin") || identifier.toLowerCase().includes("hosp")) {
      user = {
        id: "admin-1",
        name: "إدارة المنشأة — مستشفى الملك فيصل التخصصي",
        role: "hospital_admin",
        email: identifier.includes("@") ? identifier : "admin@kfshrc.edu.sa",
        department: "إدارة التحول الرقمي وأسطول الأجهزة الطبية",
        hospital: "مستشفى الملك فيصل التخصصي ومركز الأبحاث",
      };
    } else {
      user = {
        id: "pat-1",
        name: "سارة بنت أحمد العتيبي",
        role: "patient",
        mrn: "#DH-8812",
        email: identifier.includes("@") ? identifier : "sara.alotaibi@dithar.sa",
        deviceId: "DITHAR-PAD-9842",
        hospital: "مدينة الملك فهد الطبية",
      };
    }

    const response = NextResponse.json({
      success: true,
      message: "تم تسجيل الدخول بنجاح",
      user,
    });

    // Set cookie for session
    response.cookies.set("dithar_session_token", Buffer.from(JSON.stringify(user)).toString("base64"), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع أثناء معالجة الطلب" },
      { status: 500 }
    );
  }
}
