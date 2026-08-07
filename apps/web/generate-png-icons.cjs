const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation for PNG chunks
function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

const crcTable = createCRC32Table();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crcVal = crc32(buf.subarray(4, 4 + 4 + len));
  buf.writeUInt32BE(crcVal, 4 + 4 + len);
  return buf;
}

function createPng(width, height, r, g, b) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter method
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data with scanlines
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Draw a sleek rounded icon with brand teal background (#0f766e) and gold/white central square
      const margin = Math.floor(width * 0.1);
      const isInnerGold = (x >= width * 0.35 && x <= width * 0.65 && y >= height * 0.35 && y <= height * 0.65);
      const isInnerWhite = (x >= width * 0.42 && x <= width * 0.58 && y >= height * 0.42 && y <= height * 0.58);

      if (isInnerWhite) {
        rawData[pxOffset] = 255;     // R
        rawData[pxOffset + 1] = 255; // G
        rawData[pxOffset + 2] = 255; // B
      } else if (isInnerGold) {
        rawData[pxOffset] = 217;     // R (#d97706 amber)
        rawData[pxOffset + 1] = 119; // G
        rawData[pxOffset + 2] = 6;   // B
      } else {
        rawData[pxOffset] = r;       // R (0x0f)
        rawData[pxOffset + 1] = g;   // G (0x76)
        rawData[pxOffset + 2] = b;   // B (0x6e)
      }
      rawData[pxOffset + 3] = 255; // Alpha
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Brand teal #0f766e -> R:15, G:118, B:110
const appleTouchIcon = createPng(180, 180, 15, 118, 110);
const icon192 = createPng(192, 192, 15, 118, 110);
const icon512 = createPng(512, 512, 15, 118, 110);

fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchIcon);
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), icon192);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), icon512);

console.log('Successfully generated apple-touch-icon.png, icon-192.png, and icon-512.png in apps/web/public!');
