import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getPatientById, addMedicalNote, updateRecommendation } from "@/lib/data/patients";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await verifySessionToken(token) : null;

  if (!user) {
    return NextResponse.json({ error: "غير مصرح لك بالوصول" }, { status: 401 });
  }

  const { id } = await params;

  // Patients may only view their own record; clinicians may view any patient.
  if (user.role === "patient" && user.id !== id) {
    return NextResponse.json({ error: "لا تملك صلاحية الوصول لهذا السجل" }, { status: 403 });
  }

  const patient = await getPatientById(id);
  if (!patient) {
    return NextResponse.json({ error: "المريض غير موجود" }, { status: 404 });
  }

  return NextResponse.json({ success: true, patient });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await verifySessionToken(token) : null;

  if (!user) {
    return NextResponse.json({ error: "غير مصرح لك بالوصول" }, { status: 401 });
  }
  // Only clinicians may write medical notes or recommendations.
  if (user.role !== "doctor") {
    return NextResponse.json({ error: "لا تملك صلاحية تعديل هذا السجل" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await getPatientById(id);
  if (!existing) {
    return NextResponse.json({ error: "المريض غير موجود" }, { status: 404 });
  }

  const body = await request.json();

  if (body.type === "add_note" && body.content) {
    const patient = await addMedicalNote(id, user.name, body.content);
    return NextResponse.json({
      success: true,
      message: "تم حفظ الملاحظة السريرية بنجاح",
      patient
    });
  }

  if (body.type === "update_recommendation" && body.recommendation) {
    const patient = await updateRecommendation(id, body.recommendation);
    return NextResponse.json({
      success: true,
      message: "تم تحديث التوصية الطبية",
      patient
    });
  }

  return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
}
