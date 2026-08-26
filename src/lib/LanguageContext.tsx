"use client";

import React, { createContext, useContext, useState, useEffect, useSyncExternalStore, ReactNode } from "react";
import { translations } from "./translations";

type Language = "ar" | "en";
type Translations = typeof translations.ar;

interface LanguageContextType {
  language: Language;
  t: Translations;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "ar";
    const saved = localStorage.getItem("dithar_lang");
    return saved === "ar" || saved === "en" ? saved : "ar";
  });
  // Client-only flag without an effect + setState round-trip: subscribing to nothing
  // makes the store "change" exactly once, from the SSR value to the client value.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    if (mounted) {
      document.documentElement.lang = language;
      document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
      localStorage.setItem("dithar_lang", language);
    }
  }, [language, mounted]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === "ar" ? "en" : "ar");
  };

  const t = translations[language];

  // Prevent hydration mismatch on initial load by rendering children only after mounting
  // For better SEO we'd use Server Components i18n, but since this is a client-side mock it's fine.
  if (!mounted) {
    return <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center">...</div>;
  }

  return (
    <LanguageContext.Provider value={{ language, t, toggleLanguage }}>
      <div dir={language === "ar" ? "rtl" : "ltr"} className={language === "ar" ? "font-arabic" : "font-sans"}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
