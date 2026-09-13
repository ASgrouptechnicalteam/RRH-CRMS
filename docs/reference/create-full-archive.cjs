const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

class SimpleZip {
  constructor() {
    this.files = [];
  }

  addFile(name, buffer) {
    const cleanName = name.replace(/\\/g, '/');
    this.files.push({ name: cleanName, buffer });
  }

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

      const lh = Buffer.alloc(30 + nameBuf.length);
      lh.writeUInt32LE(0x04034b50, 0); 
      lh.writeUInt16LE(20, 4);         
      lh.writeUInt16LE(0, 6);          
      lh.writeUInt16LE(8, 8);          
      lh.writeUInt16LE(0, 10);         
      lh.writeUInt16LE(0, 12);         
      lh.writeUInt32LE(crc, 14);       
      lh.writeUInt32LE(compressed.length, 18); 
      lh.writeUInt32LE(uncompressed.length, 22); 
      lh.writeUInt16LE(nameBuf.length, 26);
      lh.writeUInt16LE(0, 28);         
      nameBuf.copy(lh, 30);

      localHeaders.push(lh);
      localHeaders.push(compressed);

      const cdh = Buffer.alloc(46 + nameBuf.length);
      cdh.writeUInt32LE(0x02014b50, 0); 
      cdh.writeUInt16LE(20, 4);         
      cdh.writeUInt16LE(20, 6);         
      cdh.writeUInt16LE(0, 8);          
      cdh.writeUInt16LE(8, 10);         
      cdh.writeUInt16LE(0, 12);         
      cdh.writeUInt16LE(0, 14);         
      cdh.writeUInt32LE(crc, 16);       
      cdh.writeUInt32LE(compressed.length, 20); 
      cdh.writeUInt32LE(uncompressed.length, 24); 
      cdh.writeUInt16LE(nameBuf.length, 28);
      cdh.writeUInt16LE(0, 30);         
      cdh.writeUInt16LE(0, 32);         
      cdh.writeUInt16LE(0, 34);         
      cdh.writeUInt16LE(0, 36);         
      cdh.writeUInt32LE(0, 38);         
      cdh.writeUInt32LE(offset, 42);    
      nameBuf.copy(cdh, 46);

      cdHeaders.push(cdh);

      offset += lh.length + compressed.length;
    }

    const cdStart = offset;
    let cdSize = 0;
    for (const cdh of cdHeaders) cdSize += cdh.length;

    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0); 
    eocd.writeUInt16LE(0, 4);          
    eocd.writeUInt16LE(0, 6);          
    eocd.writeUInt16LE(this.files.length, 8);  
    eocd.writeUInt16LE(this.files.length, 10); 
    eocd.writeUInt32LE(cdSize, 12);     
    eocd.writeUInt32LE(cdStart, 16);    
    eocd.writeUInt16LE(0, 20);          

    return Buffer.concat([...localHeaders, ...cdHeaders, eocd]);
  }
}

function zipDirectory(sourceDir, outPath) {
  const zip = new SimpleZip();
  const excludeFolders = ['node_modules', '.git', '.vscode', '.agents', 'uploads'];

  function walk(dir, base) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (excludeFolders.includes(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(base, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, relPath);
      } else {
        if (entry.name.endsWith('.zip')) continue;
        let content = fs.readFileSync(fullPath);
        if (entry.name === '.env') {
          const text = content.toString('utf8');
          const replaced = text.replace(/82\.25\.121\.145/g, '127.0.0.1');
          content = Buffer.from(replaced, 'utf8');
        }
        zip.addFile(relPath, content);
      }
    }
  }

  walk(sourceDir, '');
  const buffer = zip.build();
  fs.writeFileSync(outPath, buffer);
  console.log(`Successfully generated full project zip archive: ${outPath} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
}

const outPath = path.join(__dirname, '..', 'archive.zip');
console.log('Zipping full project (excluding node_modules)... this may take 5-10 seconds.');
zipDirectory(__dirname, outPath);
