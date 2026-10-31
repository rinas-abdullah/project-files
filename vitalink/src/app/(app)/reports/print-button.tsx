"use client";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

export function PrintButton() {
  const { t } = useI18n();
  return (
    <Button variant="outline" onClick={() => window.print()}>
      <Printer /> {t.common.print}
    </Button>
  );
}
