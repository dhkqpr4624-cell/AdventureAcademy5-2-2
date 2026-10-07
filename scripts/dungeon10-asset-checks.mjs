// Run with: node scripts/dungeon10-asset-checks.mjs [originalUploadDir]
// Verifies every Dungeon10/ending PNG byte-for-byte facts: real PNG, size, bit depth,
// RGBA, alpha statistics, alpha bounding boxes, corners, SHA-256, the guard sprite
// sheet's 24 frames, and that the measured foot bounds match dungeon10Assets.ts.
// No package/lock changes; only node built-ins are used.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const publicDir = path.join(root, 'public');

function decodePng(file) {
  const bytes = fs.readFileSync(file);
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${file}: PNG signature`);
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  const bitDepth = bytes[24];
  const colorType = bytes[25];
  const interlace = bytes[28];
  assert.equal(bitDepth, 8, `${file}: 8-bit`);
  assert.ok(colorType === 6 || colorType === 2, `${file}: RGB/RGBA color type`);
  assert.equal(interlace, 0, `${file}: non-interlaced`);
  const channels = colorType === 6 ? 4 : 3;
  const idat = [];
  for (let offset = 8; offset + 8 <= bytes.length;) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT') idat.push(bytes.subarray(offset + 8, offset + 8 + length));
    if (type === 'IEND') break;
    offset += length + 12;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const pixels = Buffer.alloc(stride * height);
  const paeth = (a, b, c) => {
    const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x += 1) {
      const i = y * stride + x;
      const a = x >= channels ? pixels[i - channels] : 0;
      const b = y > 0 ? pixels[i - stride] : 0;
      const c = y > 0 && x >= channels ? pixels[i - stride - channels] : 0;
      const value = raw[y * (stride + 1) + x + 1];
      pixels[i] = (value + [0, a, b, (a + b) >> 1, paeth(a, b, c)][filter]) & 0xff;
    }
  }
  return { bytes, width, height, bitDepth, colorType, channels, pixels };
}

function analyze(png, region = { x: 0, y: 0, width: png.width, height: png.height }, threshold = 1) {
  const { pixels, width, channels } = png;
  let transparent = 0, partial = 0, opaque = 0, minAlpha = 255, maxAlpha = 0;
  let left = Infinity, top = Infinity, right = -1, bottom = -1;
  for (let y = region.y; y < region.y + region.height; y += 1) {
    for (let x = region.x; x < region.x + region.width; x += 1) {
      const alpha = channels === 4 ? pixels[(y * width + x) * 4 + 3] : 255;
      minAlpha = Math.min(minAlpha, alpha); maxAlpha = Math.max(maxAlpha, alpha);
      if (alpha === 0) transparent += 1; else if (alpha === 255) opaque += 1; else partial += 1;
      if (alpha >= threshold) {
        left = Math.min(left, x - region.x); right = Math.max(right, x - region.x);
        top = Math.min(top, y - region.y); bottom = Math.max(bottom, y - region.y);
      }
    }
  }
  return { transparent, partial, opaque, minAlpha, maxAlpha, bbox: right < 0 ? null : [left, top, right, bottom] };
}

function corners(png) {
  const at = (x, y) => [...png.pixels.subarray((y * png.width + x) * png.channels, (y * png.width + x) * png.channels + png.channels)];
  return [at(0, 0), at(png.width - 1, 0), at(0, png.height - 1), at(png.width - 1, png.height - 1)];
}

const ASSETS = [
  // [published path, width, height, needsTransparency, sha256]
  ['assets/dungeon10/boss/hungry-history-devourer-combat.png', 1254, 1254, true, 'def94e02dd12b766adbbe0968158da1232ed9e0fda00065015156a7bdacd5ef1'],
  ['assets/dungeon10/boss/hungry-history-devourer-standing-left.png', 1254, 1254, true, '45f34cdc73fdea9d49d05189d0a5037d97e394d2bf6acc55a0d6e68609782b3e'],
  ['assets/dungeon10/boss/hungry-history-devourer-charging.png', 1254, 1254, true, 'e0bc0accdf5d14abae3693beda0787d1d1ec0c8d440e34ed00c8b3da15ee7f96'],
  ['assets/dungeon10/vfx/deneb-guard-spritesheet.png', 1920, 720, true, '1c7f6eaf5f28071f41907583e14f27f89a24e5182644655d981ff11604389fe6'],
  ['assets/dungeon10/help/deneb-help.png', 2048, 768, true, '87b1c7d1f370378eea2f0773161db395eccb96389fc36e335b3de9f93e186793'],
  ['assets/dungeon10/help/karp-help.png', 2048, 768, true, 'dd271fbecefc49985cb87a5891362f2f0fdd2dfdc22e08c65eaf6caca07d3efe'],
  ['assets/dungeon10/help/aron-help.png', 2048, 768, true, 'bc1093d8de49081e435738de77dc47fea5eff3688a4f260678f8e3d237cacff8'],
  ['assets/dungeon10/final/theo-combat.png', 1231, 1278, true, '2207b81eb1f01dbfc16d2b1d577116c2d7666544bfd6cc2dd09b3ba5cb093019'],
  ['assets/dungeon10/final/luna-combat.png', 1024, 1536, true, '4bbdfbe3422cd2e75ca54b90f92e030c525fcebdc35e6d610ca14cb8c2a46380'],
  ['assets/dungeon10/final/karp-combat.png', 1374, 1145, true, '6d66931ffbc9cbe764a9ab0fa18b91965887b656ae7875f944634ebc129b282b'],
  ['assets/dungeon10/final/aron-combat.png', 1086, 1448, true, 'db3c803081616c92f152211f485680892967e218e27fc4cc4a58dc5aae47d880'],
  ['assets/npcs/chapter2/deneb/standing_R.png', 400, 700, true, 'b5f215021498bd6a89411b6c7c97f287207df8c422134738be27a1cb4a07e36d'],
  ['assets/dungeon10/ending/dungeon-exit.png', 1254, 1254, false, '421d8a4308fe49be4aea13eb96253c5930fc643df602c8c3cf83fc60f005728a'],
  ['assets/dungeon10/ending/farewell01.png', 1671, 941, false, 'b5f81f3ea7b31002a5e5bdf81c34ede4f531dc23bd3b3feb98cdd58afeb9f011'],
  ['assets/dungeon10/ending/farewell02.png', 1670, 942, false, '7c6e8ac9c87c53714084c524e51188b912e555a141d967c0df2b21ebd19eae3f'],
  ['assets/dungeon10/ending/farewell03.png', 1670, 942, false, '4bb37d6fbb7d3e2e972148030f854d092cc5567b35555753c48806007abd00c5'],
  ['assets/dungeon10/ending/farewell04.png', 1391, 1131, false, '9af83f6a63bd36bd3fe5f0faf7ef3ad569535eb8ec48c7edce04c4e5a0fc9a11'],
  ['assets/dungeon10/ending/credits/return.png', 1671, 941, false, '39e89ddf454d23339603897468af94b06c4598b130ad16f65904bbf510344c49'],
  ['assets/dungeon10/ending/credits/theo-luna.png', 1670, 942, false, '9c5c705f203cabf7bbc0fdf3233b0ba89efa858a486b81a940346f764a9115b7'],
  ['assets/dungeon10/ending/credits/aron.png', 1670, 942, false, '011500e7e0c092053d5a2bfe76d3f9ae8418d800c5dec91d649ea7a3516265e5'],
  ['assets/dungeon10/ending/credits/karp.png', 1670, 942, false, '7aa80e3caa33903f105ca11fafc88aaff31f672ecc7303a6e3d8380ebaebf56f'],
  ['assets/dungeon10/ending/credits/deneb.png', 1670, 942, false, '2af6148d00b4333fb628568933599e0b5f51c7568daf56a691fb82532fa49042'],
  // Powerful Impact weapon VFX (replaced in place, canonical path unchanged).
  ['assets/combat/vfx/powerful-impact.png', 800, 100, true, '97d823c8d093f574b456958b8238acf7bad2dae9b323b6eb2bb55aeee3a00f9d'],
];

const report = [];
const decoded = new Map();
for (const [published, width, height, needsTransparency, sha] of ASSETS) {
  const file = path.join(publicDir, published);
  const png = decodePng(file);
  decoded.set(published, png);
  const hash = crypto.createHash('sha256').update(png.bytes).digest('hex');
  assert.equal(hash, sha, `${published}: SHA-256`);
  assert.equal(png.width, width, `${published}: width`);
  assert.equal(png.height, height, `${published}: height`);
  const stats = analyze(png);
  if (needsTransparency) {
    assert.equal(png.colorType, 6, `${published}: RGBA`);
    assert.equal(stats.minAlpha, 0, `${published}: has fully transparent pixels`);
    assert.ok(stats.transparent > 0, `${published}: alpha 0 present`);
  }
  report.push({ published, width, height, bitDepth: png.bitDepth, rgba: png.colorType === 6, alpha: [stats.minAlpha, stats.maxAlpha], transparent: stats.transparent, partial: stats.partial, opaque: stats.opaque, bbox: stats.bbox, corners: corners(png), sha256: hash, bytes: png.bytes.length });
}

// Guard sprite sheet: 6x4 frames of 320x180, none empty, left→right / top→bottom.
const sheet = decoded.get('assets/dungeon10/vfx/deneb-guard-spritesheet.png');
const sheetStats = analyze(sheet);
assert.deepEqual(sheetStats.bbox, [104, 14, 1919, 708], 'sheet alpha bbox (inclusive) = (104,14)-(1920,709) exclusive');
assert.equal(sheetStats.partial, 0, 'sheet alpha is binary 0/255');
const frames = [];
for (let index = 0; index < 24; index += 1) {
  const column = index % 6, row = Math.floor(index / 6);
  const stats = analyze(sheet, { x: column * 320, y: row * 180, width: 320, height: 180 });
  assert.ok(stats.bbox, `frame ${index} is not empty`);
  frames.push({ index, column, row, bbox: stats.bbox, pixels: stats.opaque + stats.partial });
}

// Foot bounds (alpha >= 32) must match the data the Final map uses.
const assetsSource = fs.readFileSync(path.join(root, 'src/game/dungeon10/dungeon10Assets.ts'), 'utf8');
const boundsOf = (key) => {
  const match = assetsSource.match(new RegExp(`${key}: \\{ width: (\\d+), height: (\\d+), alphaBox: \\[(\\d+), (\\d+), (\\d+), (\\d+)\\] \\}`));
  assert.ok(match, `bounds for ${key} in dungeon10Assets.ts`);
  return match.slice(1).map(Number);
};
const FOOT_SOURCES = {
  theo: 'assets/dungeon10/final/theo-combat.png',
  luna: 'assets/dungeon10/final/luna-combat.png',
  karp: 'assets/dungeon10/final/karp-combat.png',
  aron: 'assets/dungeon10/final/aron-combat.png',
  deneb: 'assets/npcs/chapter2/deneb/standing_R.png',
  bossStanding: 'assets/dungeon10/boss/hungry-history-devourer-standing-left.png',
  bossCharging: 'assets/dungeon10/boss/hungry-history-devourer-charging.png',
};
const footReport = {};
for (const [key, published] of Object.entries(FOOT_SOURCES)) {
  const png = decoded.get(published);
  const measured = analyze(png, undefined, 32).bbox;
  const [width, height, ...box] = boundsOf(key);
  assert.deepEqual([width, height], [png.width, png.height], `${key}: data size`);
  assert.deepEqual(box, measured, `${key}: data alpha box matches the PNG`);
  footReport[key] = { size: [png.width, png.height], alphaBox: measured, footRow: measured[3] };
}

// Body columns (alpha >= 32 coverage >= 35% of the visible height) used to pack the party.
const bodySource = assetsSource.slice(assetsSource.indexOf('FINAL_MAP_BODY_COLUMNS'));
const bodyReport = {};
for (const key of ['theo', 'luna', 'karp', 'aron', 'deneb']) {
  const match = bodySource.match(new RegExp(`${key}: \\[(\\d+), (\\d+)\\]`));
  assert.ok(match, `body columns for ${key}`);
  const png = decoded.get(FOOT_SOURCES[key]);
  const [left, top, right, bottom] = analyze(png, undefined, 32).bbox;
  const height = bottom - top + 1;
  const columns = [];
  for (let x = left; x <= right; x += 1) {
    let count = 0;
    for (let y = top; y <= bottom; y += 1) if (png.pixels[(y * png.width + x) * 4 + 3] >= 32) count += 1;
    if (count / height >= 0.35) columns.push(x);
  }
  const measured = [columns[0], columns[columns.length - 1]];
  assert.deepEqual([Number(match[1]), Number(match[2])], measured, `${key}: body columns match the PNG`);
  bodyReport[key] = measured;
}

// Powerful Impact: 8 frames of 100x100, none empty, no pixel touching a frame edge (no bleeding).
const impact = decoded.get('assets/combat/vfx/powerful-impact.png');
const impactFrames = [];
for (let index = 0; index < 8; index += 1) {
  const stats = analyze(impact, { x: index * 100, y: 0, width: 100, height: 100 });
  assert.ok(stats.bbox, `impact frame ${index} is not empty`);
  const [l, t, r, b] = stats.bbox;
  assert.ok(l > 0 && t > 0 && r < 99 && b < 99, `impact frame ${index} stays inside its 100x100 cell`);
  impactFrames.push({ index, bbox: stats.bbox, pixels: stats.opaque + stats.partial });
}

// Optional: confirm byte-identity against the original uploads.
const uploadDir = process.argv[2];
let uploadMatches = null;
if (uploadDir && fs.existsSync(uploadDir)) {
  const uploads = new Map(fs.readdirSync(uploadDir).filter((name) => name.endsWith('.png')).map((name) => [crypto.createHash('sha256').update(fs.readFileSync(path.join(uploadDir, name))).digest('hex'), name]));
  uploadMatches = report.map((entry) => [entry.published, uploads.get(entry.sha256) ?? null]);
  uploadMatches.forEach(([published, source]) => assert.ok(source, `${published}: identical upload found`));
}

if (process.env.DUNGEON10_ASSET_REPORT) {
  fs.writeFileSync(process.env.DUNGEON10_ASSET_REPORT, JSON.stringify({ report, frames, footReport, bodyReport, impactFrames, uploadMatches }, null, 2));
}
console.log(`Dungeon10 asset checks: ${report.length} PNG PASS; guard sheet 24/24 frames non-empty PASS; foot bounds ${Object.keys(footReport).length} PASS; body columns ${Object.keys(bodyReport).length} PASS; powerful-impact 8/8 frames PASS${uploadMatches ? `; ${uploadMatches.length} byte-identical to uploads PASS` : ''}`);
