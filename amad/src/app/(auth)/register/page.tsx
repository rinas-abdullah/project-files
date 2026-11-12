import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/forms";
import { getActor } from "@/server/auth/session";

export const metadata: Metadata = { title: "إنشاء حساب" };

export default async function RegisterPage() {
  if (await getActor()) redirect("/app");
  return (
    <>
      <h1 className="text-2xl font-semibold">إنشاء حساب</h1>
      <p className="mb-8 mt-2 text-sm text-silver">يُنشأ حسابك مع مساحة منظمة خاصة بك تكون أنت مسؤولها.</p>
      <RegisterForm />
    </>
  );
}
