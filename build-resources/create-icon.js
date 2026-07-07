/**
 * Generates build-resources/icon.ico from an embedded SVG.
 * Run once: node build-resources/create-icon.js
 * Requires: npm install --save-dev sharp
 */
const path = require('path');
const fs = require('fs');

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb"/>
      <stop offset="100%" style="stop-color:#1e40af"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="48" fill="url(#bg)"/>
  <text x="128" y="168" font-family="Arial,sans-serif" font-size="128" font-weight="700"
        text-anchor="middle" fill="white">SP</text>
</svg>`;

async function main() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.error('Run: npm install --save-dev sharp');
    process.exit(1);
  }

  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const pngs = await Promise.all(
    sizes.map((s) =>
      sharp(Buffer.from(SVG)).resize(s, s).png().toBuffer()
    )
  );

  // Build ICO file (ICONDIR + ICONDIRENTRYs + image data)
  const count = sizes.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);      // reserved
  header.writeUInt16LE(1, 2);      // type: ICO
  header.writeUInt16LE(count, 4);  // image count

  const entries = Buffer.alloc(count * 16);
  for (let i = 0; i < count; i++) {
    const s = sizes[i];
    const png = pngs[i];
    entries.writeUInt8(s >= 256 ? 0 : s, i * 16);      // width (0 = 256)
    entries.writeUInt8(s >= 256 ? 0 : s, i * 16 + 1);  // height
    entries.writeUInt8(0, i * 16 + 2);                  // color count
    entries.writeUInt8(0, i * 16 + 3);                  // reserved
    entries.writeUInt16LE(1, i * 16 + 4);               // color planes
    entries.writeUInt16LE(32, i * 16 + 6);              // bit count
    entries.writeUInt32LE(png.length, i * 16 + 8);      // data size
    entries.writeUInt32LE(offset, i * 16 + 12);         // offset
    offset += png.length;
  }

  const ico = Buffer.concat([header, entries, ...pngs]);
  const out = path.join(__dirname, 'icon.ico');
  fs.writeFileSync(out, ico);
  console.log('Created:', out, `(${(ico.length / 1024).toFixed(1)} KB)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
