import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Hero,
  HealthcareGap,
  IntroducingDithar,
  DeviceSpecs,
  AiEngine,
  PatientJourney,
  UseCases,
  WhyDithar,
  Roadmap,
  Contact,
  Footer,
} from "@/components/sections";
import { ScrollProgress } from "@/components/ui/scroll-progress";

// Dynamically import heavy interactive sections for performance
const SmartInsoleExplodedView = dynamic(() => import("@/components/sections/SmartInsoleExplodedView"), {
  ssr: true,
  loading: () => <div className="w-full min-h-[400px] flex items-center justify-center text-slate-400 font-arabic text-sm">جاري تحميل العرض التفكيكي...</div>
});

const HowItWorks = dynamic(() => import("@/components/sections/HowItWorks"), {
  ssr: true,
});

const DigitalTwin = dynamic(() => import("@/components/sections/DigitalTwin"), {
  ssr: true,
});

const PlatformDashboard = dynamic(() => import("@/components/sections/PlatformDashboard"), {
  ssr: true,
  loading: () => <div className="w-full min-h-[500px] flex items-center justify-center text-slate-400 font-arabic text-sm">جاري تهيئة لوحة التحكم السريرية...</div>
});

export default function Home() {
  return (
    <>
      {/* Global UI Elements */}
      <ScrollProgress />

      <main className="w-full flex flex-col items-center">
        {/* 1. Immersive Hero Experience */}
        <Hero />
        {/* 2. The Healthcare Gap */}
        <HealthcareGap />
        {/* 3. Introducing Dithar Smart PAD */}
        <IntroducingDithar />
        {/* 3b. Device Technical Specifications */}
        <DeviceSpecs />
        {/* 4. Exploded Product Experience */}
        <SmartInsoleExplodedView />
        {/* 5. How Dithar Works */}
        <HowItWorks />
        {/* 6. Digital Twin Experience */}
        <DigitalTwin />
        {/* 7. AI Engine */}
        <AiEngine />
        {/* 8. Platform Dashboard */}
        <PlatformDashboard />
        {/* 9. Patient Journey */}
        <PatientJourney />
        {/* 10. Use Cases */}
        <UseCases />
        {/* 11. Why Dithar */}
        <WhyDithar />
        {/* 12. Investors CTA (full business model & market sizing moved to /investors) */}
        <div className="w-full flex flex-col items-center py-16 px-6">
          <Link
            href="/investors"
            className="group inline-flex items-center gap-3 px-7 py-4 rounded-full bg-primary-blue hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-900/20 hover:scale-105 transition-all"
          >
            <span>نموذج العمل وحجم السوق والفرصة الاستثمارية بالتفصيل</span>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>
        {/* 13. Roadmap */}
        <Roadmap />
        {/* 14. Contact & CTA */}
        <Contact />
        {/* 15. Footer */}
        <Footer />
      </main>
    </>
  );
}
