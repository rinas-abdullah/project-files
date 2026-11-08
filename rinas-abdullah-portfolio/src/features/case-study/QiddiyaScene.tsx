import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * An abstract, newly made web sketch: districts of blocks on a grid, a route,
 * and an explorer marker travelling along it. Drag or use arrow keys to orbit.
 * This is NOT the original Unity game.
 */
export default function QiddiyaScene() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0c1118, 18, 46);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);

    scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x0c1118, 1.1));
    const sun = new THREE.DirectionalLight(0xffe2b0, 1.4);
    sun.position.set(8, 14, 6);
    scene.add(sun);

    const grid = new THREE.GridHelper(40, 40, 0x2a3a4a, 0x18232f);
    scene.add(grid);

    const disposables: Array<{ dispose: () => void }> = [];
    const blockGeo = new THREE.BoxGeometry(1, 1, 1);
    disposables.push(blockGeo);
    const matA = new THREE.MeshStandardMaterial({ color: 0x18232f, roughness: 0.85 });
    const matB = new THREE.MeshStandardMaterial({ color: 0x233140, roughness: 0.7 });
    const matAccent = new THREE.MeshStandardMaterial({ color: 0xe8b45a, roughness: 0.5, emissive: 0x3a2a10 });
    disposables.push(matA, matB, matAccent);

    // Deterministic districts of blocks.
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const districts = [
      [-7, -6],
      [6, -7],
      [-6, 6],
      [7, 5],
      [0, 0],
    ];
    districts.forEach(([cx, cz], d) => {
      for (let i = 0; i < 9; i++) {
        const h = 0.6 + rand() * (d === 4 ? 4.5 : 2.6);
        const m = new THREE.Mesh(blockGeo, i === 0 ? matAccent : rand() > 0.5 ? matA : matB);
        m.scale.set(0.8 + rand() * 1.2, h, 0.8 + rand() * 1.2);
        m.position.set(cx + (rand() - 0.5) * 5, h / 2, cz + (rand() - 0.5) * 5);
        scene.add(m);
      }
    });

    // A loop structure, as an abstract landmark.
    const ringGeo = new THREE.TorusGeometry(2.2, 0.08, 8, 64);
    disposables.push(ringGeo);
    const ring = new THREE.Mesh(ringGeo, matAccent);
    ring.position.set(0, 2.6, -10);
    scene.add(ring);

    // Route through the districts + explorer marker.
    const curve = new THREE.CatmullRomCurve3(
      [[-7, -6], [0, -9], [6, -7], [9, 0], [7, 5], [0, 8], [-6, 6], [-9, 0]].map(([x, z]) => new THREE.Vector3(x, 0.05, z)),
      true,
    );
    const routeGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(200));
    const routeMat = new THREE.LineDashedMaterial({ color: 0x65dfff, dashSize: 0.4, gapSize: 0.3 });
    disposables.push(routeGeo, routeMat);
    const route = new THREE.Line(routeGeo, routeMat);
    route.computeLineDistances();
    scene.add(route);

    const markerGeo = new THREE.ConeGeometry(0.3, 0.8, 4);
    const markerMat = new THREE.MeshStandardMaterial({ color: 0x65dfff, emissive: 0x0f4a5a });
    disposables.push(markerGeo, markerMat);
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.rotation.x = Math.PI;
    scene.add(marker);

    // Orbit state.
    const orbit = { theta: 0.7, phi: 0.95, r: 26 };
    const place = () => {
      camera.position.set(
        orbit.r * Math.sin(orbit.phi) * Math.cos(orbit.theta),
        orbit.r * Math.cos(orbit.phi),
        orbit.r * Math.sin(orbit.phi) * Math.sin(orbit.theta),
      );
      camera.lookAt(0, 0, 0);
    };

    let dragging = false;
    let lx = 0;
    let ly = 0;
    const down = (e: PointerEvent) => {
      dragging = true;
      lx = e.clientX;
      ly = e.clientY;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      orbit.theta += (e.clientX - lx) * 0.006;
      orbit.phi = THREE.MathUtils.clamp(orbit.phi - (e.clientY - ly) * 0.004, 0.35, 1.35);
      lx = e.clientX;
      ly = e.clientY;
    };
    const up = () => (dragging = false);
    const key = (e: KeyboardEvent) => {
      const map: Record<string, () => void> = {
        ArrowLeft: () => (orbit.theta -= 0.12),
        ArrowRight: () => (orbit.theta += 0.12),
        ArrowUp: () => (orbit.phi = Math.max(0.35, orbit.phi - 0.08)),
        ArrowDown: () => (orbit.phi = Math.min(1.35, orbit.phi + 0.08)),
        "+": () => (orbit.r = Math.max(14, orbit.r - 1.5)),
        "=": () => (orbit.r = Math.max(14, orbit.r - 1.5)),
        "-": () => (orbit.r = Math.min(36, orbit.r + 1.5)),
      };
      if (map[e.key]) {
        e.preventDefault();
        map[e.key]();
      }
    };
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.addEventListener("pointerdown", down);
    renderer.domElement.addEventListener("pointermove", move);
    renderer.domElement.addEventListener("pointerup", up);
    renderer.domElement.addEventListener("pointercancel", up);
    el.addEventListener("keydown", key);

    const fit = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);

    let raf = 0;
    let t = 0;
    const tick = () => {
      if (!reduced) {
        t = (t + 0.0009) % 1;
        if (!dragging) orbit.theta += 0.0012;
        ring.rotation.y += 0.004;
      }
      const p = curve.getPointAt(t);
      marker.position.set(p.x, 0.9 + Math.sin(t * 60) * 0.08, p.z);
      place();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("keydown", key);
      disposables.forEach((d) => d.dispose());
      grid.geometry.dispose();
      (grid.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={host}
      tabIndex={0}
      role="application"
      aria-label="Abstract 3D city sketch. Use arrow keys to orbit, plus and minus to zoom."
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
    />
  );
}
