const fs = require('fs');

const files = [
  // Phase 2
  'apps/web/src/components/properties/AddPropertyWizard.tsx',
  'apps/web/src/components/properties/EditPropertyModal.tsx',
  'apps/web/src/components/properties/PropertyManagement.tsx',
  'apps/web/src/components/projects/ProjectFormWizard.tsx',
  'apps/web/src/components/projects/ProjectManagement.tsx',
  'apps/web/src/components/projects/ProjectDossier.tsx',
  // Phase 3
  'apps/web/src/components/employees/AddEmployeeWizard.tsx',
  'apps/web/src/components/auth/FirstLoginSetup.tsx',
  'apps/web/src/components/md/RoleAssignmentPage.tsx',
  // Phase 4
  'apps/web/src/components/commercial/CreateBookingModal.tsx',
  'apps/web/src/components/commercial/BookingDossier.tsx',
  'apps/web/src/components/commercial/RecordPaymentModal.tsx',
  'apps/web/src/components/system/SystemControlHub.tsx',
  'apps/web/src/components/md/PMTerritories.tsx',
  'apps/web/src/components/dashboards/AdminCommandCenter.tsx',
  'apps/web/src/components/admin/AdminAnalyticsPortal.tsx'
];

function processFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. catch (err) -> showError(toUserFacingError({ message: err?.message, body: err }))
  content = content.replace(/catch\s*\(([^)]+)\)\s*\{([^}]*?)showError\(\{\s*message\s*:\s*([^}]+)\}\s*\);?\s*\}/g, (match, errVarRaw, before, msgExpression) => {
    if (msgExpression.includes('toUserFacingError')) return match;
    const errVar = errVarRaw.split(':')[0].trim();
    return `catch (${errVarRaw}) {${before}showError(toUserFacingError({ message: ${errVar} instanceof Error ? ${errVar}.message : String(${errVar}), body: ${errVar} })); }`;
  });

  // 2. !res.ok blocks
  content = content.replace(/else\s*\{\s*showError\(\{\s*message\s*:\s*([^.]+)\.error[^}]+\}\s*\);?\s*\}/g, (match, dataVar) => {
    return `else {\n          await handleApiError(res, showError, ${dataVar});\n        }`;
  });

  content = content.replace(/if\s*\(!res\.ok\)\s*\{\s*showError\(\{\s*message\s*:\s*([^.]+)\.error[^}]+\}\s*\);?\s*return;?\s*\}/g, (match, dataVar) => {
    return `if (!res.ok) {\n          await handleApiError(res, showError, ${dataVar});\n          return;\n        }`;
  });

  // 3. Simple replacements
  content = content.replace(/showError\(\{\s*message\s*:\s*([^.]+)\.error\s*\|\|[^}]+\}\)/g, (match, dataVar) => {
    if (match.includes('res.') || match.includes('err.') || match.includes('e.')) return match;
    return `await handleApiError(res, showError, ${dataVar})`;
  });

  if (content !== originalContent && (!content.includes('handleApiError') || !content.includes('toUserFacingError'))) {
    const importRegex = /import .* from '.*\/userFacingError';/;
    if (importRegex.test(content)) {
      content = content.replace(importRegex, (match) => {
          let inner = match;
          if (!inner.includes('handleApiError')) inner = inner.replace('}', ', handleApiError }');
          if (!inner.includes('toUserFacingError')) inner = inner.replace('}', ', toUserFacingError }');
          return inner.replace(/, ,/g, ',');
      });
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

files.forEach(processFile);
