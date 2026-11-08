/** Shared geometry for the hero lattice — used by both the WebGL scene and the SVG fallback. */
export const PLATES = 5;
export const PLATE_SIZE = 2.4;
export const PLATE_GAP = 0.62;
export const GRID = 6;

export const plateY = (i: number) => (i - (PLATES - 1) / 2) * PLATE_GAP * -1;

/** Isometric projection used for the static SVG drawing. */
export const iso = (x: number, y: number, z: number, scale = 70) => {
  const a = Math.PI / 6;
  return {
    x: (x - z) * Math.cos(a) * scale,
    y: ((x + z) * Math.sin(a) - y) * scale,
  };
};
