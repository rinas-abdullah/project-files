import type { Discipline } from "@/types";

export const disciplineMeta: Record<Discipline, { label: string; short: string; line: string }> = {
  security: {
    label: "Security",
    short: "SEC",
    line: "Defence-in-depth architecture, risk and compliance, and training that keeps pace with attackers.",
  },
  intelligence: {
    label: "Intelligence",
    short: "AI",
    line: "Models and analytics that turn sensor, behavioural and visual data into decisions.",
  },
  engineering: {
    label: "Engineering",
    short: "ENG",
    line: "Full-stack platforms, connected devices and field instruments designed to scale.",
  },
  experience: {
    label: "Experience",
    short: "UX",
    line: "Interfaces, prototypes and 3D worlds that make complex systems usable.",
  },
};

export const disciplineOrder: Discipline[] = ["security", "intelligence", "engineering", "experience"];
