const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Standard ZIP file generator in pure Node.js
class SimpleZip {
  constructor() {
    this.files = [];
  }

  addFile(name, buffer) {
    // Standardize path separators to /
    const cleanName = name.replace(/\\/g, '/');
    this.files.push({ name: cleanName, buffer });
  }

  // CRC32 calculation
  static crc32(buf) {
    let crc = 0xffffffff;
    const table = SimpleZip.getCrcTable();
    for (let i = 0; i < buf.length; i++) {
      crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  static getCrcTable() {
    if (!this.crcTable) {
      this.crcTable = new Uint32Array(256);
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
          if (c & 1) c = 0xedb88320 ^ (c >>> 1);
          else c = c >>> 1;
        }
        this.crcTable[n] = c;
      }
    }
    return this.crcTable;
  }

  build() {
    const localHeaders = [];
    const cdHeaders = [];
    let offset = 0;

    for (const file of this.files) {
      const nameBuf = Buffer.from(file.name, 'utf8');
      const uncompressed = file.buffer;
      const compressed = zlib.deflateRawSync(uncompressed);
      const crc = SimpleZip.crc32(uncompressed);

      // Local Header
      const lh = Buffer.alloc(30 + nameBuf.length);
      lh.writeUInt32LE(0x04034b50, 0); // Local header sig
      lh.writeUInt16LE(20, 4);         // Version needed (2.0)
      lh.writeUInt16LE(0, 6);          // Flags
      lh.writeUInt16LE(8, 8);          // Deflate compression
      lh.writeUInt16LE(0, 10);         // Mod time
      lh.writeUInt16LE(0, 12);         // Mod date
      lh.writeUInt32LE(crc, 14);       // CRC32
      lh.writeUInt32LE(compressed.length, 18); // Compressed size
      lh.writeUInt32LE(uncompressed.length, 22); // Uncompressed size
      lh.writeUInt16LE(nameBuf.length, 26);
      lh.writeUInt16LE(0, 28);         // Extra field length
      nameBuf.copy(lh, 30);

      localHeaders.push(lh);
      localHeaders.push(compressed);

      // Central Directory Header
      const cdh = Buffer.alloc(46 + nameBuf.length);
      cdh.writeUInt32LE(0x02014b50, 0); // CD header sig
      cdh.writeUInt16LE(20, 4);         // Made by
      cdh.writeUInt16LE(20, 6);         // Version needed
      cdh.writeUInt16LE(0, 8);          // Flags
      cdh.writeUInt16LE(8, 10);         // Deflate
      cdh.writeUInt16LE(0, 12);         // Time
      cdh.writeUInt16LE(0, 14);         // Date
      cdh.writeUInt32LE(crc, 16);       // CRC32
      cdh.writeUInt32LE(compressed.length, 20); // Compressed size
      cdh.writeUInt32LE(uncompressed.length, 24); // Uncompressed size
      cdh.writeUInt16LE(nameBuf.length, 28);
      cdh.writeUInt16LE(0, 30);         // Extra len
      cdh.writeUInt16LE(0, 32);         // Comment len
      cdh.writeUInt16LE(0, 34);         // Disk start
      cdh.writeUInt16LE(0, 36);         // Internal attr
      cdh.writeUInt32LE(0, 38);         // External attr
      cdh.writeUInt32LE(offset, 42);    // Local header offset
      nameBuf.copy(cdh, 46);

      cdHeaders.push(cdh);

      offset += lh.length + compressed.length;
    }

    const cdStart = offset;
    let cdSize = 0;
    for (const cdh of cdHeaders) cdSize += cdh.length;

    // End of Central Directory Record (EOCD)
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0); // EOCD sig
    eocd.writeUInt16LE(0, 4);          // Disk num
    eocd.writeUInt16LE(0, 6);          // Start disk
    eocd.writeUInt16LE(this.files.length, 8);  // Disk entries
    eocd.writeUInt16LE(this.files.length, 10); // Total entries
    eocd.writeUInt32LE(cdSize, 12);     // CD size
    eocd.writeUInt32LE(cdStart, 16);    // CD offset
    eocd.writeUInt16LE(0, 20);          // Comment len

    return Buffer.concat([...localHeaders, ...cdHeaders, eocd]);
  }
}

function zipDirectory(sourceDir, outPath) {
  const zip = new SimpleZip();

  function walk(dir, base) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(base, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, relPath);
      } else {
        const content = fs.readFileSync(fullPath);
        zip.addFile(relPath, content);
      }
    }
  }

  walk(sourceDir, '');
  const buffer = zip.build();
  fs.writeFileSync(outPath, buffer);
  console.log(`Successfully generated zip archive: ${outPath} (${buffer.length} bytes)`);
}

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
const distDir = path.join(__dirname, 'dist');
const zipName = `webdist_${timestamp}.zip`;
const zipPath = path.join(__dirname, zipName);

if (fs.existsSync(distDir)) {
  zipDirectory(distDir, zipPath);
} else {
  console.error('dist directory does not exist. Run npm run build first!');
}
