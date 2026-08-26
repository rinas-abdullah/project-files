"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

type BackgroundPathsProps = {
  className?: string;
  intensity?: "light" | "medium" | "strong";
  showParticles?: boolean;
  showDataStream?: boolean;
};

type FloatingPathsProps = {
  position: number;
  color?: string;
  mouseX: number;
  mouseY: number;
  reduceMotion: boolean;
};

const dataItems = ["36.7°C", "92%", "Normal", "AI Active", "Low Risk", "24/7"];

function FloatingPaths({
  position,
  color = "#0B4D8D",
  mouseX,
  mouseY,
  reduceMotion,
}: FloatingPathsProps) {
  const paths = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        id: i,
        d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position
          } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position
          } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position
          } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
        opacity: 0.025 + i * 0.0025,
        width: 0.4 + i * 0.025,
      })),
    [position]
  );

  return (
    <motion.svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 696 316"
      fill="none"
      animate={
        reduceMotion
          ? {}
          : {
            x: mouseX * position * 0.35,
            y: mouseY * position * 0.25,
          }
      }
      transition={{
        type: "spring",
        stiffness: 18,
        damping: 28,
      }}
    >
      <title>Dithar Medical Background Paths</title>

      {paths.map((path) => (
        <motion.path
          key={path.id}
          d={path.d}
          stroke={color}
          strokeWidth={path.width}
          strokeOpacity={path.opacity}
          initial={{
            pathLength: reduceMotion ? 1 : 0.25,
            opacity: path.opacity,
          }}
          animate={
            reduceMotion
              ? {
                pathLength: 1,
                opacity: path.opacity,
              }
              : {
                pathLength: [0.25, 1, 0.25],
                pathOffset: [0, 1],
                opacity: [path.opacity * 0.6, path.opacity * 1.8, path.opacity * 0.6],
              }
          }
          transition={{
            duration: 24 + path.id * 0.35,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </motion.svg>
  );
}

function MedicalParticles({
  reduceMotion,
  show = true,
}: {
  reduceMotion: boolean;
  show?: boolean;
}) {
  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        left: `${(i * 37) % 100}%`,
        top: `${(i * 53) % 100}%`,
        size: 3 + (i % 5),
        delay: i * 0.35,
        duration: 8 + (i % 7),
        color: i % 3 === 0 ? "#39B56A" : "#0B4D8D",
      })),
    []
  );

  if (!show) return null;

  return (
    <div className="absolute inset-0">
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: 0.12,
            filter: "blur(0.2px)",
          }}
          animate={
            reduceMotion
              ? {}
              : {
                y: [0, -38, 0],
                x: [0, particle.id % 2 === 0 ? 14 : -14, 0],
                opacity: [0.06, 0.18, 0.06],
                scale: [1, 1.45, 1],
              }
          }
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function FloatingDataStream({
  reduceMotion,
  show = true,
}: {
  reduceMotion: boolean;
  show?: boolean;
}) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 hidden md:block">
      {dataItems.map((item, index) => (
        <motion.div
          key={item}
          className="absolute rounded-full border border-white/30 bg-white/35 px-3 py-1 text-[11px] font-medium tracking-wide text-primary-blue shadow-sm backdrop-blur-md"
          style={{
            left: `${12 + index * 13}%`,
            top: `${18 + ((index * 17) % 58)}%`,
          }}
          animate={
            reduceMotion
              ? {}
              : {
                y: [0, -18, 0],
                opacity: [0.2, 0.55, 0.2],
              }
          }
          transition={{
            duration: 7 + index,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.4,
          }}
        >
          {item}
        </motion.div>
      ))}
    </div>
  );
}

export function BackgroundPaths({
  className = "",
  intensity = "medium",
  showParticles = true,
  showDataStream = true,
}: BackgroundPathsProps) {
  const reduceMotion = Boolean(useReducedMotion());
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const opacity =
    intensity === "light" ? 0.55 : intensity === "strong" ? 1 : 0.75;

  useEffect(() => {
    if (reduceMotion) return;

    const handleMouseMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 28;
      const y = (event.clientY / window.innerHeight - 0.5) * 28;

      setMouse({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [reduceMotion]);

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{
        opacity,
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
      }}
      aria-hidden="true"
    >
      {/* Soft medical gradient base */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(11,77,141,0.10),transparent_38%),radial-gradient(circle_at_20%_80%,rgba(57,181,106,0.08),transparent_42%)]" />

      {/* Premium path network */}
      <motion.div
        className="absolute inset-0"
        animate={
          reduceMotion
            ? {}
            : {
              rotate: [0, 0.3, 0],
            }
        }
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <FloatingPaths
          position={1}
          color="#0B4D8D"
          mouseX={mouse.x}
          mouseY={mouse.y}
          reduceMotion={reduceMotion}
        />

        <FloatingPaths
          position={-1}
          color="#1E88C8"
          mouseX={mouse.x}
          mouseY={mouse.y}
          reduceMotion={reduceMotion}
        />
      </motion.div>

      {/* Subtle medical particles */}
      <MedicalParticles reduceMotion={reduceMotion} show={showParticles} />

      {/* Live medical data chips */}
      <FloatingDataStream reduceMotion={reduceMotion} show={showDataStream} />

      {/* Clean white wash to avoid AI-looking clutter */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-white/70" />

      {/* Fine professional grain */}
      <div
        className="absolute inset-0 opacity-[0.018] mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #0B4D8D 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />
    </div>
  );
}