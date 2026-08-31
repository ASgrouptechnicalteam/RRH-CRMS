const fs = require('fs');

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
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. catch (err) -> showError(toUserFacingError({ message: err?.message, body: err }))
  // We match catch (xxx) { showError({ message: ... }) }
  content = content.replace(/catch\s*\(([^)]+)\)\s*\{([^}]*?)showError\(\{\s*message\s*:\s*([^}]+)\}\s*\);?\s*\}/g, (match, errVar, before, msgExpression) => {
    // If it already uses toUserFacingError, skip
    if (msgExpression.includes('toUserFacingError')) return match;
    return `catch (${errVar}) {${before}showError(toUserFacingError({ message: ${errVar} instanceof Error ? ${errVar}.message : String(${errVar}), body: ${errVar} })); }`;
  });

  // 2. !res.ok blocks
  // Common pattern:
  // const data = await res.json();
  // if (res.ok) { ... } else { showError({ message: data.error || '...' }); }
  content = content.replace(/else\s*\{\s*showError\(\{\s*message\s*:\s*([^.]+)\.error[^}]+\}\s*\);?\s*\}/g, (match, dataVar) => {
    return `else {\n          await handleApiError(res, showError, ${dataVar});\n        }`;
  });

  // pattern: if (!res.ok) { showError({ message: data.error || '...' }); return; }
  content = content.replace(/if\s*\(!res\.ok\)\s*\{\s*showError\(\{\s*message\s*:\s*([^.]+)\.error[^}]+\}\s*\);?\s*return;?\s*\}/g, (match, dataVar) => {
    return `if (!res.ok) {\n          await handleApiError(res, showError, ${dataVar});\n          return;\n        }`;
  });

  // 3. Simple replacements where it was `showError({ message: data.error })`
  content = content.replace(/showError\(\{\s*message\s*:\s*([^.]+)\.error\s*\|\|[^}]+\}\)/g, (match, dataVar) => {
    if (match.includes('res.') || match.includes('err.') || match.includes('e.')) return match; // skip if not simple data
    return `await handleApiError(res, showError, ${dataVar})`;
  });

  // Make sure we have handleApiError and toUserFacingError imported
  if (content !== originalContent && (!content.includes('handleApiError') || !content.includes('toUserFacingError'))) {
    const importRegex = /import .* from '.*\/userFacingError';/;
    if (importRegex.test(content)) {
      content = content.replace(importRegex, (match) => match.replace('}', ', handleApiError, toUserFacingError }').replace(/, ,/g, ',').replace(/toUserFacingError, toUserFacingError/, 'toUserFacingError').replace(/handleApiError, handleApiError/, 'handleApiError'));
    } else {
      const lastImportIndex = content.lastIndexOf('import ');
      const endOfLastImport = content.indexOf('\n', lastImportIndex) + 1;
      const depth = filePath.split('/').length - 4;
      const prefix = depth === 1 ? '../' : depth === 2 ? '../../' : '../../../';
      content = content.slice(0, endOfLastImport) + 
                `import { handleApiError, toUserFacingError } from '${prefix}utils/userFacingError';\n` + 
                content.slice(endOfLastImport);
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

phase1Files.forEach(processFile);
