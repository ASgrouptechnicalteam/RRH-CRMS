const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const apiSrcDir = path.join(rootDir, 'apps', 'api', 'src');
const testsDir = path.join(rootDir, 'tests');

const singletonPath = path.join(apiSrcDir, 'lib', 'prisma.ts');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.ts')) return;
  if (filePath === singletonPath) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Check if file instantiates PrismaClient
  const prismaRegex = /const\s+prisma\s*=\s*new\s+PrismaClient\(\s*(?:{[^}]*}\s*)?\);?/g;
  if (prismaRegex.test(content)) {
    // Determine relative path to singleton
    const relativePath = path.relative(path.dirname(filePath), singletonPath).replace(/\\/g, '/').replace('.ts', '');
    const importPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;

    // Remove `import { PrismaClient } from '@prisma/client';`
    const importRegex = /import\s*{\s*PrismaClient\s*}\s*from\s*['"]@prisma\/client['"];?/g;
    let hadPrismaImport = false;
    content = content.replace(importRegex, () => {
      hadPrismaImport = true;
      return `import { prisma } from '${importPath}';`;
    });

    if (!hadPrismaImport) {
        // If they didn't import PrismaClient directly but still used it, just inject the import
        content = `import { prisma } from '${importPath}';\n` + content;
    }

    // Remove the instantiation
    content = content.replace(prismaRegex, '');

    // Write back
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${path.relative(rootDir, filePath)}`);
    }
  }
}

walkDir(apiSrcDir, processFile);
walkDir(testsDir, processFile);
console.log('Refactoring complete.');
