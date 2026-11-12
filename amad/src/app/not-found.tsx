import { ButtonLink, Wordmark } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <Wordmark />
      <h1 className="text-xl font-semibold">الصفحة غير موجودة</h1>
      <p className="text-sm text-silver">قد يكون الرابط غير صحيح أو أنك لا تملك صلاحية الوصول إليه.</p>
      <ButtonLink href="/" variant="secondary">العودة للرئيسية</ButtonLink>
    </main>
  );
}
