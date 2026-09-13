const CRM_API_BASE_URL = 'https://rs-crms.onrender.com/api/v1';
const CRM_API_KEY = 'sk_pro_llu_0d78fcb987f772be80338ddc0649b69e';

async function main() {
  console.log('=== Phase 5: Lead Lifecycle Verification ===\n');

  const types = [
    { type: 'property', label: 'Property Enquiry' },
    { type: 'call', label: 'Callback Request' },
    { type: 'other', label: 'General Enquiry' },
    { type: 'appraisal', label: 'Seller Enquiry' },
    { type: 'project', label: 'Project Enquiry' },
    { type: 'consultation', label: 'Consultation' },
  ];

  const ts = Date.now();
  let success = 0;
  let failure = 0;

  for (const { type, label } of types) {
    try {
      const r = await fetch(`${CRM_API_BASE_URL}/public/sonthillu/leads`, {
        method: 'POST',
        headers: {
          'x-api-key': CRM_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: `LC-${type}`,
          phone: `98765${Math.floor(Math.random() * 90000) + 10000}`,
          email: `lc${ts}@testmail.in`,
          enquiry_type: type,
          utm_source: 'phase5-verify',
          utm_medium: 'manual-test',
          notes: `Phase 5 lead lifecycle verification - ${label}`,
          idempotencyKey: `lc-${type}-${ts}`,
        }),
        cache: 'no-store',
      });

      const d = await r.json();
      const ok = r.status === 201;
      if (ok) success++;
      else failure++;
      console.log(`${label} (${type}): ${r.status} -> ${JSON.stringify(d)}`);
    } catch (e: any) {
      failure++;
      console.log(`${label} (${type}): ❌ ${e.message}`);
    }
  }

  console.log(`\n=== Summary: ${success} success, ${failure} failure ===`);

  console.log('\n=== Integration Mapping ===');
  console.log('Website enquiry type → CRM enquiry_type:');
  console.log('  PROPERTY_ENQUIRY     → property');
  console.log('  CALLBACK_REQUEST     → call');
  console.log('  GENERAL_ENQUIRY      → other');
  console.log('  SELLER_ENQUIRY       → appraisal');
  console.log('  PROJECT_ENQUIRY      → project');
  console.log('  MULTI_PROPERTY_ENQUIRY → property (via property_ids[])');
  console.log('  (All map through CrmLeadPayload.enquiry_type field)');
}

main();
