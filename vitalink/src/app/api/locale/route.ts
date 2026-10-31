import { NextResponse, type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { locale } = (await req.json().catch(() => ({}))) as { locale?: string };
  const value = locale === "ar" ? "ar" : "en";
  const res = NextResponse.json({ ok: true, locale: value });
  res.cookies.set("vl-locale", value, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return res;
}
