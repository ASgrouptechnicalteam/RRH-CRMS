const fs = require('fs');
const path = require('path');

function processDir(baseDir, currentDir) {
  const sharedDir = path.join(baseDir, 'shared');
  const files = fs.readdirSync(currentDir);
  for (const file of files) {
    const fullPath = path.join(currentDir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(baseDir, fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('@rrh-ems/shared')) {
        let relativeToShared = path.relative(path.dirname(fullPath), sharedDir).replace(/\\/g, '/');
        if (!relativeToShared.startsWith('.')) {
          relativeToShared = './' + relativeToShared;
        }
        content = content.replace(/'@rrh-ems\/shared'/g, `'${relativeToShared}'`);
        content = content.replace(/"@rrh-ems\/shared"/g, `"${relativeToShared}"`);
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath} -> ${relativeToShared}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'apps/api/src'), path.join(__dirname, 'apps/api/src'));
processDir(path.join(__dirname, 'apps/web/src'), path.join(__dirname, 'apps/web/src'));
