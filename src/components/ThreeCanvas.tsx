"use client";

import React from "react";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";

export default function ThreeCanvas({
  children,
  cameraPos = [0, 0, 8],
  enableZoom = false,
  enableRotate = true,
  enablePan = false,
  autoRotate = false,
}: {
  children: React.ReactNode;
  cameraPos?: [number, number, number];
  enableZoom?: boolean;
  enableRotate?: boolean;
  enablePan?: boolean;
  autoRotate?: boolean;
}) {
  // "use client" already prevents SSR; avoid state gating that triggers lint issues.


  return (
    <div className="w-full h-full relative bg-transparent">
      <Canvas shadows gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}>
        <PerspectiveCamera makeDefault position={cameraPos} fov={45} />
        
        {/* Premium studio lighting — tuned for dark glossy product */}
        <ambientLight intensity={0.9} color="#b8c8e0" />
        {/* Key light — strong top-right (matches product photo lighting) */}
        <directionalLight
          position={[5, 16, 10]}
          intensity={3.8}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          color="#f8f4ff"
        />
        {/* Rim light — back-left, creates glossy edge highlight on black */}
        <directionalLight position={[-12, 6, -8]}  intensity={2.0} color="#9ab8d8" />
        {/* Under-bounce — soft cool fill from below */}
        <pointLight    position={[0, -10, 5]}  intensity={1.2} color="#0B4D8D" />
        {/* Teal accent — echoes the product LED colour */}
        <pointLight    position={[-3, 5, 8]}   intensity={0.9} color="#06B6D4" />
        {/* Warm front fill */}
        <pointLight    position={[6, 2, 10]}   intensity={0.6} color="#fffaf0" />
        
        {children}
        
        <OrbitControls
          enableZoom={enableZoom}
          enableRotate={enableRotate}
          enablePan={enablePan}
          autoRotate={autoRotate}
          autoRotateSpeed={0.8}
          maxPolarAngle={Math.PI / 1.4}
          minPolarAngle={Math.PI / 3}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}
