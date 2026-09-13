const { execSync } = require('child_process');

try {
  console.log('Running prisma db push...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('Running prisma generate...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Successfully updated DB schema and generated client.');
} catch (error) {
  console.error('Failed to update DB:', error.message);
}
