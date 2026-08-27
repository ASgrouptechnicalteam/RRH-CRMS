# RRH-CRMS Target Gap Analysis

## Target Business Flow Gap Analysis

This compares the actual repository against the target flow:

1. **MARKETING**
   - 🟡 PARTIAL: Source tagging exists on Leads (`Lead.source`), but no robust Campaign tracking.
2. **LEAD**
   - ✅ EXISTING: `Lead` model and `LeadManagement.tsx` handle full ingestion, bulk uploads, and assignment logic.
3. **QUALIFICATION**
   - ✅ EXISTING: Handled via `Lead.status`, `LeadActivity` tracking, and dossier tabs.
4. **CUSTOMER**
   - ❌ MISSING: The system does not graduate a Lead into a concrete `Customer` record. A Lead persists indefinitely.
5. **OPPORTUNITY**
   - ⚠️ DUPLICATED / CONFLICTING: The system uses `Lead` to track sales stages. An independent `Opportunity` object does not exist.
6. **PROPERTY / PROJECT MATCHING**
   - ✅ EXISTING: `LeadMatchingRequirement` and `LeadPropertyInterest` manage auto-matching.
7. **SITE VISIT**
   - ✅ EXISTING: Highly developed `SiteVisitBooking` entity with dedicated multi-actor workflows.
8. **NEGOTIATION**
   - 🟡 PARTIAL: Exists only as a string state on the `Lead` object (`status = 'NEGOTIATION'`).
9. **BOOKING**
   - ❌ MISSING: Financial booking/reservation contracts do not exist.
10. **PAYMENT**
    - ❌ MISSING: Milestone payments, collections, and receipts are completely absent.
11. **DOCUMENTS**
    - ❌ MISSING: Legal agreement generation and signed document storage do not exist.
12. **CUSTOMER / AFTER-SALES**
    - ❌ MISSING: Post-sale lifecycle tracking does not exist.
13. **REFERRAL / REPEAT BUSINESS**
    - ❌ MISSING: No dedicated mechanism for repeat business generation.
