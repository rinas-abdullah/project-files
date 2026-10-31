"use client";
import { createContext, useContext } from "react";
import type { Dict } from "@/lib/i18n/en";

type Ctx = { t: Dict; locale: "en" | "ar" };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ value, children }: { value: Ctx; children: React.ReactNode }) {
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const v = useContext(I18nContext);
  if (!v) throw new Error("I18nProvider missing");
  return v;
}
