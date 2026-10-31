import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import { Toaster } from "sonner";
import { getDict } from "@/lib/i18n";
import { I18nProvider } from "@/components/i18n-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const arabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600", "700"], variable: "--font-arabic", display: "swap" });

export const metadata: Metadata = {
  title: { default: "VitaLink — Ambulance ↔ Emergency Department", template: "%s · VitaLink" },
  description: "Direct, real-time link between ambulances and emergency departments.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0b1a33", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { t, locale, dir } = await getDict();
  return (
    <html lang={locale} dir={dir} className={`${inter.variable} ${arabic.variable}`}>
      <body className="min-h-screen">
        <I18nProvider value={{ t, locale }}>{children}</I18nProvider>
        <Toaster position={dir === "rtl" ? "top-left" : "top-right"} richColors closeButton dir={dir} />
      </body>
    </html>
  );
}
