const fs = require('fs');
const path = require('path');

const apiSrcPath = path.join(__dirname, 'apps', 'api', 'src');
const loggerImportName = 'logger';

function getRelativePathToLogger(filePath) {
  const fileDir = path.dirname(filePath);
  const loggerPath = path.join(apiSrcPath, 'utils', 'logger');
  let relPath = path.relative(fileDir, loggerPath).replace(/\\/g, '/');
  if (!relPath.startsWith('.')) {
    relPath = './' + relPath;
  }
  return relPath;
}

function processDirectory(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && fullPath.endsWith('.ts') && entry.name !== 'logger.ts') {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const hasConsole = /console\.(log|error|warn|info)/.test(content);
      
      if (hasConsole) {
        content = content.replace(/console\.log/g, 'logger.info');
        content = content.replace(/console\.error/g, 'logger.error');
        content = content.replace(/console\.warn/g, 'logger.warn');
        content = content.replace(/console\.info/g, 'logger.info');
        
        const relPath = getRelativePathToLogger(fullPath);
        const importStatement = `import { logger } from '${relPath}';\n`;
        
        // Add import if not present
        if (!content.includes('import { logger }')) {
          content = importStatement + content;
        }
        
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(apiSrcPath);
console.log('Done replacing console calls.');
