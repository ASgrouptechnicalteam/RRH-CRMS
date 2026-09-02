const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'apps/api/src/routes');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = fs.statSync(dirFile).isDirectory() ? walkSync(dirFile, filelist) : filelist.concat(dirFile);
    } catch (err) {
      if (err.code === 'ENOENT' || err.code === 'EACCES') return;
      throw err;
    }
  });
  return filelist;
};

const files = walkSync(routesDir).filter(f => f.endsWith('.ts'));

const unvalidated = {};
let totalUnvalidated = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  let count = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/router\.(post|put|patch)\(/)) {
      // Check this line and the next few lines for validateRequestBody
      let hasValidation = false;
      for (let j = 0; j < 5 && (i + j) < lines.length; j++) {
        if (lines[i + j].includes('validateRequestBody')) {
          hasValidation = true;
          break;
        }
      }
      
      if (!hasValidation) {
        count++;
        totalUnvalidated++;
      }
    }
  }
  
  if (count > 0) {
    const domain = path.basename(file, '.ts');
    unvalidated[domain] = count;
  }
});

console.log(JSON.stringify({ total: totalUnvalidated, domains: unvalidated }, null, 2));
