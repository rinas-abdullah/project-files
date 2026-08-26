"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  nameAr: string;
  url: string;
  icon?: React.ReactNode;
}

interface NavBarProps {
  items: NavItem[];
  className?: string;
}

export function NavBar({ items, className }: NavBarProps) {
  const [activeTab, setActiveTab] = useState(items[0].name);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (item: NavItem) => {
    setActiveTab(item.name);
    setMenuOpen(false);
    const el = document.getElementById(item.url.replace("#", ""));
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Desktop Navbar */}
      <div
        className={cn(
          "fixed top-0 left-1/2 -translate-x-1/2 z-50 hidden md:flex transition-all duration-500",
          scrolled ? "top-3" : "top-6",
          className
        )}
      >
        <div
          className={cn(
            "flex items-center gap-1 py-1.5 px-2 rounded-full transition-all duration-500",
            scrolled
              ? "bg-white/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(11,77,141,0.12)] border border-white/60"
              : "bg-white/70 backdrop-blur-lg shadow-[0_4px_20px_rgba(11,77,141,0.08)] border border-white/40"
          )}
        >
          {/* Logo */}
          <div className="px-4 py-1.5 mr-2">
            <span className="text-[15px] font-bold text-primary-blue font-arabic tracking-tight">
              دِثار
            </span>
            <span className="text-[11px] text-muted-text font-sans ml-1">Dithar</span>
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-black/10 mx-1" />

          {/* Nav Items */}
          {items.map((item) => {
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => handleNavClick(item)}
                className={cn(
                  "relative cursor-pointer text-sm font-medium px-4 py-2 rounded-full transition-colors duration-200",
                  isActive
                    ? "text-primary-blue"
                    : "text-dark-text/60 hover:text-dark-text"
                )}
              >
                <span className="hidden lg:inline font-arabic text-[13px]">{item.nameAr}</span>
                <span className="lg:hidden font-sans text-[12px]">{item.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="navbar-lamp"
                    className="absolute inset-0 w-full bg-primary-blue/8 rounded-full -z-10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 350, damping: 35 }}
                  >
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary-blue rounded-t-full">
                      <div className="absolute w-10 h-4 bg-primary-blue/20 rounded-full blur-md -top-1.5 -left-2" />
                      <div className="absolute w-6 h-3 bg-primary-blue/15 rounded-full blur-sm -top-1" />
                    </div>
                  </motion.div>
                )}
              </button>
            );
          })}

          {/* CTA Button */}
          <button
            onClick={() => {
              const el = document.getElementById("contact");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="ml-2 px-5 py-2 bg-primary-blue text-white text-[12px] font-medium rounded-full hover:bg-medical-blue transition-all duration-200 shadow-sm hover:shadow-md font-arabic"
          >
            تواصل معنا
          </button>
        </div>
      </div>

      {/* Mobile Navbar */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex md:hidden">
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(11,77,141,0.15)] border border-white/60 py-1.5 px-2 rounded-full">
          {items.slice(0, 5).map((item) => {
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => handleNavClick(item)}
                className={cn(
                  "relative cursor-pointer text-[11px] font-medium px-3 py-2 rounded-full transition-colors duration-200 font-arabic",
                  isActive ? "text-primary-blue" : "text-dark-text/50 hover:text-dark-text"
                )}
              >
                {item.nameAr}
                {isActive && (
                  <motion.div
                    layoutId="mobile-lamp"
                    className="absolute inset-0 bg-primary-blue/8 rounded-full -z-10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 350, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
