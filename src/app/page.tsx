import dynamic from "next/dynamic";
import {
  Hero,
  HealthcareGap,
  IntroducingDithar,
  AiEngine,
  PatientJourney,
  UseCases,
  WhyDithar,
  BusinessModel,
  MarketOpportunity,
  Roadmap,
  Team,
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
        {/* 12. Business Model */}
        <BusinessModel />
        {/* 13. Market Opportunity */}
        <MarketOpportunity />
        {/* 14. Roadmap */}
        <Roadmap />
        {/* 15. Team */}
        <Team />
        {/* 16. Contact & CTA */}
        <Contact />
        {/* 17. Footer */}
        <Footer />
      </main>
    </>
  );
}
