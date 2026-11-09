import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GRID, PLATES, PLATE_SIZE, plateY } from "./lattice-geometry";

interface Props {
  active: number;
  reducedMotion: boolean;
  onReady?: () => void;
}

const STEEL = new THREE.Color("#8192A3");
const CYAN = new THREE.Color("#65DFFF");

/**
 * Five floor plates of a structure, one per discipline/role. The plate
 * matching the active role lights up and a scan line sweeps across it.
 * Raw three.js (no React renderer) keeps this chunk small; it renders only
 * while visible and holds a single still frame under reduced motion.
 */
export default function LatticeCanvas({ active, reducedMotion, onReady }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    camera.position.set(6, 5.2, 6);
    camera.lookAt(0, 0, 0);

    const rig = new THREE.Group();
    scene.add(rig);

    const h = PLATE_SIZE / 2;
    type Plate = {
      outline: THREE.LineBasicMaterial;
      grid: THREE.LineBasicMaterial;
      nodes: THREE.PointsMaterial;
      fill: THREE.MeshBasicMaterial;
      scan: THREE.Line;
      scanMat: THREE.LineBasicMaterial;
      y: number;
      level: number;
    };
    const plates: Plate[] = [];
    const disposables: Array<{ dispose: () => void }> = [];
    const track = <T extends { dispose: () => void }>(o: T) => (disposables.push(o), o);

    for (let i = 0; i < PLATES; i++) {
      const y = plateY(i);
      const g = new THREE.Group();
      g.position.y = y;

      const fillGeo = track(new THREE.PlaneGeometry(PLATE_SIZE, PLATE_SIZE));
      const fill = track(new THREE.MeshBasicMaterial({ color: 0x0c1118, transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false }));
      const plane = new THREE.Mesh(fillGeo, fill);
      plane.rotation.x = -Math.PI / 2;
      g.add(plane);

      const sq = [new THREE.Vector3(-h, 0, -h), new THREE.Vector3(h, 0, -h), new THREE.Vector3(h, 0, h), new THREE.Vector3(-h, 0, h)];
      const outline = track(new THREE.LineBasicMaterial({ color: STEEL.clone(), transparent: true, opacity: 0.5 }));
      g.add(new THREE.LineLoop(track(new THREE.BufferGeometry().setFromPoints(sq)), outline));

      const gridPts: THREE.Vector3[] = [];
      const nodePts: number[] = [];
      for (let k = 1; k < GRID; k++) {
        const t = -h + (k * PLATE_SIZE) / GRID;
        gridPts.push(new THREE.Vector3(t, 0, -h), new THREE.Vector3(t, 0, h), new THREE.Vector3(-h, 0, t), new THREE.Vector3(h, 0, t));
        for (let m = 1; m < GRID; m++) nodePts.push(t, 0, -h + (m * PLATE_SIZE) / GRID);
      }
      const grid = track(new THREE.LineBasicMaterial({ color: STEEL.clone(), transparent: true, opacity: 0.12 }));
      g.add(new THREE.LineSegments(track(new THREE.BufferGeometry().setFromPoints(gridPts)), grid));

      const nodeGeo = track(new THREE.BufferGeometry());
      nodeGeo.setAttribute("position", new THREE.Float32BufferAttribute(nodePts, 3));
      const nodes = track(new THREE.PointsMaterial({ color: STEEL.clone(), size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0.35 }));
      g.add(new THREE.Points(nodeGeo, nodes));

      const scanMat = track(new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0 }));
      const scan = new THREE.Line(track(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-h, 0.002, -h), new THREE.Vector3(-h, 0.002, h)])), scanMat);
      g.add(scan);

      rig.add(g);
      plates.push({ outline, grid, nodes, fill, scan, scanMat, y, level: i === activeRef.current ? 1 : 0 });
    }

    // Structural columns at the corners.
    const colMat = track(new THREE.LineBasicMaterial({ color: STEEL, transparent: true, opacity: 0.22 }));
    const top = plateY(0) + 0.35;
    const bottom = plateY(PLATES - 1) - 0.35;
    const cols: THREE.Vector3[] = [];
    for (const [x, z] of [[-h, -h], [h, -h], [h, h], [-h, h]]) cols.push(new THREE.Vector3(x, top, z), new THREE.Vector3(x, bottom, z));
    rig.add(new THREE.LineSegments(track(new THREE.BufferGeometry().setFromPoints(cols)), colMat));

    // Sizing — orthographic frustum fitted to the host.
    const fit = () => {
      const w = el.clientWidth || 1;
      const hh = el.clientHeight || 1;
      renderer.setSize(w, hh, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      const aspect = w / hh;
      const span = 2.9;
      camera.left = -span * aspect;
      camera.right = span * aspect;
      camera.top = span;
      camera.bottom = -span;
      if (aspect < 0.95) {
        camera.left = -span;
        camera.right = span;
        camera.top = span / aspect;
        camera.bottom = -span / aspect;
      }
      camera.updateProjectionMatrix();
    };
    fit();
    const ro = new ResizeObserver(() => {
      fit();
      if (reducedMotion) draw(0);
    });
    ro.observe(el);

    // Pointer — restrained tilt toward the cursor.
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    if (!reducedMotion) window.addEventListener("pointermove", onPointer, { passive: true });

    const draw = (time: number) => {
      const s = time / 1000;
      cur.x += (target.x - cur.x) * 0.04;
      cur.y += (target.y - cur.y) * 0.04;
      rig.rotation.y = (reducedMotion ? 0 : s * 0.07) + cur.x * 0.22;
      rig.rotation.x = cur.y * 0.06;

      plates.forEach((p, i) => {
        const want = i === activeRef.current ? 1 : 0;
        p.level = reducedMotion ? want : p.level + (want - p.level) * 0.07;
        const l = p.level;
        p.outline.color.copy(STEEL).lerp(CYAN, l);
        p.outline.opacity = 0.5 + l * 0.5;
        p.grid.color.copy(STEEL).lerp(CYAN, l);
        p.grid.opacity = 0.12 + l * 0.22;
        p.nodes.color.copy(STEEL).lerp(CYAN, l);
        p.nodes.opacity = 0.35 + l * 0.6;
        p.fill.opacity = 0.72 - l * 0.12;
        const sweep = reducedMotion ? 0.5 : (s * 0.35) % 1;
        p.scan.position.x = sweep * PLATE_SIZE;
        p.scanMat.opacity = l * (reducedMotion ? 0.6 : Math.sin(sweep * Math.PI) * 0.9);
      });
      renderer.render(scene, camera);
    };

    let raf = 0;
    let visible = true;
    const loop = (time: number) => {
      draw(time);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!raf && visible && !document.hidden && !reducedMotion) raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(el);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);

    draw(0);
    start();
    onReady?.();

    // Under reduced motion, redraw only when the active plate changes.
    let lastActive = activeRef.current;
    const poll = reducedMotion
      ? window.setInterval(() => {
          if (activeRef.current !== lastActive) {
            lastActive = activeRef.current;
            draw(0);
          }
        }, 250)
      : 0;

    return () => {
      stop();
      window.clearInterval(poll);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onPointer);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  return <div ref={host} className="absolute inset-0" aria-hidden />;
}
