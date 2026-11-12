"use client";

import { Button } from "@/components/ui";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto mt-16 max-w-md rounded-lg border border-line bg-surface p-6 text-center">
      <h2 className="text-lg font-semibold">حدث خطأ غير متوقع</h2>
      <p className="mt-2 text-sm text-silver">لم تُفقد أي بيانات: حالة الجلسات محفوظة على الخادم. يمكنك إعادة المحاولة.</p>
      <Button className="mt-4" onClick={reset}>إعادة المحاولة</Button>
    </div>
  );
}
