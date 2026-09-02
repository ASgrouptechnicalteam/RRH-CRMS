const fs = require('fs');
const readline = require('readline');

async function searchSecrets() {
  const fileStream = fs.createReadStream('git_history.txt');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const findings = {};
  let currentFile = '';
  
  // Basic regexes for secrets
  const patterns = [
    { type: 'JWT Secret', regex: /JWT_SECRET\s*=\s*['"]?([a-zA-Z0-9_\-\.\+]+)/i },
    { type: 'Database URL', regex: /DATABASE_URL\s*=\s*['"]?([a-zA-Z0-9_\-\.\+:/]+)/i },
    { type: 'API Key', regex: /API_KEY\s*=\s*['"]?([a-zA-Z0-9_\-\.\+]+)/i },
    { type: 'AWS Secret', regex: /AWS_SECRET_ACCESS_KEY\s*=\s*['"]?([a-zA-Z0-9_\-\.\+]+)/i },
    { type: 'Stripe Key', regex: /STRIPE_SECRET_KEY\s*=\s*['"]?([a-zA-Z0-9_\-\.\+]+)/i },
    { type: 'SMTP Password', regex: /SMTP_PASSWORD\s*=\s*['"]?([a-zA-Z0-9_\-\.\+]+)/i },
  ];

  for await (const line of rl) {
    if (line.startsWith('+++ b/')) {
      currentFile = line.substring(6);
    }
    
    // Only look at additions
    if (line.startsWith('+') && !line.startsWith('+++')) {
      for (const pattern of patterns) {
        const match = line.match(pattern.regex);
        if (match && match[1] && match[1].length > 5 && !match[1].includes('your_') && !match[1].includes('example')) {
          if (!findings[pattern.type]) {
            findings[pattern.type] = 0;
          }
          findings[pattern.type]++;
        }
      }
    }
  }

  console.log('Secrets found by type:');
  console.log(JSON.stringify(findings, null, 2));
}

searchSecrets().catch(console.error);
