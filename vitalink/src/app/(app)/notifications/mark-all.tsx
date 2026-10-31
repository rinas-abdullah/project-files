"use client";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";
import { api } from "@/lib/client-api";

export function MarkAllRead() {
  const { t } = useI18n();
  const router = useRouter();
  return (
    <Button
      variant="outline"
      onClick={async () => {
        await api("/api/notifications", { all: true });
        router.refresh();
      }}
    >
      <CheckCheck /> {t.common.markAllRead}
    </Button>
  );
}
