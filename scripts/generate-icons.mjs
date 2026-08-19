import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function png(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const rOuter = size * 0.42;
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      let r = 15;
      let g = 23;
      let b = 42;
      let a = 0;
      if (d <= rOuter) {
        a = 255;
        if (d > rOuter * 0.82) {
          r = 22;
          g = 101;
          b = 52;
        } else {
          const t = (d / rOuter) * 0.4 + (dy / size) * 0.2;
          r = Math.round(244 - t * 40);
          g = Math.round(63 + t * 40);
          b = 94;
          if ((x + y) % 19 < 3 && d < rOuter * 0.7) {
            r = 250;
            g = 250;
            b = 250;
          }
        }
      }
      const i = row + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'icon-192.png'), png(192));
writeFileSync(join(dir, 'icon-512.png'), png(512));
writeFileSync(
  join(dir, 'icon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#0f172a"/>
  <circle cx="50" cy="52" r="32" fill="#22c55e"/>
  <circle cx="50" cy="52" r="26" fill="#fb7185"/>
  <circle cx="40" cy="44" r="4" fill="#fff"/>
  <path d="M50 16c8 8 8 16 0 22c-8-6-8-14 0-22z" fill="#16a34a"/>
</svg>`,
);
console.log('Wrote PWA icons to', dir);
