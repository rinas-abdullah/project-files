import { motion } from "motion/react";
import { drawX } from "@/animations/variants";
import { cn } from "@/lib/cn";

interface Props {
  sheet: string;
  label: string;
  note?: string;
  className?: string;
}

/** Title-block strip that opens each section, like a sheet in a drawing set. */
export function SheetHeader({ sheet, label, note, className }: Props) {
  return (
    <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.8 }} className={cn("relative", className)}>
      <motion.div variants={drawX} className="h-px origin-left bg-[var(--rule-strong)]" />
      <div className="mt-4 grid grid-cols-[auto_1fr] items-baseline gap-x-6 sm:grid-cols-[8rem_1fr_auto]">
        <span className="t-label text-paper">
          <span className="text-cyan">§</span> {sheet}
        </span>
        <span className="t-label">{label}</span>
        {note && <span className="t-label col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:text-right">{note}</span>}
      </div>
    </motion.div>
  );
}
