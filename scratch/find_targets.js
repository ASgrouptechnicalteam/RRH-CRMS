const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = fs.statSync(dirFile).isDirectory() ? walkSync(dirFile, filelist) : filelist.concat(dirFile);
    } catch (err) {
      if (err.code === 'ENOENT') {
        return;
      }
      throw err;
    }
  });
  return filelist;
};

const searchDirs = ['apps/api/src', 'apps/web/src'];
const files = [];
searchDirs.forEach(d => {
  if (fs.existsSync(d)) {
    files.push(...walkSync(d).filter(f => f.endsWith('.ts') || f.endsWith('.tsx')));
  }
});

const asAnyFiles = [];
const anyTypeFiles = [];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('as any')) {
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.includes('as any')) {
        asAnyFiles.push(`${f}:${i + 1} - ${line.trim()}`);
      }
    });
  }
  if (content.match(/: any/)) {
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.match(/: any/)) {
        anyTypeFiles.push(`${f}:${i + 1} - ${line.trim()}`);
      }
    });
  }
});

fs.writeFileSync('scratch/g1_t6_audit.txt', `AS ANY (${asAnyFiles.length}):\n` + asAnyFiles.join('\n') + `\n\n: ANY (${anyTypeFiles.length}):\n` + anyTypeFiles.join('\n'));
