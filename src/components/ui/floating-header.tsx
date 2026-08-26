"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import Image from "next/image";


const navItems = [
  { name: "المنتج", href: "#introducing" },
  { name: "كيف يعمل", href: "#workflow" },
  { name: "الذكاء الاصطناعي", href: "#ai-engine" },
  { name: "الفريق", href: "#team" },
  { name: "تواصل معنا", href: "#contact" },
];

export function FloatingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [lang] = useState<"ar" | "en">("ar");
  const pathname = usePathname();

  useEffect(() => {
    const sectionIds = navItems.map((item) => item.href.replace("#", ""));
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { threshold: 0.3 }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  const scrollTo = (href: string) => {
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
    setMobileOpen(false);
  };


  if (pathname?.startsWith("/portal")) {
    return null;
  }

  return (
    <>
      {/* Desktop Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 inset-x-0 z-50 hidden md:flex items-center justify-center px-6 pt-5"
      >
        <motion.div
          layout
          className={cn(
            "flex items-center justify-between w-full max-w-7xl mx-auto px-5 py-2.5 rounded-xl transition-all duration-500",
            "bg-white/5 dark:bg-black/5 backdrop-blur-xl",
            "border border-white/10 dark:border-gray-700/10",
            "shadow-md"
          )}
        >
          {/* Left: Logo (clickable) */}
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <Image
              src="/logo-icon.png"
              alt="دِثار — Dithar"
              width={26}
              height={26}
              className="object-contain dark:hidden"
              style={{ height: "auto" }}
              priority
            />
            <Image
              src="/logo-icon-white.png"
              alt="دِثار — Dithar"
              width={26}
              height={26}
              className="object-contain hidden dark:block"
              style={{ height: "auto" }}
              priority
            />
            <span className="text-[16px] font-bold text-primary-blue dark:text-medical-blue font-arabic leading-none">
              دِثار
            </span>
          </div>


          {/* Center: Nav Links (always visible) */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollTo(item.href)}
                className={cn(
                  "relative px-4 py-2 rounded-full text-[13px] font-medium transition-colors duration-200 cursor-pointer font-arabic",
                  activeSection === item.href.replace("#", "")
                    ? "text-primary-blue bg-primary-blue/8 dark:text-medical-blue dark:bg-medical-blue/10 font-bold"
                    : "text-dark-text/70 dark:text-slate-300/70 hover:text-dark-text dark:hover:text-white hover:bg-black/4 dark:hover:bg-white/5"
                )}
              >
                  {item.name}
              </button>

            ))}
          </div>

          {/* Right: (language toggle removed) */}
          <div className="flex items-center gap-2" />

        </motion.div>
      </motion.header>

      {/* Mobile Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 inset-x-0 z-50 flex md:hidden items-center justify-between bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 px-6 py-4 shadow-xs"
      >
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2 cursor-pointer font-bold text-primary-blue dark:text-medical-blue font-arabic text-[15px]"
        >
          <Image
            src="/logo-icon.png"
            alt="دِثار — Dithar"
            width={24}
            height={24}
            className="object-contain dark:hidden"
            priority
          />
          <Image
            src="/logo-icon-white.png"
            alt="دِثار — Dithar"
            width={24}
            height={24}
            className="object-contain hidden dark:block"
            priority
          />
          <span>دِثار</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            {mobileOpen ? (
              <X className="w-5 h-5 text-dark-text dark:text-white" />
            ) : (
              <Menu className="w-5 h-5 text-dark-text dark:text-white" />
            )}
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[57px] inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-b border-slate-200/60 dark:border-slate-800/60 p-6 md:hidden shadow-lg"
          >
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollTo(item.href)}
                  className="px-4 py-3 text-right text-[15px] font-medium text-dark-text/80 dark:text-slate-300/80 hover:text-primary-blue dark:hover:text-medical-blue hover:bg-primary-blue/5 dark:hover:bg-white/5 rounded-xl transition-all duration-200 font-arabic cursor-pointer"
                >
                  {item.name}

                </button>
              ))}
              <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/10">
                <button
                  onClick={() => scrollTo("#contact")}
                  className="w-full py-3 bg-linear-to-r from-primary-blue to-medical-blue text-white text-[14px] font-semibold rounded-xl font-arabic cursor-pointer"
                >
                  {lang === "ar" ? "تواصل معنا" : "Contact Us"}
                </button>
                <div className="mt-3">

                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
