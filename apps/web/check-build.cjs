const { execSync } = require('child_process');

try {
  console.log('Building apps/web dist...');
  const output = execSync('npx vite build', { cwd: __dirname, encoding: 'utf8' });
  console.log('Build Output:', output);
} catch (err) {
  console.error('Build Error:', err.stdout || err.message);
}
