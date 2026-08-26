"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  glow?: boolean;
  className?: string;
}

export function AnimatedCounter({
  end,
  duration = 2000,
  suffix = "",
  prefix = "",
  decimals = 0,
  glow = false,
  className = "",
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);

  const ref = useRef<HTMLSpanElement>(null);

  const isInView = useInView(ref, {
    once: true,
    margin: "-100px",
  });

  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;

    hasAnimated.current = true;

    let startTime: number;

    const startValue = 0;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;

      const progress = Math.min(
        (timestamp - startTime) / duration,
        1
      );

      const eased =
        1 - Math.pow(1 - progress, 3);

      const current =
        startValue +
        (end - startValue) * eased;

      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, end, duration]);

  return (
    <motion.span
      ref={ref}
      initial={{
        opacity: 0,
        y: 20,
        scale: 0.95,
      }}
      animate={
        isInView
          ? {
            opacity: 1,
            y: 0,
            scale: 1,
          }
          : {}
      }
      transition={{
        duration: 0.8,
        ease: "easeOut",
      }}
      className={className}
      style={{
        textShadow:
          glow && isInView
            ? "0 0 24px rgba(11,77,141,0.25)"
            : "none",
      }}
    >
      {prefix}
      {count.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </motion.span>
  );
}