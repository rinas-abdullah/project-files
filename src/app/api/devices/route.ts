import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getDevices, getHospitalStats, retireDevice, reactivateDevice } from "@/lib/data/devices";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await verifySessionToken(token) : null;

  if (!user) {
    return NextResponse.json({ error: "غير مصرح لك بالوصول" }, { status: 401 });
  }
  if (user.role !== "hospital_admin") {
    return NextResponse.json({ error: "لا تملك صلاحية الوصول لهذه البيانات" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? undefined;
  const location = searchParams.get("location") ?? undefined;

  const [devices, stats] = await Promise.all([
    getDevices({ search, location }),
    getHospitalStats(),
  ]);

  return NextResponse.json({ success: true, devices, stats });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await verifySessionToken(token) : null;

  if (!user) {
    return NextResponse.json({ error: "غير مصرح لك بالوصول" }, { status: 401 });
  }
  if (user.role !== "hospital_admin") {
    return NextResponse.json({ error: "لا تملك صلاحية تعديل هذه البيانات" }, { status: 403 });
  }

  const body = await request.json();
  const { id, action } = body as { id?: string; action?: string };

  if (!id || (action !== "retire" && action !== "reactivate")) {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const device = action === "retire" ? await retireDevice(id) : await reactivateDevice(id);
  if (!device) {
    return NextResponse.json({ error: "الجهاز غير موجود" }, { status: 404 });
  }

  return NextResponse.json({ success: true, device });
}
