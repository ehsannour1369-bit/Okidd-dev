import fs from "fs";
import path from "path";
import zlib from "zlib";

const ROOT = "/home/runner/workspace";
const OUT = "/home/runner/workspace/okidd-export.zip";

const EXCLUDES = new Set([
  "node_modules", ".git", ".cache", ".local",
  "dist", ".turbo", "okidd-export.zip", "okidd_export.tar.gz",
]);

function shouldSkip(relPath) {
  const parts = relPath.split(path.sep);
  return parts.some(p => EXCLUDES.has(p));
}

function walk(dir, base = "") {
  const files = [];
  for (const name of fs.readdirSync(dir)) {
    const rel = base ? path.join(base, name) : name;
    if (shouldSkip(rel)) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) files.push(...walk(full, rel));
    else files.push({ full, rel });
  }
  return files;
}

// Minimal ZIP writer
function uint16LE(n) { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b; }
function uint32LE(n) { const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0); return b; }

function crc32(buf) {
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c;
    }
    return t;
  })());
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

const entries = [];
const chunks = [];
let offset = 0;

const files = walk(ROOT);
console.log(`Packing ${files.length} files…`);

for (const { full, rel } of files) {
  const name = rel.replace(/\\/g, "/");
  const nameBytes = Buffer.from(name, "utf8");
  const raw = fs.readFileSync(full);
  const compressed = zlib.deflateRawSync(raw, { level: 6 });
  const crc = crc32(raw);
  const localHeader = Buffer.concat([
    Buffer.from([0x50, 0x4B, 0x03, 0x04]),
    uint16LE(20), uint16LE(0), uint16LE(8),
    uint16LE(0), uint16LE(0),
    uint32LE(crc),
    uint32LE(compressed.length),
    uint32LE(raw.length),
    uint16LE(nameBytes.length),
    uint16LE(0),
    nameBytes,
  ]);
  entries.push({ name: nameBytes, crc, compressedSize: compressed.length, uncompressedSize: raw.length, offset });
  chunks.push(localHeader, compressed);
  offset += localHeader.length + compressed.length;
}

// Central directory
const cdChunks = [];
for (const e of entries) {
  const cd = Buffer.concat([
    Buffer.from([0x50, 0x4B, 0x01, 0x02]),
    uint16LE(20), uint16LE(20), uint16LE(0), uint16LE(8),
    uint16LE(0), uint16LE(0),
    uint32LE(e.crc),
    uint32LE(e.compressedSize),
    uint32LE(e.uncompressedSize),
    uint16LE(e.name.length), uint16LE(0), uint16LE(0),
    uint16LE(0), uint16LE(0), uint32LE(0),
    uint32LE(e.offset),
    e.name,
  ]);
  cdChunks.push(cd);
}
const cdBuf = Buffer.concat(cdChunks);
const eocd = Buffer.concat([
  Buffer.from([0x50, 0x4B, 0x05, 0x06]),
  uint16LE(0), uint16LE(0),
  uint16LE(entries.length), uint16LE(entries.length),
  uint32LE(cdBuf.length),
  uint32LE(offset),
  uint16LE(0),
]);

fs.writeFileSync(OUT, Buffer.concat([...chunks, cdBuf, eocd]));
const size = fs.statSync(OUT).size;
console.log(`✓ ${OUT}  (${(size / 1024 / 1024).toFixed(1)} MB, ${files.length} files)`);
