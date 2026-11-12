"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui";

export interface NavItem {
  href: string;
  label: string;
  count?: number;
}

export function AppNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav aria-label="التنقل الرئيسي" className="flex gap-1 overflow-x-auto lg:flex-col">
      {items.map((it) => {
        const active = it.href === "/app" ? path === "/app" : path.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "flex items-center justify-between gap-3 whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors",
              active ? "bg-surface-3 text-fg" : "text-silver hover:bg-surface-2 hover:text-fg",
            )}
          >
            <span className="flex items-center gap-2">
              <span className={cx("h-1.5 w-1.5 rounded-full", active ? "bg-lime" : "bg-transparent")} aria-hidden />
              {it.label}
            </span>
            {it.count ? <span className="rounded bg-lime px-1.5 text-[11px] font-semibold text-ink">{it.count}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
