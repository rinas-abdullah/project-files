import { useState } from "react";
import type { MediaAsset } from "@/types";
import { largest, mediaUrl, srcSet } from "@/lib/media";
import { cn } from "@/lib/cn";

interface Props {
  asset: MediaAsset;
  sizes: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  /** Override the intrinsic aspect, e.g. to crop into a frame. */
  fit?: "cover" | "contain";
}

/** Lazy, srcset-driven image with a quiet load-in and a graceful failure state. */
export function ResponsiveImage({ asset, sizes, className, imgClassName, priority, fit = "cover" }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn("relative overflow-hidden bg-graphite", className)}>
      {failed ? (
        <div className="absolute inset-0 grid place-items-center p-6 text-center">
          <span className="t-label">Image unavailable — {asset.alt}</span>
        </div>
      ) : (
        <img
          src={largest(asset)}
          srcSet={srcSet(asset)}
          sizes={sizes}
          width={asset.width}
          height={asset.height}
          alt={asset.alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            "h-full w-full transition-[opacity,filter] duration-700 ease-[var(--ease-architect)]",
            fit === "cover" ? "object-cover" : "object-contain",
            loaded ? "opacity-100 blur-0" : "opacity-0 blur-sm",
            imgClassName,
          )}
        />
      )}
    </div>
  );
}

export const preloadMedia = (asset: MediaAsset, width = 900) => {
  const img = new Image();
  img.src = mediaUrl(asset.base, Math.min(width, Math.max(...asset.widths)));
};
