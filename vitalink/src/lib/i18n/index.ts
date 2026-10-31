import "server-only";
import { cookies } from "next/headers";
import { en, type Dict } from "./en";
import { ar } from "./ar";

export type Locale = "en" | "ar";
export const LOCALE_COOKIE = "vl-locale";

export async function getLocale(): Promise<Locale> {
  const c = (await cookies()).get(LOCALE_COOKIE)?.value;
  return c === "ar" ? "ar" : "en";
}

export async function getDict(): Promise<{ t: Dict; locale: Locale; dir: "rtl" | "ltr" }> {
  const locale = await getLocale();
  return { t: locale === "ar" ? ar : en, locale, dir: locale === "ar" ? "rtl" : "ltr" };
}

export { fmt } from "./format";
