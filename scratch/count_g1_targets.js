const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function runRgCount(query, dirs) {
  try {
    // using ripgrep if installed, but since this is Windows and I'm not sure if rg is on PATH, 
    // I can just walk the directories.
  } catch(e) {}
}

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

const counts = {
  'as any': 0,
  ': any': 0,
  'useState<any': 0,
  '@ts-ignore': 0,
  '@ts-expect-error': 0
};

const searchDirs = ['apps/api/src', 'apps/web/src'];
const files = [];
searchDirs.forEach(d => {
  if (fs.existsSync(d)) {
    files.push(...walkSync(d).filter(f => f.endsWith('.ts') || f.endsWith('.tsx')));
  }
});

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  counts['as any'] += (content.match(/as any/g) || []).length;
  counts[': any'] += (content.match(/: any/g) || []).length;
  counts['useState<any'] += (content.match(/useState<any/g) || []).length;
  counts['@ts-ignore'] += (content.match(/@ts-ignore/g) || []).length;
  counts['@ts-expect-error'] += (content.match(/@ts-expect-error/g) || []).length;
});

console.log(JSON.stringify(counts, null, 2));
