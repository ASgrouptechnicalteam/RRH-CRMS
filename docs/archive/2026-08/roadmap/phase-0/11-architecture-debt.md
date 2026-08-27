# RRH-CRMS Architecture Debt & Duplication

## Overview
This document identifies areas of technical debt, duplication, and conceptual conflicts in the repository that should be addressed (or avoided) in future phases.

## Conceptual Debt (CRM Model)
- **Overloaded Lead Object**: The `Lead` entity handles marketing ingestion, sales qualification, property matching, and serves as the ultimate "deal" object. It needs to be conceptually broken into `Lead`, `Customer`, and `Opportunity`.
- **Missing Financial Core**: Payouts and Expense Refunds exist, but core real estate objects like `Booking`, `PaymentSchedule`, and `Payment` do not exist.

## Structural Debt
- **Hardcoded Capabilities**: UI components frequently rely on hardcoded array lookups of role names (`user.roles.includes('MD')`) rather than granular capabilities. 
- **Fat Controllers vs Services**: Some API routes may contain business logic rather than delegating purely to `services/`.
- **Duplicate Authorization Logic**: Checks for `company_id` matching are sometimes performed manually in services instead of strictly passing through a unified scope-builder, though `dataScope.ts` attempts to centralize this.

## Frontend Debt
- **Monolithic Components**: Files like `LeadManagement.tsx` are exceedingly large due to encompassing lists, tables, modals, and multiple dossier tabs. 
- **Missing Design Tokens**: TailwindCSS is heavily utilized, but raw colors (e.g., `text-slate-500`) are scattered instead of unified design tokens matching the "RRH / Sonthillu corporate enterprise CRM" brand.
