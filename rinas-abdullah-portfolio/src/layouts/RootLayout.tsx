import { Suspense } from "react";
import { Outlet } from "react-router";
import { MotionConfig } from "motion/react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ScrollManager } from "./ScrollManager";

export function RootLayout() {
  return (
    <MotionConfig reducedMotion="user">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <ScrollManager />
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        <Suspense fallback={<div className="min-h-[100svh]" aria-busy="true" />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </MotionConfig>
  );
}
