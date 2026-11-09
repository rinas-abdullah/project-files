import type { MediaAsset, MediaKind } from "@/types";

export const mediaUrl = (base: string, width: number) => `/media/${base}-${width}.webp`;

export const srcSet = (asset: MediaAsset) =>
  [...asset.widths].sort((a, b) => a - b).map((w) => `${mediaUrl(asset.base, w)} ${w}w`).join(", ");

export const largest = (asset: MediaAsset) => mediaUrl(asset.base, Math.max(...asset.widths));

export const kindLabel: Record<MediaKind, string> = {
  screenshot: "Interface screenshot",
  capture: "Live site capture",
  render: "Product render",
  concept: "Concept render",
};
