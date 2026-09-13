# Sonthillu V1 Remaining Work Roadmap

This document outlines the required path to reach V1 Production Readiness, ordered by the official P0–P10 phases from the V1 Blueprint.

### CURRENT STATE SUMMARY

- **P0-P3 (Discovery & Core Foundation)**: Largely complete. Minor refinements to search filters and legal pages remain.
- **P4-P5 (Customer & Seller)**: Partially implemented but fundamentally out-of-spec regarding Customer DB architecture and blocked by CRM integration.
- **P6 (Recommendations)**: UI scaffolding exists; analytics and real tracking are missing.
- **P7 (AI Search)**: Not implemented.
- **P8 (Admin & Analytics)**: Not implemented (only a local UI mock exists).
- **P9-P10 (Hardening & Launch)**: To be completed.

---

### Phase Roadmap

#### P4: Customer Conversion (Architecture Reconciliation)

- **What is already done:** Shortlist, Compare UI, Session logic, Login/Register UI.
- **What remains:** As per Blueprint Section 17, Sonthillu must have a dedicated Website DB (MySQL) for customers, authentication, sessions, and website preferences, independent of the CRM. The recent mock provider architecture assumed CRM would eventually handle customer identity, which is explicitly out-of-spec.
- **What can be done without CRM:**
  - Spin up MySQL DB using Prisma as defined in the blueprint.
  - Implement real authentication (hashing, email verification, sessions) against the Sonthillu DB.
- **What requires CRM:** N/A for auth; enquiries/calls still require CRM API.
- **Requires Business Decision:** Acknowledge and approve the architectural pivot back to the V1 Blueprint (separate Website DB).

#### P5: Seller

- **What is already done:** Seller onboarding UI, Submit Property UI.
- **What remains:** Wire the submission form to the CRM Intake API. Ensure submissions do NOT automatically publish.
- **What requires CRM:** CRM API endpoint for seller property intake.

#### P6: Recommendations

- **What is already done:** Basic recommendation layout and UI (Similar Properties).
- **What remains:** Implement behavioral signal tracking (Search, View, Shortlist, Compare, Enquiry, Site visit) and use it to power real recommendations.
- **What can be done without CRM:** Build the analytics tracking and rules-engine for recommendations in the Website DB.

#### P7: AI Search

- **What is already done:** Nothing.
- **What remains:** Implement natural language interpretation, schema validation, multilingual support, and matching integration.
- **What requires external infrastructure:** Abstracted AI Model Provider (OpenAI/Anthropic/Gemini) hosted independently from the main Hostinger Business server.

#### P8: Website Admin + Analytics

- **What is already done:** Local UI preview for Hero Carousel.
- **What remains:** Build a secure, production-ready admin panel to view analytics, zero-result searches, and configure featured content.
- **What can be done without CRM:** Build the Admin panel on the Website DB.

#### P9: Hardening

- **What is already done:** Basic SEO, HTTPS assumptions.
- **What remains:** Implementation of strict rate limiting, CSRF tokens, secure header configurations, and final accessibility audits.

#### P10: Launch Readiness

- **What remains:** Hostinger staging deployment, environment variable configuration, DB migrations, and monitoring setup.
