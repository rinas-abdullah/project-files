/** How an image was produced — always disclosed next to the image. */
export type MediaKind = "screenshot" | "render" | "concept" | "capture";

export interface MediaAsset {
  /** File stem in /public/media, e.g. "rasd-cyber" → /media/rasd-cyber-1500.webp */
  base: string;
  /** Available widths (px) — each must exist as `${base}-${w}.webp`. */
  widths: number[];
  /** Intrinsic aspect of the largest file. */
  width: number;
  height: number;
  alt: string;
  kind: MediaKind;
  caption: string;
}

export type Discipline = "security" | "intelligence" | "engineering" | "experience";

export type CaseModule = "dithar" | "rasd" | "rikaz" | "mueen" | "muyassir" | "qiddiya";

export interface Highlight {
  title: string;
  body: string;
}

export interface Project {
  slug: string;
  index: string;
  name: string;
  /** Arabic name, shown as a secondary mark when known. */
  nameAr?: string;
  role?: string;
  category: string;
  /** One-line summary used in the explorer. */
  summary: string;
  /** Opening paragraph for the case study. */
  overview: string;
  status: string;
  disciplines: Discipline[];
  stack?: string[];
  cover?: MediaAsset;
  highlights: Highlight[];
  /** Integrity note — what this work is and is not. */
  disclosure?: string;
  module: CaseModule;
  /** Short label for the explorer's figure when there is no cover image. */
  figureLabel: string;
}

export interface Website {
  slug: string;
  name: string;
  url: string;
  host: string;
  sector: string;
  /** What the live site itself presents (observed, not claimed). */
  observed: string;
  liveBranding?: string;
  contribution: string;
  features: string[];
  rtl: boolean;
  /** Which desktop capture to show first. */
  leadView?: "desktop" | "detail";
  desktop: MediaAsset;
  detail: MediaAsset;
  mobile: MediaAsset;
}

export interface Role {
  org: string;
  title: string;
  start: { y: number; m: number };
  end: { y: number; m: number };
  period: string;
  location: string;
  concurrent?: boolean;
  points: string[];
  focus: string[];
}

export interface Community {
  org: string;
  role: string;
  body: string;
}

export interface Certification {
  name: string;
  issuer?: string;
}

export interface CapabilityGroup {
  key: Discipline;
  label: string;
  title: string;
  items: string[];
}
