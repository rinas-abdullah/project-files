/** Minimal PNG encoder for synthetic demo images (no external assets, no real patients). */
import { deflateSync } from "node:zlib";

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

export function encodePng(width: number, height: number, pixel: (x: number, y: number) => [number, number, number]) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 3 + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixel(x, y);
      const o = y * (width * 3 + 1) + 1 + x * 3;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Abstract "scene" illustration: dusk sky, road, two vehicle silhouettes. */
export function sceneImage(seed = 1) {
  const w = 480;
  const h = 300;
  return encodePng(w, h, (x, y) => {
    const horizon = 150;
    if (y < horizon) {
      const t = y / horizon;
      return [Math.round(30 + 60 * t), Math.round(45 + 50 * t), Math.round(90 + 60 * t)];
    }
    const lane = Math.abs(x - w / 2) < 3 + (y - horizon) * 0.05 && Math.floor(y / 14) % 2 === 0;
    if (lane) return [230, 210, 120];
    const car1 = x > 80 + seed * 10 && x < 210 + seed * 10 && y > 190 && y < 240;
    const car2 = x > 260 && x < 400 && y > 175 && y < 230;
    if (car1) return [180, 40, 40];
    if (car2) return [200, 200, 205];
    const light = Math.hypot(x - 330, y - 165) < 8;
    if (light) return [255, 80, 80];
    const g = 55 + Math.round(((y - horizon) / (h - horizon)) * 25);
    return [g, g, g + 5];
  });
}

/** Abstract wound/burn documentation placeholder (pattern only). */
export function documentImage(tone: [number, number, number]) {
  return encodePng(360, 360, (x, y) => {
    const d = Math.hypot(x - 180, y - 180);
    if (d < 70) return [tone[0], Math.round(tone[1] * (0.6 + d / 200)), tone[2]];
    if (x % 40 === 0 || y % 40 === 0) return [215, 220, 228];
    return [236, 228, 220];
  });
}
