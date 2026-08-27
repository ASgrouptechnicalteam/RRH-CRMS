const fs = require('fs');

const files = [
  'apps/api/src/server.ts',
  'apps/api/src/routes/auth.ts',
  'apps/api/src/routes/admin.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove the bypass line completely
  content = content.replace(/const p = prisma as any;\r?\n/g, '');
  
  // Replace all p. calls with prisma.
  // Use negative lookbehind or just exact regex to avoid matching things like `req.ip.` (though p. is what we want)
  // \bp\. matches "p." with a word boundary before it (like whitespace or symbol)
  content = content.replace(/\bp\./g, 'prisma.');
  
  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
}
