const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '..', 'apps', 'api', 'src', 'routes', 'properties.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix PrismaClient
const prismaRegex = /const\s+prisma\s*=\s*new\s+PrismaClient\(\s*(?:{[^}]*}\s*)?\);?/g;
if (prismaRegex.test(content)) {
  const importRegex = /import\s*{\s*PrismaClient\s*}\s*from\s*['"]@prisma\/client['"];?/g;
  let hadPrismaImport = false;
  content = content.replace(importRegex, () => {
    hadPrismaImport = true;
    return `import { prisma } from '../lib/prisma';`;
  });

  if (!hadPrismaImport) {
      content = `import { prisma } from '../lib/prisma';\n` + content;
  }
  content = content.replace(prismaRegex, '');
}

// 2. Fix next(error) issues
const badCatchBlock1 = `    } catch (error: any) {
      console.error('PM Verify error:', error);
      if (error.status) {
        next(error);
      }
      return res.status(500).json({ error: 'Failed to execute PM verification step' });
    }`;

const goodCatchBlock1 = `    } catch (error: any) {
      console.error('PM Verify error:', error);
      if (error.status || error.statusCode || error.name === 'AppError') {
        return next(error);
      }
      return res.status(500).json({ error: 'Failed to execute PM verification step' });
    }`;

const badCatchBlock2 = `    } catch (error: any) {
      console.error('DM Polish error:', error);
      if (error.status) {
        next(error);
      }
      return res.status(500).json({ error: 'Failed to execute DM polish step' });
    }`;

const goodCatchBlock2 = `    } catch (error: any) {
      console.error('DM Polish error:', error);
      if (error.status || error.statusCode || error.name === 'AppError') {
        return next(error);
      }
      return res.status(500).json({ error: 'Failed to execute DM polish step' });
    }`;

const badCatchBlock3 = `    } catch (error: any) {
      console.error('MD Approve error:', error);
      if (error.status) {
        next(error);
      }
      return res.status(500).json({ error: 'Failed to execute MD approval step' });
    }`;

const goodCatchBlock3 = `    } catch (error: any) {
      console.error('MD Approve error:', error);
      if (error.status || error.statusCode || error.name === 'AppError') {
        return next(error);
      }
      return res.status(500).json({ error: 'Failed to execute MD approval step' });
    }`;

content = content.replace(badCatchBlock1, goodCatchBlock1);
content = content.replace(badCatchBlock2, goodCatchBlock2);
content = content.replace(badCatchBlock3, goodCatchBlock3);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed properties.ts via Node.js script safely!');
