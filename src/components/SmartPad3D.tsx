"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type SmartPad3DProps = {
  mode?: "hero" | "hotspots" | "exploded" | "twin";
  activeHotspot?: string | null;
  activeLayer?: number | null;
  explodedFactor?: number;
  onHotspotClick?: (name: string) => void;
  onModelClick?: () => void;
};

// ─── Insole silhouette ────────────────────────────────────────────────────────
function getInsoleShape() {
  const s = new THREE.Shape();
  s.moveTo(0, -2.6);
  s.bezierCurveTo(-0.68, -2.56, -1.06, -2.08, -1.02, -1.38);
  s.bezierCurveTo(-0.95, -0.48, -0.60,  0.12, -0.88,  1.08);
  s.bezierCurveTo(-1.16,  2.12, -0.76,  3.12, -0.06,  3.44);
  s.bezierCurveTo( 0.72,  3.74,  1.24,  3.24,  1.20,  2.44);
  s.bezierCurveTo( 1.14,  1.54,  0.68,  0.78,  0.46,  0.04);
  s.bezierCurveTo( 0.26, -0.64,  0.60, -1.44,  0.48, -2.04);
  s.bezierCurveTo( 0.36, -2.54,  0.24, -2.64,  0,    -2.60);
  return s;
}

// Shape inset for the layered content
function getLayerShape(scale: number) {
  const f = scale;
  const s = new THREE.Shape();
  s.moveTo(0*f, -2.6*f);
  s.bezierCurveTo(-0.68*f,-2.56*f,-1.06*f,-2.08*f,-1.02*f,-1.38*f);
  s.bezierCurveTo(-0.95*f,-0.48*f,-0.60*f, 0.12*f,-0.88*f, 1.08*f);
  s.bezierCurveTo(-1.16*f, 2.12*f,-0.76*f, 3.12*f,-0.06*f, 3.44*f);
  s.bezierCurveTo( 0.72*f, 3.74*f, 1.24*f, 3.24*f, 1.20*f, 2.44*f);
  s.bezierCurveTo( 1.14*f, 1.54*f, 0.68*f, 0.78*f, 0.46*f, 0.04*f);
  s.bezierCurveTo( 0.26*f,-0.64*f, 0.60*f,-1.44*f, 0.48*f,-2.04*f);
  s.bezierCurveTo( 0.36*f,-2.54*f, 0.24*f,-2.64*f, 0,     -2.60*f);
  return s;
}

// ─── Canvas texture for the top fabric surface ───────────────────────────────
// Matches product photo: dark grey fabric, LEDs, Dithar logo, ventilation holes
function createFabricTexture(): THREE.CanvasTexture {
  const W = 460, H = 1268; // ~1:2.75 matches insole aspect ratio
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Base — dark charcoal, slightly lighter than pure black (matches product photo)
  ctx.fillStyle = "#222630";
  ctx.fillRect(0, 0, W, H);

  // Fine cross-hatch texture pattern (fabric weave)
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = "#0e121a";
  ctx.lineWidth = 1.0;
  const sp = 16;
  for (let i = -H; i < W + H; i += sp) {
    ctx.beginPath(); ctx.moveTo(i, 0);       ctx.lineTo(i + H, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i + H, 0);   ctx.lineTo(i, H);     ctx.stroke();
  }
  ctx.restore();

  // Arch area — slightly lighter band in the middle (matching product photo)
  const archGrad = ctx.createLinearGradient(0, H * 0.45, 0, H * 0.70);
  archGrad.addColorStop(0, "rgba(40,48,62,0)");
  archGrad.addColorStop(0.5, "rgba(40,48,62,0.22)");
  archGrad.addColorStop(1, "rgba(40,48,62,0)");
  ctx.fillStyle = archGrad;
  ctx.fillRect(0, 0, W, H);

  // Heel cup depression (darker radial gradient at heel)
  const hx = W * 0.50, hy = H * 0.84;
  const hg = ctx.createRadialGradient(hx, hy, 10, hx, hy, 110);
  hg.addColorStop(0, "rgba(4,6,10,0.65)");
  hg.addColorStop(0.5, "rgba(4,6,10,0.30)");
  hg.addColorStop(1, "rgba(4,6,10,0)");
  ctx.fillStyle = hg;
  ctx.beginPath(); ctx.arc(hx, hy, 110, 0, Math.PI * 2); ctx.fill();

  // Heel cup ring outline
  ctx.save();
  ctx.strokeStyle = "#0d1018";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(hx, hy, 85, 70, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Ventilation perforations (small dark circles in grid pattern)
  const perfGrid: [number, number][] = [
    [W*0.30,H*0.37],[W*0.50,H*0.37],[W*0.68,H*0.37],
    [W*0.28,H*0.44],[W*0.48,H*0.44],[W*0.66,H*0.44],
    [W*0.28,H*0.51],[W*0.48,H*0.51],[W*0.64,H*0.51],
    [W*0.30,H*0.58],[W*0.50,H*0.58],[W*0.65,H*0.58],
    [W*0.32,H*0.65],[W*0.50,H*0.65],[W*0.65,H*0.65],
    // heel perfs
    [W*0.32,H*0.80],[W*0.50,H*0.80],[W*0.66,H*0.80],
    [W*0.30,H*0.86],[W*0.50,H*0.86],[W*0.66,H*0.86],
    [W*0.30,H*0.91],[W*0.50,H*0.91],[W*0.66,H*0.91],
  ];
  perfGrid.forEach(([px, py]) => {
    ctx.fillStyle = "#06080e";
    ctx.beginPath(); ctx.arc(px, py, 5.5, 0, Math.PI * 2); ctx.fill();
    // subtle inner highlight ring
    ctx.strokeStyle = "#181e2a";
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.stroke();
  });

  // ── Teal LED dots (matching product photo positions) ──
  const leds: [number, number][] = [
    [W * 0.64, H * 0.395],
    [W * 0.52, H * 0.455],
    [W * 0.42, H * 0.515],
  ];
  leds.forEach(([lx, ly]) => {
    // Outer glow halo
    const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, 26);
    lg.addColorStop(0, "rgba(6,182,212,0.50)");
    lg.addColorStop(0.5, "rgba(6,182,212,0.15)");
    lg.addColorStop(1, "rgba(6,182,212,0)");
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.arc(lx, ly, 26, 0, Math.PI * 2); ctx.fill();
    // Bright core
    ctx.fillStyle = "#34e8ff";
    ctx.shadowColor = "#06B6D4";
    ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(lx, ly, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  });

  // Status indicator dots (green, teal, amber — at mid arch)
  const sdx = W * 0.52, sdy = H * 0.475;
  (["#39B56A", "#06B6D4", "#D97706"] as const).forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(sdx + (i - 1) * 16, sdy, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  // ── Dithar Logo (toe area — top ~15% of canvas) ──
  const logoX = W * 0.56, logoY = H * 0.125;

  // Outer ring
  ctx.strokeStyle = "#2a3348";
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.arc(logoX, logoY, 50, 0, Math.PI * 2);
  ctx.stroke();

  // Inner thin ring
  ctx.strokeStyle = "#1e2838";
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.arc(logoX, logoY, 44, 0, Math.PI * 2);
  ctx.stroke();

  // Dot pattern around ring (clockwise starting from top)
  for (let a = 0; a < 360; a += 36) {
    const rad = (a * Math.PI) / 180;
    ctx.fillStyle = "#1e2838";
    ctx.beginPath();
    ctx.arc(logoX + Math.cos(rad) * 58, logoY + Math.sin(rad) * 58, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Foot icon (stylized)
  ctx.fillStyle = "#1a2235";
  // Foot body
  ctx.beginPath();
  ctx.ellipse(logoX, logoY + 2, 12, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  // Toes
  [[-12,-20],[-6,-22],[2,-23],[9,-21],[15,-17]].forEach(([tx, ty]) => {
    ctx.beginPath();
    ctx.arc(logoX + tx, logoY + ty, 4.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // "Dithar" text
  ctx.fillStyle = "#2a3550";
  ctx.font = "bold 20px 'Arial', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Dithar", logoX, logoY + 34);
  ctx.font = "9px 'Arial', sans-serif";
  ctx.fillStyle = "#1a2235";
  ctx.letterSpacing = "1px";
  ctx.fillText("SMART PAD", logoX, logoY + 46);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ─── Hotspot → layer index mapping (new 8-layer order) ───────────────────────
const HOTSPOT_TO_LAYER: Record<string, number> = {
  comfort: 7, pressure: 5, temp: 5, temperature: 5,
  humidity: 5, motion: 5, ai: 4, energy: 3, power: 3,
  comms: 4, communication: 4,
};

// ─────────────────────────────────────────────────────────────────────────────
export default function SmartPad3D({
  mode = "hero",
  activeHotspot = null,
  activeLayer = null,
  explodedFactor = 0,
  onHotspotClick,
  onModelClick,
}: SmartPad3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Group>(null);

  const insoleShape   = useMemo(() => getInsoleShape(), []);
  const layerShape95  = useMemo(() => getLayerShape(0.95), []);
  const layerShape90  = useMemo(() => getLayerShape(0.90), []);
  const fabricTexture = useMemo(() => createFabricTexture(), []);

  const selectedLayer = useMemo(() => {
    if (activeHotspot && HOTSPOT_TO_LAYER[activeHotspot] !== undefined)
      return HOTSPOT_TO_LAYER[activeHotspot];
    return activeLayer;
  }, [activeHotspot, activeLayer]);

  // ── Extrudes ───────────────────────────────────────────────────────────────
  const shellEx = useMemo(() => ({
    depth: 0.22, bevelEnabled: true, bevelSegments: 14,
    bevelSize: 0.055, bevelThickness: 0.045, steps: 2,
  }), []);
  const thinEx = useMemo(() => ({
    depth: 0.013, bevelEnabled: true, bevelSegments: 4,
    bevelSize: 0.005, bevelThickness: 0.005, steps: 1,
  }), []);
  const midEx = useMemo(() => ({
    depth: 0.018, bevelEnabled: true, bevelSegments: 6,
    bevelSize: 0.007, bevelThickness: 0.007, steps: 1,
  }), []);

  // ── Hotspot nodes ──────────────────────────────────────────────────────────
  const hotspots = useMemo(() => [
    { id: "pressure",    pos: [ 0.15,  1.75, 0.30] as [number,number,number], color: "#39B56A", layer: 5 },
    { id: "temperature", pos: [-0.30,  0.55, 0.30] as [number,number,number], color: "#06B6D4", layer: 5 },
    { id: "humidity",    pos: [ 0.22, -0.15, 0.30] as [number,number,number], color: "#06B6D4", layer: 5 },
    { id: "motion",      pos: [ 0.05, -0.90, 0.30] as [number,number,number], color: "#39B56A", layer: 5 },
    { id: "ai",          pos: [ 0.05,  0.32, 0.26] as [number,number,number], color: "#1E88C8", layer: 4 },
    { id: "power",       pos: [ 0.02, -1.65, 0.22] as [number,number,number], color: "#D97706", layer: 3 },
    { id: "comms",       pos: [ 0.22,  2.20, 0.26] as [number,number,number], color: "#39B56A", layer: 4 },
  ], []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const layerLift = (i: number) => {
    let l = 0;
    if (mode === "exploded") l += explodedFactor * 0.32 * i;
    if (selectedLayer === i)  l += 0.35;
    return l;
  };

  const op = (i: number) => {
    if (selectedLayer === null || selectedLayer === undefined) return 1.0;
    return selectedLayer === i ? 1.0 : 0.12;
  };

  const glow = (i: number, lo = 0.08, hi = 1.0) =>
    selectedLayer === i ? hi : lo;

  const isActive = (id: string) => {
    if (!activeHotspot) return false;
    if (activeHotspot === id) return true;
    if (id === "temperature" && activeHotspot === "temp") return true;
    if (id === "power"       && activeHotspot === "energy") return true;
    if (id === "comms"       && activeHotspot === "communication") return true;
    return false;
  };

  const handleClick = (id: string) => {
    const map: Record<string, string> = {
      temperature: "temp", power: "energy", comms: "communication",
    };
    onHotspotClick?.(map[id] ?? id);
  };

  // ── Animation ──────────────────────────────────────────────────────────────
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const p = state.pointer ?? { x: 0, y: 0 };

    if (groupRef.current) {
      let bX = 0.78, bY = -0.62, bZ = -0.16, pY = 0;
      if (mode === "hero") {
        bY += Math.sin(t * 0.45) * 0.05;
        bZ += Math.sin(t * 0.25) * 0.015;
        pY  = Math.sin(t * 0.75) * 0.04;
      } else if (mode === "hotspots") {
        bY += Math.sin(t * 0.40) * 0.035;
        pY  = Math.sin(t * 0.60) * 0.02;
      } else if (mode === "exploded") {
        bX = 0.85;
        bY = -0.68 + Math.sin(t * 0.30) * 0.02;
        pY = -0.12;
      } else if (mode === "twin") {
        bX = 1.05; bY = Math.sin(t * 0.30) * 0.03;
        bZ = 0;    pY = Math.sin(t * 0.70) * 0.02;
      }
      const g = groupRef.current;
      g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, bX - p.y * 0.18, 0.06);
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, bY + p.x * 0.18, 0.06);
      g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, bZ,              0.06);
      g.position.y = THREE.MathUtils.lerp(g.position.y, pY,              0.06);
    }

    if (pulseRef.current) {
      pulseRef.current.children.forEach((child, i) => {
        const s = 1 + Math.sin(t * 2.5 + i) * 0.18;
        child.scale.set(s, s, s);
      });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <group ref={groupRef} scale={[1.35, 1.35, 1.35]}>
      <group
        position={[0, -0.15, 0]}
        onClick={(e) => {
          if (explodedFactor < 0.05) { e.stopPropagation(); onModelClick?.(); }
        }}
      >
        {/* ══════════════════════════════════════════════════════════════════
            LAYER 0 — EVA Base  (black rubbery outer shell — the rim you see
            in the product photo as the thick dark edge)
        ═══════════════════════════════════════════════════════════════════ */}
        <group position={[0, 0, 0.0 + layerLift(0)]}>
          <mesh>
            <extrudeGeometry args={[insoleShape, shellEx]} />
            <meshPhysicalMaterial
              color="#080a0f"
              roughness={0.45}
              metalness={0.50}
              clearcoat={1.0}
              clearcoatRoughness={0.08}
              envMapIntensity={0.8}
              transparent opacity={op(0)}
            />
          </mesh>
        </group>

        {/* ══════════════════════════════════════════════════════════════════
            LAYER 1 — Insulation  (dark charcoal anti-vibration sheet)
        ═══════════════════════════════════════════════════════════════════ */}
        <group position={[0, 0, 0.22 + layerLift(1)]}>
          <mesh>
            <extrudeGeometry args={[layerShape95, thinEx]} />
            <meshPhysicalMaterial
              color="#111520"
              roughness={0.70}
              metalness={0.10}
              transparent opacity={op(1)}
            />
          </mesh>
        </group>

        {/* ══════════════════════════════════════════════════════════════════
            LAYER 2 — Power Storage Cell
            (flat golden cell in the heel; charged by friction energy)
        ═══════════════════════════════════════════════════════════════════ */}
        <group position={[0, 0, 0.234 + layerLift(2)]}>
          {/* Dark substrate */}
          <mesh>
            <extrudeGeometry args={[layerShape95, thinEx]} />
            <meshPhysicalMaterial
              color="#181520"
              roughness={0.6}
              metalness={0.2}
              transparent opacity={op(2) * 0.55}
            />
          </mesh>
          {/* Golden cell body at heel */}
          <mesh position={[0, -1.55, 0.01]}>
            <boxGeometry args={[1.25, 1.55, 0.014]} />
            <meshPhysicalMaterial
              color="#b87a08"
              roughness={0.22}
              metalness={0.70}
              emissive="#7a5000"
              emissiveIntensity={glow(2, 0.05, 0.4)}
              transparent opacity={op(2)}
            />
          </mesh>
          {/* Cell surface lines */}
          {[-0.38, 0, 0.38].map((x, i) => (
            <mesh key={i} position={[x, -1.55, 0.019]}>
              <boxGeometry args={[0.009, 1.50, 0.002]} />
              <meshBasicMaterial color="#d4a020" transparent opacity={op(2) * 0.6} />
            </mesh>
          ))}
          {/* Terminal nub */}
          <mesh position={[0.56, -0.78, 0.013]}>
            <boxGeometry args={[0.13, 0.24, 0.016]} />
            <meshStandardMaterial color="#2a1800" metalness={0.8} roughness={0.2} transparent opacity={op(2)} />
          </mesh>
        </group>

        {/* ══════════════════════════════════════════════════════════════════
            LAYER 3 — Energy Harvesting  (piezo + friction — gold coils)
        ═══════════════════════════════════════════════════════════════════ */}
        <group position={[0, 0, 0.250 + layerLift(3)]}>
          <mesh>
            <extrudeGeometry args={[layerShape95, thinEx]} />
            <meshPhysicalMaterial
              color="#1a1300"
              roughness={0.35}
              metalness={0.35}
              transparent opacity={op(3)}
            />
          </mesh>
          {/* Forefoot coil — 4 rings */}
          <group position={[0, 1.1, 0.014]}>
            {[0.40, 0.31, 0.22, 0.13].map((r, i) => (
              <mesh key={i}>
                <torusGeometry args={[r, 0.013, 10, 60]} />
                <meshStandardMaterial
                  color="#C8922A"
                  metalness={1.0}
                  roughness={0.06}
                  emissive="#7a5500"
                  emissiveIntensity={glow(3, 0.08, 0.7)}
                  transparent opacity={op(3)}
                />
              </mesh>
            ))}
          </group>
          {/* Heel coil — 3 rings */}
          <group position={[0, -1.55, 0.014]}>
            {[0.31, 0.22, 0.13].map((r, i) => (
              <mesh key={i}>
                <torusGeometry args={[r, 0.013, 10, 52]} />
                <meshStandardMaterial
                  color="#C8922A"
                  metalness={1.0}
                  roughness={0.06}
                  emissive="#7a5500"
                  emissiveIntensity={glow(3, 0.08, 0.7)}
                  transparent opacity={op(3)}
                />
              </mesh>
            ))}
          </group>
          {/* Trace connecting coils */}
          <mesh position={[0, -0.22, 0.014]} scale={[0.007, 2.5, 0.001]}>
            <boxGeometry />
            <meshStandardMaterial
              color="#D97706"
              emissive="#7a5000"
              emissiveIntensity={glow(3, 0.1, 0.5)}
              transparent opacity={op(3)}
            />
          </mesh>
        </group>

        {/* ══════════════════════════════════════════════════════════════════
            LAYER 4 — Flexible PCB  (green with gold traces + components)
        ═══════════════════════════════════════════════════════════════════ */}
        <group position={[0, 0, 0.265 + layerLift(4)]}>
          <mesh>
            <extrudeGeometry args={[layerShape95, thinEx]} />
            <meshPhysicalMaterial
              color="#0e3a16"
              roughness={0.40}
              metalness={0.18}
              transparent opacity={op(4)}
            />
          </mesh>
          {/* Gold circuit traces */}
          {[
            [-0.30,2.08],[0.08,2.20],[0.40,1.92],[-0.18,1.38],
            [0.28,1.22],[-0.22,0.28],[0.18,-0.36],[-0.10,-1.42],
          ].map(([x, y], i) => (
            <group key={i}>
              <mesh position={[x/2, y, 0.013]} scale={[Math.abs(x)+0.02, 0.009, 0.001]}>
                <boxGeometry />
                <meshStandardMaterial
                  color="#D97706" emissive="#7a5000"
                  emissiveIntensity={glow(4, 0.2, 0.9)}
                  transparent opacity={op(4)}
                />
              </mesh>
              <mesh position={[0, (y+0.32)/2, 0.013]} scale={[0.009, Math.abs(y-0.32)+0.02, 0.001]}>
                <boxGeometry />
                <meshStandardMaterial
                  color="#D97706" emissive="#7a5000"
                  emissiveIntensity={glow(4, 0.2, 0.9)}
                  transparent opacity={op(4)}
                />
              </mesh>
            </group>
          ))}
          {/* Main IC package */}
          <mesh position={[0.05, 0.32, 0.014]}>
            <boxGeometry args={[0.32, 0.32, 0.05]} />
            <meshStandardMaterial color="#0A1020" roughness={0.4} metalness={0.7} transparent opacity={op(4)} />
          </mesh>
          <mesh position={[0.05, 0.32, 0.040]}>
            <boxGeometry args={[0.18, 0.18, 0.01]} />
            <meshStandardMaterial color="#D97706" metalness={1.0} roughness={0.1} transparent opacity={op(4)} />
          </mesh>
          {/* SMD caps */}
          {[[-0.55,0.8],[0.55,0.8],[-0.55,-0.5],[0.55,-0.5]].map(([x,y],i) => (
            <mesh key={i} position={[x, y, 0.014]}>
              <boxGeometry args={[0.10, 0.06, 0.038]} />
              <meshStandardMaterial color="#c8c8b0" metalness={0.7} roughness={0.3} transparent opacity={op(4)} />
            </mesh>
          ))}
          {/* BLE antenna (meander near toe) */}
          <group position={[0.22, 2.05, 0.014]}>
            {[[0,0,0.14,0.007],[0.07,0.07,0.007,0.07],[0,0.14,0.14,0.007],[-0.07,0.21,0.007,0.07],[0,0.28,0.14,0.007]].map(([px,py,sx,sy],i) => (
              <mesh key={i} position={[px, py, 0]}>
                <boxGeometry args={[sx, sy, 0.002]} />
                <meshStandardMaterial
                  color="#F59E0B" metalness={0.9} roughness={0.1}
                  emissive="#7a5500"
                  emissiveIntensity={glow(4, 0.2, 1.0)}
                  transparent opacity={op(4)}
                />
              </mesh>
            ))}
          </group>
        </group>

        {/* ══════════════════════════════════════════════════════════════════
            LAYER 5 — Sensor Array  (dark grey with perforations, sensors)
        ═══════════════════════════════════════════════════════════════════ */}
        <group position={[0, 0, 0.280 + layerLift(5)]}>
          <mesh>
            <extrudeGeometry args={[layerShape95, midEx]} />
            <meshPhysicalMaterial
              color="#24282e"
              roughness={0.75}
              metalness={0.10}
              transparent opacity={op(5)}
            />
          </mesh>
          {/* Perforation holes */}
          {[
            [-0.62,-1.80],[-0.22,-1.80],[0.22,-1.80],[0.60,-1.80],
            [-0.62,-1.10],[-0.22,-1.10],[0.22,-1.10],[0.60,-1.10],
            [-0.62,-0.40],[-0.22,-0.40],[0.22,-0.40],[0.60,-0.40],
            [-0.52, 0.30],[-0.12, 0.30],[0.28, 0.30],[0.58, 0.30],
            [-0.48, 0.95],[-0.10, 0.95],[0.28, 0.95],[0.52, 0.95],
            [-0.44, 1.60],[-0.05, 1.60],[0.28, 1.60],[0.48, 1.60],
          ].map(([x, y], i) => (
            <mesh key={i} position={[x, y, 0.019]}>
              <cylinderGeometry args={[0.062, 0.062, 0.022, 10]} />
              <meshBasicMaterial color="#0e1018" transparent opacity={op(5) * 0.95} />
            </mesh>
          ))}
          {/* Pressure nodes (green) */}
          {[[-0.30,2.06],[0.08,2.18],[0.38,1.90],[-0.18,1.36],[0.28,1.20],[-0.20,0.26],[0.18,-0.38],[-0.08,-1.40]].map(([x,y],i) => (
            <mesh key={i} position={[x, y, 0.022]}>
              <cylinderGeometry args={[0.070, 0.070, 0.016, 20]} />
              <meshStandardMaterial
                color="#39B56A" emissive="#1a6030"
                emissiveIntensity={glow(5, 0.35, 1.5)}
                roughness={0.2}
                transparent opacity={op(5)}
              />
            </mesh>
          ))}
          {/* IMU chip in heel */}
          <group position={[0.05, -0.86, 0.013]}>
            <mesh>
              <boxGeometry args={[0.28, 0.28, 0.040]} />
              <meshStandardMaterial color="#0A1020" roughness={0.4} metalness={0.7} transparent opacity={op(5)} />
            </mesh>
            <mesh position={[0,0,0.022]}>
              <boxGeometry args={[0.16, 0.16, 0.008]} />
              <meshStandardMaterial color="#F59E0B" metalness={1.0} roughness={0.1} transparent opacity={op(5)} />
            </mesh>
          </group>
          {/* Thermal beads (teal) */}
          {[[-0.30,0.52],[0.26,1.16],[-0.18,-0.28],[0.04,-1.16]].map(([x,y],i) => (
            <mesh key={i} position={[x, y, 0.024]}>
              <sphereGeometry args={[0.055, 14, 14]} />
              <meshStandardMaterial
                color="#06B6D4" emissive="#0891B2"
                emissiveIntensity={glow(5, 0.35, 1.4)}
                transparent opacity={op(5)}
              />
            </mesh>
          ))}
          {/* Humidity rings */}
          {[[0.22,-0.12],[-0.20,0.76],[0.14,-1.46]].map(([x,y],i) => (
            <mesh key={i} position={[x, y, 0.022]}>
              <torusGeometry args={[0.090, 0.013, 10, 24]} />
              <meshStandardMaterial
                color="#06B6D4" emissive="#0891B2"
                emissiveIntensity={glow(5, 0.22, 1.0)}
                transparent opacity={op(5)}
              />
            </mesh>
          ))}
        </group>

        {/* ══════════════════════════════════════════════════════════════════
            LAYER 6 — PU Foam  (white/off-white cushioning layer)
        ═══════════════════════════════════════════════════════════════════ */}
        <group position={[0, 0, 0.300 + layerLift(6)]}>
          <mesh>
            <extrudeGeometry args={[layerShape90, {
              depth: 0.024, bevelEnabled: true, bevelSegments: 5,
              bevelSize: 0.010, bevelThickness: 0.010, steps: 1,
            }]} />
            <meshPhysicalMaterial
              color="#ccd2dc"
              roughness={0.92}
              metalness={0.0}
              transparent opacity={op(6)}
            />
          </mesh>
          {/* Foam texture lines */}
          {[-1.6,-0.8,0.0,0.8,1.6,2.4].map((y, i) => (
            <mesh key={i} position={[0, y, 0.026]}>
              <boxGeometry args={[1.35, 0.012, 0.003]} />
              <meshBasicMaterial color="#b0b8c4" transparent opacity={op(6) * 0.5} />
            </mesh>
          ))}
        </group>

        {/* ══════════════════════════════════════════════════════════════════
            LAYER 7 — Antibacterial Fabric  (top surface — CANVAS TEXTURE)
            This is what the user sees in the product photo
        ═══════════════════════════════════════════════════════════════════ */}
        <group position={[0, 0, 0.326 + layerLift(7)]}>
          {/* Outer black edge (visible rim in product photo) */}
          <mesh>
            <extrudeGeometry args={[insoleShape, {
              depth: 0.018, bevelEnabled: true, bevelSegments: 8,
              bevelSize: 0.020, bevelThickness: 0.016, steps: 1,
            }]} />
            <meshPhysicalMaterial
              color="#08090e"
              roughness={0.40}
              metalness={0.55}
              clearcoat={0.95}
              clearcoatRoughness={0.08}
              transparent opacity={op(7)}
            />
          </mesh>

          {/* Inner fabric surface WITH CANVAS TEXTURE */}
          <mesh position={[0, 0, 0.018]}>
            <extrudeGeometry args={[layerShape90, {
              depth: 0.004, bevelEnabled: false, steps: 1,
            }]} />
            <meshPhysicalMaterial
              map={fabricTexture}
              roughness={0.82}
              metalness={0.04}
              clearcoat={0.12}
              clearcoatRoughness={0.5}
              transparent opacity={op(7)}
            />
          </mesh>
        </group>

        {/* ══════════════════════════════════════════════════════════════════
            INTERACTIVE HOTSPOTS
        ═══════════════════════════════════════════════════════════════════ */}
        {(mode === "hotspots" || mode === "exploded") && (
          <group ref={pulseRef}>
            {hotspots.map((hs) => {
              const active  = isActive(hs.id);
              const zPos    = hs.pos[2] + layerLift(hs.layer) + 0.14;
              return (
                <group
                  key={hs.id}
                  position={[hs.pos[0], hs.pos[1], zPos]}
                  onClick={(e) => { e.stopPropagation(); handleClick(hs.id); }}
                >
                  {/* Outer halo ring */}
                  <mesh>
                    <ringGeometry args={[0.12, 0.16, 32]} />
                    <meshBasicMaterial
                      color={hs.color}
                      transparent opacity={active ? 0.90 : 0.32}
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                  {/* Pulsing sphere */}
                  <mesh>
                    <sphereGeometry args={[active ? 0.14 : 0.075, 20, 20]} />
                    <meshBasicMaterial color={hs.color} transparent opacity={active ? 0.70 : 0.24} />
                  </mesh>
                  {/* White core */}
                  <mesh>
                    <sphereGeometry args={[0.036, 12, 12]} />
                    <meshBasicMaterial color="#FFFFFF" />
                  </mesh>
                </group>
              );
            })}
          </group>
        )}

      </group>
    </group>
  );
}