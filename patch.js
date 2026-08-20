const fs = require('fs');

// Fix seed.ts
let seed = fs.readFileSync('prisma/seed.ts', 'utf8');
seed = seed.replace(
            },\n        },\n      );\n      console.log(\o. Employee created:,
            },\n        },\n      });\n      console.log(\o. Employee created:
);
seed = seed.replace(.then((mod) => mod.main());, .then((mod) => mod.main ? mod.main() : null);); // fallback if it's not exported
fs.writeFileSync('prisma/seed.ts', seed);

// Fix sonthillu-e2e.fixtures.ts
let fixtures = fs.readFileSync('prisma/fixtures/sonthillu-e2e.fixtures.ts', 'utf8');
fixtures = fixtures.replace(sync function main() {, export async function main() {);
fixtures = fixtures.replace(/^main\(\)[\s\S]*$/m, // main() is now exported and executed by the seed runner.);
fs.writeFileSync('prisma/fixtures/sonthillu-e2e.fixtures.ts', fixtures);
