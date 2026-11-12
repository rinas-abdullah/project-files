import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const arabic = IBM_Plex_Sans_Arabic({ variable: "--font-arabic", subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700"] });
const mono = IBM_Plex_Mono({ variable: "--font-mono-plex", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: { default: "أَمَد | AMAD — نحو جاهزية تسبق التهديد", template: "%s · أَمَد AMAD" },
  description: "AMAD — Adaptive Cyber Readiness & Intelligence Platform. خصم ذكي متكيّف، محاكاة دفاعية تحت الضغط، تحقيق جنائي رقمي، وقياس سلوكي للجاهزية.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${arabic.variable} ${mono.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
