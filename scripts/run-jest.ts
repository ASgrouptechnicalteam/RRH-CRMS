import { execSync } from 'child_process';
import fs from 'fs';

try {
  console.log("Running jest...");
  // Run jest and capture output
  const output = execSync('npx jest --config jest.config.js --runInBand --runTestsByPath tests/api/rbac.test.ts 2>&1', {
    cwd: 'd:\\HYD\\RRH PWA',
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  console.log("Jest passed.");
  fs.writeFileSync('d:\\HYD\\RRH PWA\\jest_output.txt', output);
} catch (e: any) {
  console.log("Jest failed.");
  fs.writeFileSync('d:\\HYD\\RRH PWA\\jest_output.txt', e.stdout || e.message);
}
