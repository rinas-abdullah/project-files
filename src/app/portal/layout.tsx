"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { LanguageProvider } from "@/lib/LanguageContext";

function PortalContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== "/portal/login") {
        router.push("/portal/login");
      }
      
      // Simple role based redirects if they try to access wrong portals
      if (user && pathname !== "/portal/login") {
        if (user.role === "patient" && !pathname.startsWith("/portal/patient")) {
           router.push("/portal/patient");
        }
        if (user.role === "doctor" && !pathname.startsWith("/portal/doctor") && !pathname.startsWith("/portal/patient/")) {
           router.push("/portal/doctor");
        }
        if (user.role === "hospital_admin" && !pathname.startsWith("/portal/hospital")) {
           router.push("/portal/hospital");
        }
      }
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">...</div>;
  }

  // If not logged in and not on login page, don't render content yet (prevent flash)
  if (!user && pathname !== "/portal/login") {
    return null; 
  }

  // Hide header on login page
  const showHeader = pathname !== "/portal/login";

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 selection:bg-sky-500/30 selection:text-slate-900 relative">
      <div className="relative z-10 flex flex-col min-h-screen">
        {showHeader && <PortalHeader />}
        <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 md:px-8 py-8 md:py-12 pb-32">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <LanguageProvider>
        <PortalContent>{children}</PortalContent>
      </LanguageProvider>
    </AuthProvider>
  );
}
