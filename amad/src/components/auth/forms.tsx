"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, registerAction, type AuthFormState } from "@/app/actions/auth";
import { Button, Field } from "@/components/ui";

function FormError({ state }: { state: AuthFormState }) {
  if (!state?.error) return null;
  return <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>;
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormError state={state} />
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="البريد الإلكتروني" name="email" type="email" autoComplete="email" required dir="ltr" defaultValue={state?.values?.email} error={state?.fields?.email} />
      <Field label="كلمة المرور" name="password" type="password" autoComplete="current-password" required dir="ltr" error={state?.fields?.password} />
      <Button type="submit" disabled={pending}>{pending ? "جارٍ التحقق…" : "تسجيل الدخول"}</Button>
      <p className="text-sm text-subtle">ليس لديك حساب؟ <Link href="/register" className="text-lime hover:underline">أنشئ حسابًا</Link></p>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, undefined);
  const v = state?.values ?? {};
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormError state={state} />
      <Field label="الاسم الكامل" name="name" autoComplete="name" required defaultValue={v.name} error={state?.fields?.name} />
      <Field label="البريد الإلكتروني" name="email" type="email" autoComplete="email" required dir="ltr" defaultValue={v.email} error={state?.fields?.email} />
      <Field label="كلمة المرور" name="password" type="password" autoComplete="new-password" required dir="ltr" hint="10 أحرف على الأقل، تتضمن حرفًا لاتينيًا ورقمًا" error={state?.fields?.password} />
      <Field label="اسم المنظمة أو الفريق" name="orgName" required defaultValue={v.orgName} error={state?.fields?.orgName} />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm text-silver">نوع الحساب</legend>
        {[
          ["INDIVIDUAL", "فرد", "تدريب شخصي"],
          ["ENTERPRISE", "مؤسسة", "فريق أمن أو جهة عمل"],
          ["UNIVERSITY", "جامعة", "برامج أكاديمية ومقررات"],
        ].map(([value, label, desc], i) => (
          <label key={value} className="flex cursor-pointer items-center gap-3 rounded-md border border-line-strong bg-surface-2 px-3 py-2.5 text-sm has-[:checked]:border-lime">
            <input type="radio" name="orgKind" value={value} defaultChecked={v.orgKind ? v.orgKind === value : i === 0} className="accent-[var(--amad-lime)]" />
            <span className="text-fg">{label}</span>
            <span className="text-xs text-subtle">{desc}</span>
          </label>
        ))}
      </fieldset>
      <Button type="submit" disabled={pending}>{pending ? "جارٍ الإنشاء…" : "إنشاء الحساب"}</Button>
      <p className="text-sm text-subtle">لديك حساب؟ <Link href="/login" className="text-lime hover:underline">سجّل الدخول</Link></p>
    </form>
  );
}
