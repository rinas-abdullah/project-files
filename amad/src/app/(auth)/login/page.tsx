import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/forms";
import { getActor } from "@/server/auth/session";

export const metadata: Metadata = { title: "تسجيل الدخول" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getActor()) redirect("/app");
  const { next } = await searchParams;
  return (
    <>
      <h1 className="text-2xl font-semibold">تسجيل الدخول</h1>
      <p className="mb-8 mt-2 text-sm text-silver">ادخل إلى مركز قيادة أَمَد لمتابعة تدريبك وجاهزيتك.</p>
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </>
  );
}
