import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { Monogram } from "./Monogram";
import { useActiveSection } from "@/hooks/useActiveSection";
import { profile } from "@/data/profile";
import { cn } from "@/lib/cn";
import { ease } from "@/animations/variants";

export const navItems = [
  { id: "work", label: "Work", n: "01" },
  { id: "websites", label: "Websites", n: "02" },
  { id: "experience", label: "Experience", n: "03" },
  { id: "capabilities", label: "Capabilities", n: "04" },
  { id: "contact", label: "Contact", n: "05" },
];

export function Header() {
  const { pathname } = useLocation();
  const onHome = pathname === "/";
  const active = useActiveSection(
    navItems.map((n) => n.id),
    onHome,
  );
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the menu on navigation.
  useEffect(() => setOpen(false), [pathname]);

  // Mobile menu: lock scroll, focus the first link, trap focus, close on Escape.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const root = menuRef.current;
    root?.querySelector<HTMLElement>("a,button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === "Tab" && root) {
        const f = [toggleRef.current, ...root.querySelectorAll<HTMLElement>("a,button")].filter(Boolean) as HTMLElement[];
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500",
        scrolled || open ? "border-b border-[var(--rule)] bg-obsidian/85 backdrop-blur-md" : "border-b border-transparent",
      )}
    >
      <div className="shell flex h-16 items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-3 text-paper" aria-label={`${profile.name} — home`}>
          <Monogram className="size-8" />
          <span className="hidden font-display text-[0.95rem] font-medium tracking-tight sm:inline">
            Rinas Abdullah Murayr
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = onHome && active === item.id;
              return (
                <li key={item.id}>
                  <Link
                    to={{ pathname: "/", hash: `#${item.id}` }}
                    aria-current={isActive ? "location" : undefined}
                    className={cn(
                      "relative flex items-baseline gap-1.5 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
                      isActive ? "text-paper" : "text-steel hover:text-paper",
                    )}
                  >
                    <span className={cn("text-[9px]", isActive ? "text-cyan" : "text-steel-dim")}>{item.n}</span>
                    {item.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-x-3 -bottom-px h-px bg-cyan"
                        transition={{ duration: 0.5, ease }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a href={`mailto:${profile.email}`} className="btn btn-ghost hidden !min-h-10 sm:inline-flex">
            Email Rinas
          </a>
          <button
            ref={toggleRef}
            type="button"
            className="grid size-11 place-items-center border border-[var(--rule-strong)] text-paper lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-x-0 bottom-0 top-16 overflow-y-auto bg-obsidian lg:hidden"
          >
            <nav aria-label="Mobile" className="shell flex min-h-full flex-col justify-between py-8">
              <ul>
                {navItems.map((item, i) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05 * i, ease }}
                    className="border-b border-[var(--rule)]"
                  >
                    <Link
                      to={{ pathname: "/", hash: `#${item.id}` }}
                      onClick={() => setOpen(false)}
                      className="flex items-baseline justify-between py-5"
                    >
                      <span className="t-heading text-4xl">{item.label}</span>
                      <span className="t-label">{item.n}</span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-10 grid gap-3">
                <a href={`mailto:${profile.email}`} className="btn btn-primary justify-between">
                  {profile.email}
                </a>
                <p className="t-label">{profile.location}</p>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
