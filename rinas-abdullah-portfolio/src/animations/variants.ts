import type { Transition, Variants } from "motion/react";

export const ease = [0.2, 0.7, 0.1, 1] as const;

export const t = (duration = 0.9, delay = 0): Transition => ({ duration, delay, ease });

export const rise: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: t() },
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: t(1.1) },
};

export const stagger = (gap = 0.08, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});

/** Draws a hairline from left to right. */
export const drawX: Variants = {
  hidden: { scaleX: 0 },
  show: { scaleX: 1, transition: t(1.2) },
};
