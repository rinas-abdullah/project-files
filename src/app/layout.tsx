import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import LenisProvider from "@/components/LenisProvider";
import { FloatingHeader } from "@/components/ui/floating-header";
import { Component as EtherealShadow } from "@/components/ui/etheral-shadow";
import { ToastProvider } from "@/components/ui/use-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
 });
 
 const ibmArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-arabic",
  display: "swap",
 });

export const metadata: Metadata = {
  metadataBase: new URL("https://dithar.sa"),
  title: "دِثار | Dithar — منصة الرعاية الرقمية واللباد الطبي الذكي",
  description: "منصة دِثار للرعاية الصحية الذكية المدعومة باللباد الطبي الذكي (Smart PAD) وخوارزميات الذكاء الاصطناعي السريري للمراقبة الوظيفية المستمرة والوقاية من المضاعفات.",
  keywords: [
    "Dithar",
    "دثار",
    "Smart PAD",
    "اللباد الطبي الذكي",
    "MedTech",
    "Digital Care Platform",
    "الرعاية الصحية الرقمية",
    "Healthcare AI",
    "Remote Patient Monitoring",
    "تحليل توزيع الضغط",
    "Pressure Heatmap"
  ],
  authors: [{ name: "Dithar Health Technologies" }],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "دِثار | Dithar — منصة الرعاية الرقمية واللباد الطبي الذكي",
    description: "منظومة دِثار المتكاملة لمراقبة صحة القدم وتوزيع الضغط والحرارة عبر اللباد الطبي الذكي والذكاء الاصطناعي السريري.",
    url: "https://dithar.sa",
    siteName: "دِثار | Dithar",
    images: [{ url: "/logo.png" }],
    locale: "ar_SA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "دِثار | Dithar — منصة الرعاية الرقمية واللباد الطبي الذكي",
    description: "منظومة دِثار المتكاملة لمراقبة صحة القدم وتوزيع الضغط والحرارة عبر اللباد الطبي الذكي والذكاء الاصطناعي السريري.",
    creator: "@DitharHealth",
    site: "@DitharHealth",
    images: ["/logo.png"],
  },
  alternates: {
    canonical: "https://dithar.sa",
  },
};
 
 export default function RootLayout({
   children,
 }: Readonly<{
   children: React.ReactNode;
 }>) {
   return (
     <html
       lang="ar"
       dir="rtl"
       className={`${inter.variable} ${ibmArabic.variable} h-full antialiased scroll-smooth`}
     >
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="shortcut icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
       <body className="min-h-full flex flex-col font-arabic bg-(--background) text-dark-text overflow-x-hidden selection:bg-medical-blue selection:text-white relative transition-colors duration-300">
         {/* Ethereal shadow — fixed, covers all sections, very subtle on white */}
         <div className="fixed inset-0 z-0 pointer-events-none select-none opacity-[0.07]">
           <EtherealShadow
             color="rgba(11, 77, 141, 0.55)"
             animation={{ scale: 55, speed: 12 }}
             noise={{ opacity: 0.12, scale: 1.0 }}
             sizing="fill"
             showText={false}
           />
         </div>
         <LenisProvider>
           <ToastProvider>
             <FloatingHeader />
             <div className="relative z-10 w-full flex flex-col">
               {children}
             </div>
           </ToastProvider>
         </LenisProvider>
       </body>
     </html>
   );
 }
