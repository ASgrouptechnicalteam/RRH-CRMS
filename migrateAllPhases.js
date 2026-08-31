const fs = require('fs');

const allPhases = [
  // Phase 1
  'apps/web/src/components/leads/LeadManagement.tsx',
  'apps/web/src/components/leads/AddLeadWizard.tsx',
  'apps/web/src/components/leads/QuickAddLeadModal.tsx',
  'apps/web/src/components/siteVisits/SiteVisitManagement.tsx',
  'apps/web/src/components/sales/SalesPipelineManagement.tsx',
  'apps/web/src/components/customers/CustomerManagement.tsx',
  'apps/web/src/components/common/ReassignModal.tsx',
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
  // ChangePasswordModal doesn't seem to exist from previous grep
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

  // Ensure `showError` is extracted
  if (content.includes('useToast()') && !content.includes('showError')) {
    content = content.replace(/const {([^}]*showToast[^}]*)} = useToast\(\);/g, (match, inner) => {
      if (inner.includes('showError')) return match;
      return `const {${inner}, showError } = useToast();`;
    });
    content = content.replace(/const {\s*showToast\s*} = useToast\(\);/g, 'const { showToast, showError } = useToast();');
  }

  // Ensure imports
  if (!content.includes('handleApiError')) {
    const importRegex = /import .* from '.*\/userFacingError';/;
    if (importRegex.test(content)) {
      content = content.replace(importRegex, (match) => {
        if(match.includes('handleApiError')) return match;
        return match.replace('}', ', handleApiError, toUserFacingError }');
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

  // Basic replacements
  content = content.replace(/showToast\(([^,]+),\s*['"]error['"]\)/g, 'showError({ message: $1 })');
  
  // Try to replace boilerplate API error handling
  // const data = await res.json(); if(!res.ok) { showToast(...); throw ... }
  // Since it varies wildly, I'll use a regex that matches the pattern block
  
  // It's safer to just let the script do the easy replacements, and we manually fix any compilation errors later.

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

allPhases.forEach(processFile);
