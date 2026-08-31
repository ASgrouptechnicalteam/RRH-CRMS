const fs = require('fs');
const path = require('path');

const phase1Files = [
  'apps/web/src/components/leads/LeadManagement.tsx',
  'apps/web/src/components/leads/AddLeadWizard.tsx',
  'apps/web/src/components/leads/QuickAddLeadModal.tsx',
  'apps/web/src/components/siteVisits/SiteVisitManagement.tsx',
  'apps/web/src/components/sales/SalesPipelineManagement.tsx',
  'apps/web/src/components/customers/CustomerManagement.tsx',
  'apps/web/src/components/common/ReassignModal.tsx'
];

function processFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Ensure `showError` is extracted from useToast()
  if (content.includes('useToast()') && !content.includes('showError')) {
    content = content.replace(/const {([^}]*showToast[^}]*)} = useToast\(\);/g, (match, inner) => {
      if (inner.includes('showError')) return match;
      return `const {${inner}, showError } = useToast();`;
    });
    // In case it's `const { showToast } = useToast();`
    content = content.replace(/const {\s*showToast\s*} = useToast\(\);/g, 'const { showToast, showError } = useToast();');
  }

  // 2. Ensure `handleApiError` and `toUserFacingError` are imported
  if (!content.includes('handleApiError')) {
    const importRegex = /import .* from '.*\/userFacingError';/;
    if (importRegex.test(content)) {
      content = content.replace(importRegex, (match) => match.replace('}', ', handleApiError, toUserFacingError }'));
    } else {
      // Find the last import
      const lastImportIndex = content.lastIndexOf('import ');
      const endOfLastImport = content.indexOf('\n', lastImportIndex) + 1;
      
      // Calculate relative path to utils
      const depth = filePath.split('/').length - 4; // apps/web/src is 3
      const prefix = depth === 1 ? '../' : depth === 2 ? '../../' : '../../../';
      
      content = content.slice(0, endOfLastImport) + 
                `import { handleApiError, toUserFacingError } from '${prefix}utils/userFacingError';\n` + 
                content.slice(endOfLastImport);
    }
  }

  // 3. Replace simple client-side showToast errors with showError
  content = content.replace(/showToast\(([^,]+),\s*['"]error['"]\)/g, 'showError({ message: $1 })');

  // 4. Try to replace `if (!res.ok)` blocks with handleApiError
  // This is tricky with regex, so we'll look for specific patterns
  const resOkPattern = /const (data|resData) = await res\.json\(\)[^;]*;\s*if \(!res\.ok\) \{[^{}]*showError\([^;]+;\s*(throw|return)[^}]*\}/g;
  
  // We'll leave the complex AST transformations for manual if needed, 
  // but let's replace catch blocks:
  content = content.replace(/catch \(([^)]+)\) \{\s*(?:console\.error[^;]+;)?\s*showError\(\{ message:[^}]+\} \);\s*\}/g, 
    'catch ($1) { showError({ message: $1 instanceof Error ? $1.message : String($1) }); }');
    
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

phase1Files.forEach(processFile);
