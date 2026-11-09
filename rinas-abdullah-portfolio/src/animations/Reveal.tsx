import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";
import { rise } from "./variants";

type Tag = "div" | "section" | "li" | "ul" | "p" | "h2" | "h3" | "header" | "figure" | "ol" | "span";

interface Props {
  children: ReactNode;
  as?: Tag;
  className?: string;
  variants?: Variants;
  amount?: number;
  id?: string;
}

/** Reveals its children once when they scroll into view. */
export function Reveal({ children, as = "div", className, variants = rise, amount = 0.25, id }: Props) {
  const M = motion[as] as typeof motion.div;
  return (
    <M id={id} className={className} variants={variants} initial="hidden" whileInView="show" viewport={{ once: true, amount }}>
      {children}
    </M>
  );
}
