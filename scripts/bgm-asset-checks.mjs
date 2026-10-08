// Verifies the three BGM files added for BaseCamp, Dungeon3 reminiscence / Dungeon10 ending
// and the Dungeon7 rescue story: byte identity (SHA-256), PCM WAV format and registry paths.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const EXPECTED = [
  { file: "public/assets/audio/bgm/basecamp-bgm.wav", sha256: "6611da1958c7b334995bafb7edd145f90e4aa4002cf77b107322c9105d5fcd23", size: 22233166 },
  { file: "public/assets/audio/bgm/revive-ending-scene.wav", sha256: "197f6b571f14fd89f77f7f883c13f105b63e441e9779c678a113800e43849418", size: 22712398 },
  { file: "public/assets/audio/bgm/save-deneb-dungeon7.wav", sha256: "f9cfb77aa37af96d906cf0591a4713b52c427a2fb649b4d6495538a1877fe430", size: 19062862 },
];

function check(condition, message) {
  if (!condition) throw new Error(`[bgm asset check] ${message}`);
}

for (const { file, sha256, size } of EXPECTED) {
  const bytes = readFileSync(file);
  check(bytes.length === size, `${file} size ${bytes.length} !== ${size}`);
  check(createHash("sha256").update(bytes).digest("hex") === sha256, `${file} SHA-256 mismatch`);
  check(bytes.toString("latin1", 0, 4) === "RIFF" && bytes.toString("latin1", 8, 12) === "WAVE", `${file} is not RIFF/WAVE`);
  let offset = 12;
  let format = null;
  while (offset + 8 <= bytes.length) {
    const id = bytes.toString("latin1", offset, offset + 4);
    const length = bytes.readUInt32LE(offset + 4);
    if (id === "fmt ") format = { tag: bytes.readUInt16LE(offset + 8), channels: bytes.readUInt16LE(offset + 10), rate: bytes.readUInt32LE(offset + 12), bits: bytes.readUInt16LE(offset + 22) };
    offset += 8 + length + (length & 1);
  }
  check(format && format.tag === 1 && format.channels === 2 && format.rate === 48000 && format.bits === 16, `${file} must be 16-bit 48kHz stereo PCM`);
}

const registry = readFileSync("src/game/audioBgm.ts", "utf8");
for (const { file } of EXPECTED) check(registry.includes(file.replace("public/", "")), `${file} not registered in audioBgm.ts`);
console.log(`BGM asset checks: ${EXPECTED.length} WAV byte-identical PCM 48kHz/16bit/stereo PASS; registry paths PASS`);
