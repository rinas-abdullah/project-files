import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BusinessModel, MarketOpportunity, Footer } from "@/components/sections";

export const metadata: Metadata = {
  title: "للمستثمرين | دِثار — Dithar for Investors",
  description: "نموذج العمل وحجم السوق والفرصة الاستثمارية لمنصة دِثار الصحية الذكية.",
};

export default function InvestorsPage() {
  return (
    <main className="w-full flex flex-col items-center">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 pt-32 pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-blue hover:text-blue-700 transition-colors font-arabic"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للصفحة الرئيسية
        </Link>
        <h1 className="mt-6 text-3xl sm:text-4xl md:text-5xl font-bold font-arabic leading-tight unified-typography">
          الفرصة الاستثمارية في دِثار
        </h1>
        <p className="mt-4 text-sm md:text-base text-muted-text font-light leading-relaxed max-w-2xl font-arabic">
          نموذج العمل، حجم السوق، والفرصة الاستثمارية بالتفصيل — مخصصة للمستثمرين وشركاء النمو.
        </p>
      </div>

      <BusinessModel />
      <MarketOpportunity />
      <Footer />
    </main>
  );
}
