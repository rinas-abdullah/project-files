import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getPatients, createPatient } from "@/lib/data/patients";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await verifySessionToken(token) : null;

  if (!user) {
    return NextResponse.json({ error: "غير مصرح لك بالوصول" }, { status: 401 });
  }
  if (user.role !== "doctor" && user.role !== "hospital_admin") {
    return NextResponse.json({ error: "لا تملك صلاحية الوصول لهذه البيانات" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  const filtered = await getPatients({ status, search });

  return NextResponse.json({
    success: true,
    total: filtered.length,
    patients: filtered
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await verifySessionToken(token) : null;

  if (!user) {
    return NextResponse.json({ error: "غير مصرح لك بالوصول" }, { status: 401 });
  }
  // Only clinicians create real clinical records; patients only ever link
  // credentials to one via /portal/patient/activate, never create their own.
  if (user.role !== "doctor") {
    return NextResponse.json({ error: "لا تملك صلاحية إضافة سجل مريض" }, { status: 403 });
  }

  const body = await request.json();
  const { name, age, diagnosis, careType } = body;

  if (!name || !age || !diagnosis || !careType) {
    return NextResponse.json(
      { error: "الاسم والعمر والتشخيص ونوع الرعاية مطلوبة" },
      { status: 400 }
    );
  }

  const ageNum = Number(age);
  if (!Number.isFinite(ageNum) || ageNum <= 0 || ageNum > 130) {
    return NextResponse.json({ error: "العمر غير صحيح" }, { status: 400 });
  }

  const patient = await createPatient({
    name: String(name).trim(),
    age: ageNum,
    diagnosis: String(diagnosis).trim(),
    careType: String(careType).trim(),
    consultant: user.name,
  });

  return NextResponse.json({
    success: true,
    message: "تم إنشاء السجل الطبي بنجاح",
    patient,
  });
}
