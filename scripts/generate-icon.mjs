import { writeFileSync } from 'node:fs';
// Deterministic 32px brand mark, stored as a standard 32-bit BMP-backed ICO.
const size = 32;
const maskBytes = size * 4;
const bitmap = Buffer.alloc(40 + size * size * 4 + maskBytes);
bitmap.writeUInt32LE(40, 0);
bitmap.writeInt32LE(size, 4);
bitmap.writeInt32LE(size * 2, 8);
bitmap.writeUInt16LE(1, 12);
bitmap.writeUInt16LE(32, 14);
bitmap.writeUInt32LE(size * size * 4, 20);
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const dx = x - 15.5;
    const dy = y - 15.5;
    const distance = Math.hypot(dx, dy);
    const white = Math.abs(distance - 10) < 1 || distance < 2 || (dx >= 0 && dy <= 0 && Math.abs(dx + dy) < 1 && distance < 10);
    const color = white ? [246, 247, 243] : [20, 92, 67];
    const offset = 40 + ((size - 1 - y) * size + x) * 4;
    bitmap.set([color[2], color[1], color[0], 255], offset);
  }
}
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header[6] = size;
header[7] = size;
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(bitmap.length, 14);
header.writeUInt32LE(header.length, 18);
writeFileSync(new URL('../app/favicon.ico', import.meta.url), Buffer.concat([header, bitmap]));
console.log('Generated app/favicon.ico (32x32 radar brand mark).');
