"use client";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

export function LangToggle({ className }: { className?: string }) {
  const { locale } = useI18n();
  const router = useRouter();
  return (
    <button
      data-testid="lang-switch"
      className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium", className)}
      onClick={async () => {
        await fetch("/api/locale", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale: locale === "ar" ? "en" : "ar" }) });
        router.refresh();
      }}
    >
      <Languages className="size-4" />
      {locale === "ar" ? "English" : "العربية"}
    </button>
  );
}
