# P6 Privacy & Retention Policy

## 1. Identity Boundaries

- **Anonymous Users**: Tracked using a strict first-party HttpOnly cookie (`sonthillu_anon_id`).
- **Authenticated Users**: Tracked using their database `customerId`.
- **CRM Boundary**: Behavioral intelligence is strictly isolated from the RRH CRM. The CRM remains the system of record for real estate transactions, leads, and customer lifecycle. The Sonthillu Web DB acts as a volatile activity tracking layer. We DO NOT sync anonymous browsing behavior into CRM leads unless the user explicitly converts (e.g., submits an enquiry).

## 2. Retention Limits

- The recommendation engine inherently ignores signals older than 90 days.
- Over time, a cron job or background process should prune `ActivityEvent` records older than 90 days to prevent unbounded database growth and respect user privacy limits.
- If a customer deletes their account, the relational constraint (`onDelete: SetNull`) detaches activities but we should implement an explicit GDPR/DPDP delete pass to wipe their `ActivityEvent` records completely.

## 3. Data Collection Scope

We only track intent signals relevant to real estate matching:

- Locations (city, locality).
- Budgets (price ranges).
- Property Types (apartments, villas, etc.).
- Interactions (views, clicks, shortlists, enquires, calls).
  We do NOT track or store arbitrary keystrokes, third-party cookies, or cross-site tracking pixels as part of this behavioral engine.
