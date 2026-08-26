"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, User, Stethoscope, Building2, Bell, Menu, X, LogOut, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import { GlassCard } from "@/components/ui/glass";

export function PortalHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: "patient", href: "/portal/patient", label: t.patient_portal, icon: User, allowedRoles: ["patient", "doctor"] },
    { id: "doctor", href: "/portal/doctor", label: t.doctor_portal, icon: Stethoscope, allowedRoles: ["doctor"] },
    { id: "hospital", href: "/portal/hospital", label: t.hospital_portal, icon: Building2, allowedRoles: ["hospital_admin"] },
  ];

  // Filter tabs based on user role
  const visibleTabs = tabs.filter(tab => user && tab.allowedRoles.includes(user.role));

  const isTabActive = (href: string) => {
    if (href === "/portal/patient" && (pathname === "/portal" || pathname === "/portal/")) {
        return true;
    }
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    router.push("/portal/login");
  };

  return (
    <div className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 shadow-sm">
      <header className="flex items-center justify-between h-16 px-4 md:px-6 max-w-[1400px] mx-auto w-full">
        
        {/* Brand Logo & Back to Main */}
        <div className="flex items-center gap-3 md:gap-4 md:w-1/4">
          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 rounded-md bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/" className="hidden md:flex items-center justify-center p-2 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors group">
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-slate-900 transition-colors rtl:rotate-0 ltr:rotate-180" />
          </Link>
          <div className="h-6 w-px bg-slate-200 hidden md:block" />
          <Link href={user ? `/portal/${user.role === 'hospital_admin' ? 'hospital' : user.role}` : "/portal/login"}>
            <Image src="/logo.png" alt="Dithar" width={80} height={24} className="object-contain" priority />
          </Link>
        </div>

        {/* Desktop Navigation Tabs (Centered) */}
        <nav className="hidden md:flex items-center justify-center gap-1 flex-1">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = isTabActive(tab.href);
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors",
                  isActive 
                    ? "text-[#0B4D8D] bg-blue-50" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-[#0B4D8D]" : "text-slate-400")} />
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#0B4D8D] rounded-t-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Area (Right) */}
        <div className="flex items-center justify-end gap-2 md:gap-4 md:w-1/4">
          
          {/* Language Toggle */}
          <button 
            onClick={toggleLanguage}
            className="hidden md:flex items-center justify-center gap-1.5 p-2 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors group text-xs font-bold text-slate-500 hover:text-slate-900"
          >
            <Globe className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
            <span className="mt-0.5 uppercase">{language === "ar" ? "EN" : "AR"}</span>
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors group">
            <Bell className="w-4 h-4 text-slate-500 group-hover:text-slate-900 transition-colors" />
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
          </button>

          {/* User Profile / Logout (Desktop) */}
          <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 transition-colors group">
            <span className="text-xs text-slate-700 font-bold max-w-[100px] truncate">{user?.name || "User"}</span>
            <button 
              onClick={handleLogout}
              className="w-7 h-7 rounded-md bg-slate-200 text-slate-600 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors"
              title={t.logout}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-slate-200 shadow-lg z-40 animate-in slide-in-from-top-2">
          <div className="flex flex-col p-4 space-y-2">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = isTabActive(tab.href);
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors",
                    isActive 
                      ? "text-[#0B4D8D] bg-blue-50" 
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-[#0B4D8D]" : "text-slate-400")} />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
            
            <div className="h-px w-full bg-slate-100 my-2" />
            
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-sm font-bold text-slate-700">{user?.name}</span>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => { toggleLanguage(); setMobileMenuOpen(false); }}
                  className="px-3 py-1.5 rounded-md bg-slate-100 text-slate-600 text-xs font-bold uppercase"
                >
                  {language === "ar" ? "EN" : "AR"}
                </button>
                <button 
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="px-3 py-1.5 rounded-md bg-red-50 text-red-600 text-xs font-bold flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  {t.logout}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
