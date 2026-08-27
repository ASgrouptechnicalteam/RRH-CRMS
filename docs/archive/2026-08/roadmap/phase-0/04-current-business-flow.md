# RRH-CRMS Current Business Flow

## Overview
This document maps the actual business flow implemented in the codebase right now. It does not reflect aspirational future features.

## 1. Lead Generation & Assignment
1. **Creation**: Leads are entered into the system manually by a user or via the Bulk CSV importer in `LeadManagement.tsx`.
2. **Assignment**: Leads are routed to active Telecallers based on a weighted performance distribution algorithm (or manually overridden).
3. **Status**: Lead enters the system as `NEW`.

## 2. Lead Qualification & Property Matching
1. **Dossier & Matching**: Telecallers view the Lead Dossier. The Auto-Matching engine compares the Lead's `LeadMatchingRequirement` (budget, location, property type) against the LIVE `Property` inventory.
2. **Saved Interests**: Telecallers present matches. If the lead is interested, the property is saved to `LeadPropertyInterest` (acting as a lightweight opportunity link).
3. **Status**: Lead status updates to `CONTACTED` or `QUALIFIED`.

## 3. Site Visit Orchestration
1. **Booking**: Telecaller schedules a Site Visit for a specific Lead (and optionally a specific `Property`). Booking enters `PENDING_VERIFICATION` state.
2. **Schedule Verification**: The Telecaller (or Project Manager) calls the customer to confirm the appointment. Booking moves to `CONFIRMED`.
3. **Agent Dispatch**: The PM assigns an on-the-ground Field Agent. Booking moves to `ASSIGNED_TO_AGENT`.
4. **Execution**: The Field Agent conducts the visit, then records feedback notes, client interest rating (HOT, WARM, COLD), and uploads a proof photo. Booking moves to `COMPLETED`.
5. **Status**: Lead status formally transitions to `SITE_VISIT_SCHEDULED` during this phase.

## 4. Opportunity Lifecycle & Closure
1. **Negotiation**: The system allows manual status updates on the Lead to `NEGOTIATION`.
2. **Closure**: The Lead is manually marked as `WON` or `LOST`.
3. **Missing Flows**: 
   - There is no formal `Booking` (financial) model.
   - There is no `Payment` schedule model.
   - There is no `Customer` conversion flow separate from the `Lead` object.
   - Payouts to Channel Partners (`CPPayout`) are processed independently via Finance approvals.
